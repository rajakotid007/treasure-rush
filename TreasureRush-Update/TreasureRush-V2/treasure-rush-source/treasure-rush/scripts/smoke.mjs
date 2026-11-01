import assert from 'node:assert/strict';
import {io} from 'socket.io-client';
const url=process.argv[2];
if(!url)throw Error('Usage: npm run test:deployed -- https://your-real-game-origin');
assert.ok((await (await fetch(new URL('/api/health',url))).json()).ok,'Health check failed');
const clients=[];const states=new Map();
const sleep=n=>new Promise(r=>setTimeout(r,n));
async function until(fn,timeout=15000){const end=Date.now()+timeout;while(!fn()){if(Date.now()>end)throw Error('Timed out waiting for authoritative state');await sleep(50);}}
const ask=(s,event,data={})=>new Promise((resolve,reject)=>s.timeout(8000).emit(event,data,(err,reply)=>err?reject(err):reply.ok?resolve(reply):reject(Error(reply.error))));
try{
 for(let i=0;i<6;i++){const s=io(url,{forceNew:true,transports:['websocket']});clients.push(s);s.on('state',state=>states.set(s,state));await new Promise((resolve,reject)=>{s.once('connect',resolve);s.once('connect_error',reject);});}
 const {session}=await ask(clients[0],'room:create',{name:'Smoke1',character:'fox'});
 for(let i=1;i<6;i++)await ask(clients[i],'room:join',{code:session.code,name:`Smoke${i+1}`,character:'fox'});
 for(const c of clients)await ask(c,'player:ready',true);
 await ask(clients[0],'game:start');await until(()=>clients.every(c=>states.get(c)?.phase==='playing'));
 assert.equal(states.get(clients[0]).endsAt-states.get(clients[0]).startedAt,180000,'Production round must last three minutes');
 for(let seq=0;seq<8;seq++){clients[0].emit('input',{x:0,y:-1,dig:false,seq});await sleep(50);}clients[0].emit('input',{x:0,y:0,dig:false,seq:8});
 await until(()=>clients.every(c=>(states.get(c)?.players.find(p=>p.id===session.playerId)?.score??0)>0));
 console.log('PASS: production health, six WebSocket players, authoritative three-minute clock, movement and synchronized reward.');
}finally{for(const c of clients){if(c.connected)try{await ask(c,'room:leave');}catch{}c.disconnect();}}
