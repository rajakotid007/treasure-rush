import express from 'express';
import helmet from 'helmet';
import {createServer} from 'node:http';
import {randomInt} from 'node:crypto';
import {Server, type Socket} from 'socket.io';
import {z} from 'zod';
import {Room} from './engine.js';
import {CHARACTERS,type Reply} from '../shared/game.js';
import {saveMatch} from './storage.js';
import {treasureNarrative} from './treasure-master.js';
export function createGameServer(options:{duration?:number;allowedOrigins?:string[]}={}){
 const app=express();app.disable('x-powered-by');app.use(helmet({contentSecurityPolicy:false}));const http=createServer(app);const origins=options.allowedOrigins??[];
 const io=new Server(http,{maxHttpBufferSize:4096,serveClient:false,cors:origins.length?{origin:origins,credentials:false}:undefined,allowRequest:(req,cb)=>{const origin=req.headers.origin;let same=false;try{same=!!origin&&new URL(origin).host===req.headers.host;}catch{}cb(null,!origin||same||origins.includes(origin));}});
 const rooms=new Map<string,Room>();const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 const character=z.enum(CHARACTERS.map(c=>c.id) as ['fox','frog','raccoon','cat','bear','rabbit']);
 const identity=z.object({name:z.string().trim().min(1).max(18).regex(/^[\p{L}\p{N} _.-]+$/u,'Use letters, numbers, spaces, . _ or -.'),character});
 const code=z.string().trim().toUpperCase().regex(/^[A-Z2-9]{6}$/);
 app.get('/api/health',(_req,res)=>res.json({ok:true,service:'treasure-rush',rooms:rooms.size}));
 function broadcast(room:Room){io.to(room.state.code).emit('state',{...room.state,treasures:room.state.treasures.filter(t=>!t.hidden)});}
 function located(s:Socket){const r=rooms.get(s.data.code);if(!r||!r.members.has(s.data.playerId)||r.members.get(s.data.playerId)?.socketId!==s.id)throw Error('Please join a room first.');return r;}
 io.on('connection',s=>{
  let budget=120,reset=Date.now(),commands=20,commandReset=Date.now();
  s.use((_packet,next)=>{const now=Date.now();if(now-reset>1000){budget=120;reset=now;}if(--budget<0){s.disconnect(true);return;}next();});
  function command(event:string,handler:(data:unknown)=>Reply){s.on(event,(data,ack)=>{if(typeof ack!=='function')return;try{const now=Date.now();if(now-commandReset>10000){commands=20;commandReset=now;}if(--commands<0)throw Error('Please slow down and try again shortly.');ack(handler(data));}catch(e){ack({ok:false,error:e instanceof z.ZodError?e.issues[0].message:e instanceof Error?e.message:'Unable to complete that action.'});}});}
  function detach(){if(!s.data.code)return;const old=rooms.get(s.data.code);if(old){old.leave(s.data.playerId,Date.now());broadcast(old);}s.leave(s.data.code);s.data.code=undefined;s.data.playerId=undefined;}
  function attach(room:Room,m:ReturnType<Room['add']>){s.data.code=room.state.code;s.data.playerId=m.player.id;s.join(room.state.code);broadcast(room);return {ok:true as const,session:{code:room.state.code,playerId:m.player.id,token:m.token}};}
  command('room:create',raw=>{const data=identity.parse(raw);if(rooms.size>=500)throw Error('All expeditions are occupied. Please try later.');detach();let roomCode='';do{roomCode=Array.from({length:6},()=>alphabet[randomInt(alphabet.length)]).join('');}while(rooms.has(roomCode));const room=new Room(roomCode,options.duration);rooms.set(roomCode,room);return attach(room,room.add(data.name,data.character,s.id));});
  command('room:join',raw=>{const d=identity.extend({code}).parse(raw);const room=rooms.get(d.code);if(!room)throw Error('Room not found. Check your six-character code.');if(s.data.code===d.code)throw Error('You are already in this room.');const member=room.add(d.name,d.character,s.id);detach();return attach(room,member);});
  command('room:resume',raw=>{const d=z.object({code,playerId:z.string().uuid(),token:z.string().length(72)}).parse(raw);const r=rooms.get(d.code);if(!r)throw Error('That expedition has ended. Create a new room.');const {m,oldSocket}=r.resume(d.playerId,d.token,s.id,Date.now());if(oldSocket&&oldSocket!==s.id)io.sockets.sockets.get(oldSocket)?.disconnect(true);if(s.data.code&&(s.data.code!==d.code||s.data.playerId!==d.playerId))detach();return attach(r,m);});
  command('player:character',raw=>{const r=located(s);r.choose(s.data.playerId,character.parse(raw));broadcast(r);return {ok:true};});
  command('player:ready',raw=>{const r=located(s);if(r.state.phase!=='lobby')throw Error('The expedition has started.');r.members.get(s.data.playerId)!.player.ready=z.boolean().parse(raw);broadcast(r);return {ok:true};});
  command('game:start',()=>{const r=located(s);r.start(s.data.playerId,Date.now());broadcast(r);if(r.state.round===1)void treasureNarrative().then(clue=>{r.state.clue=clue;broadcast(r);});return {ok:true};});
  command('game:again',()=>{const r=located(s);r.reset(s.data.playerId);broadcast(r);return {ok:true};});
  command('room:leave',()=>{detach();return {ok:true};});
  const input=z.object({x:z.number().finite().min(-1).max(1),y:z.number().finite().min(-1).max(1),dig:z.boolean(),seq:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)}).strict();
  s.on('input',raw=>{const parsed=input.safeParse(raw);if(!parsed.success)return;try{located(s).input(s.data.playerId,parsed.data,Date.now());}catch{}});
  s.on('disconnect',()=>{const r=rooms.get(s.data.code);if(r?.members.get(s.data.playerId)?.socketId===s.id){r.disconnect(s.data.playerId,Date.now());broadcast(r);}});
 });
 let last=Date.now();let ticks=0;const timer=setInterval(()=>{const now=Date.now();const dt=(now-last)/1000;last=now;ticks++;for(const [key,r] of rooms){const finished=r.tick(now,dt);if(finished)void saveMatch(r.state).catch(e=>console.error('Match persistence failed:',e.message));if(ticks%2===0||finished)broadcast(r);if(!r.state.players.some(p=>p.connected)){r.idleSince ||= now;if(now-r.idleSince>300000)rooms.delete(key);}else r.idleSince=0;if(r.members.size===0)rooms.delete(key);}},1000/30);
 async function close(){clearInterval(timer);await new Promise<void>(resolve=>io.close(()=>resolve()));if(http.listening)await new Promise<void>(resolve=>http.close(()=>resolve()));}
 return {app,http,io,rooms,close};
}
