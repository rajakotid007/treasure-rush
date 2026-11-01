import {test} from 'node:test';
import assert from 'node:assert/strict';
import {io,type Socket} from 'socket.io-client';
import {createGameServer} from '../server/app.js';
import type {Reply,RoomState,Session} from '../shared/game.js';
const sleep=(n:number)=>new Promise(r=>setTimeout(r,n));
function ask(s:Socket,event:string,data:unknown={}):Promise<Reply>{return new Promise((resolve,reject)=>s.timeout(3000).emit(event,data,(e:Error|null,v:Reply)=>e?reject(e):resolve(v)));}
async function waitFor(test:()=>boolean,ms=6000){const end=Date.now()+ms;while(!test()){if(Date.now()>end)throw Error('Timed out waiting for synchronized state');await sleep(30);}}
test('real Socket.IO: six clients, isolation, server input validation, score sync, reconnect and replay',async()=>{
 const server=createGameServer({duration:2500});await new Promise<void>(resolve=>server.http.listen(0,'127.0.0.1',resolve));const address=server.http.address() as {port:number};const url=`http://127.0.0.1:${address.port}`;const sockets:Socket[]=[];const states=new Map<Socket,RoomState>();
 const connect=async()=>{const s=io(url,{transports:['websocket'],forceNew:true});sockets.push(s);s.on('state',state=>states.set(s,state));await new Promise<void>((resolve,reject)=>{s.once('connect',resolve);s.once('connect_error',reject);});return s;};
 try{const crew=await Promise.all(Array.from({length:6},connect));const reply=await ask(crew[0],'room:create',{name:'Ada',character:'fox'});assert.ok(reply.ok&&reply.session);const session=(reply as {ok:true;session:Session}).session;
  for(let i=1;i<6;i++)assert.ok((await ask(crew[i],'room:join',{code:session.code,name:`P${i}`,character:'fox'})).ok);
  await waitFor(()=>crew.every(s=>states.get(s)?.players.length===6));assert.equal(new Set(states.get(crew[0])!.players.map(p=>p.character)).size,6);
  const extra=await connect();const full=await ask(extra,'room:join',{code:session.code,name:'Seven',character:'cat'});assert.ok(!full.ok&&/full/.test(full.error));
  const other=await ask(extra,'room:create',{name:'Other','character':'cat'});assert.ok(other.ok);await waitFor(()=>states.get(extra)?.players.length===1);
  assert.ok(!(await ask(crew[1],'game:start')).ok);
  for(const s of crew)assert.ok((await ask(s,'player:ready',true)).ok);assert.ok((await ask(crew[0],'game:start')).ok);await waitFor(()=>crew.every(s=>states.get(s)?.phase==='playing'));
  const actual=server.rooms.get(session.code)!;const initial=actual.members.get(session.playerId)!.player;const x=initial.x,y=initial.y;
  crew[0].emit('input',{x:999,y:0,dig:false,seq:1,score:999999});await sleep(100);assert.equal(initial.x,x);assert.equal(initial.score,0);
  for(let seq=1;seq<=8;seq++){crew[0].emit('input',{x:0,y:-1,dig:false,seq});await sleep(50);}crew[0].emit('input',{x:0,y:0,dig:false,seq:9});
  await waitFor(()=>crew.every(s=>(states.get(s)?.players.find(p=>p.id===session.playerId)?.score??0)>0));assert.ok(initial.y<y);const score=initial.score;
  assert.ok(states.get(extra)!.players.every(p=>p.id!==session.playerId));assert.equal(states.get(extra)!.phase,'lobby');
  crew[0].disconnect();await waitFor(()=>!actual.members.get(session.playerId)!.player.connected);const restored=await connect();const invalid=await ask(restored,'room:resume',{...session,token:'x'.repeat(72)});assert.ok(!invalid.ok);assert.ok((await ask(restored,'room:resume',session)).ok);assert.equal(actual.members.get(session.playerId)!.player.score,score);
  await waitFor(()=>states.get(restored)?.phase==='finished');const endScores=states.get(restored)!.players.map(p=>p.score);await sleep(150);assert.deepEqual(states.get(restored)!.players.map(p=>p.score),endScores);
  const captain=actual.members.get(actual.state.hostId)!.socketId!;const captainSocket=sockets.find(s=>s.id===captain)!;assert.ok((await ask(captainSocket,'game:again')).ok);await waitFor(()=>states.get(restored)?.phase==='lobby');assert.ok(actual.state.players.every(p=>!p.ready));
 }finally{for(const s of sockets)s.disconnect();await server.close();}
});
