import {randomInt,randomUUID} from 'node:crypto';
import {CHARACTERS,TRAPS,WORLD,distance,walkable,type Character,type GameEvent,type Input,type Player,type RoomState,type Treasure} from '../shared/game.js';
export interface Member {player:Player;token:string;socketId:string|null;disconnectedAt:number;input:Input;inputAt:number}
export class Room {
 state:RoomState; members=new Map<string,Member>(); idleSince=0; private eventId=0;
 constructor(code:string,duration=180_000) {this.state={code,hostId:'',phase:'lobby',players:[],treasures:[],startedAt:0,endsAt:0,countdownEndsAt:0,serverTime:Date.now(),events:[],round:0,duration,clue:'The old island keeps its best secrets beneath the sand. Follow the golden sparkles and dig nearby.'};}
 add(name:string,character:Character,socketId:string) {
  if(this.state.phase!=='lobby') throw Error('This expedition has already started. Join the next round.');
  if(this.members.size>=6) throw Error('This crew is full (6 explorers).');
  const free=CHARACTERS.find(c=>![...this.members.values()].some(m=>m.player.character===c.id));
  if([...this.members.values()].some(m=>m.player.character===character)) character=free!.id;
  const player:Player={id:randomUUID(),name,character,x:180+this.members.size*170,y:650,score:0,coins:0,missionDone:false,ready:false,connected:true,speedUntil:0,shieldUntil:0,stunUntil:0,lastTrap:0,lastDig:0,lastSeq:-1};
  const m:Member={player,token:randomUUID()+randomUUID(),socketId,disconnectedAt:0,input:{x:0,y:0,dig:false,seq:0},inputAt:0};
  this.members.set(player.id,m);if(!this.state.hostId)this.state.hostId=player.id;this.syncPlayers(); return m;
 }
 syncPlayers(){this.state.players=[...this.members.values()].map(m=>m.player);}
 event(text:string,kind:GameEvent['kind']='system',p?:Player){this.state.events.push({id:++this.eventId,text,kind,playerId:p?.id,x:p?.x,y:p?.y});this.state.events=this.state.events.slice(-8);}
 choose(id:string,character:Character){if(this.state.phase!=='lobby')throw Error('Choose your explorer in the lobby.');if([...this.members.values()].some(m=>m.player.id!==id&&m.player.character===character))throw Error('That explorer is already taken.');this.members.get(id)!.player.character=character;}
 start(id:string,now:number){if(id!==this.state.hostId)throw Error('Only the captain can start.');if(this.state.phase!=='lobby')throw Error('A round is already underway.');const active=[...this.members.values()].filter(m=>m.player.connected);if(active.length<2)throw Error('Invite at least one friend to begin.');if(active.some(m=>!m.player.ready))throw Error('Every explorer must be ready.');
  for(const [key,m] of this.members)if(!m.player.connected)this.members.delete(key);
  this.syncPlayers();this.state.round++;this.state.phase='countdown';this.state.countdownEndsAt=now+3000;this.state.events=[];this.state.treasures=this.generate();
  this.state.players.forEach((p,i)=>{Object.assign(p,{x:180+i*170,y:650,score:0,coins:0,missionDone:false,speedUntil:0,shieldUntil:0,stunUntil:0,lastTrap:0,lastDig:0,lastSeq:-1});const m=this.members.get(p.id)!;m.input={x:0,y:0,dig:false,seq:0};m.inputAt=0;});
 }
 generate(){const items:Treasure[]=[];
  const put=(x:number,y:number,kind:Treasure['kind'])=>items.push({id:randomUUID(),x,y,kind,active:true,hidden:kind==='chest',respawnAt:0});
  for(let i=0;i<6;i++){put(180+i*170,595,'coin');put(180+i*170,545,'coin');}
  for(let i=0;i<58;i++){let p;do{p={x:randomInt(125,1155),y:randomInt(125,610)};}while(!walkable(p,38)||TRAPS.some(t=>distance(p!,t)<65)||items.some(t=>distance(p!,t)<43));put(p.x,p.y,i<32?'coin':i<44?'diamond':i<50?'chest':i<54?'boots':'shield');}
  return items;
 }
 input(id:string,input:Input,now:number){const m=this.members.get(id);if(!m||input.seq<=m.player.lastSeq)return; m.player.lastSeq=input.seq;m.input=input;m.inputAt=now;}
 disconnect(id:string,now:number){const m=this.members.get(id);if(!m)return;m.player.connected=false;m.player.ready=false;m.socketId=null;m.disconnectedAt=now;m.input={x:0,y:0,dig:false,seq:0};if(this.state.hostId===id){const next=[...this.members.values()].find(x=>x.player.connected);if(next)this.state.hostId=next.player.id;}this.event(`${m.player.name} disconnected. Their place is reserved for 45 seconds.`);}
 resume(id:string,token:string,socketId:string,now:number){const m=this.members.get(id);if(!m||m.token!==token)throw Error('Your session could not be restored. Please join again.');if(!m.player.connected&&now-m.disconnectedAt>45000)throw Error('Your reconnection window expired. Join the next round.');const oldSocket=m.socketId;m.socketId=socketId;m.player.connected=true;m.disconnectedAt=0;m.inputAt=0;m.player.lastSeq=-1;if(!this.members.get(this.state.hostId)?.player.connected)this.state.hostId=id;this.event(`${m.player.name} is back on the island.`);return {m,oldSocket};}
 leave(id:string,now:number){if(this.state.phase==='lobby'||this.state.phase==='finished'){this.members.delete(id);if(this.state.hostId===id)this.state.hostId=[...this.members.keys()][0]??'';this.syncPlayers();}else{this.disconnect(id,now);this.members.get(id)!.disconnectedAt=now-45001;}}
 reset(id:string){if(id!==this.state.hostId)throw Error('Only the captain can open the next expedition.');if(this.state.phase!=='finished')throw Error('Finish this expedition first.');for(const [key,m] of this.members)if(!m.player.connected)this.members.delete(key);this.state.phase='lobby';this.state.treasures=[];this.state.events=[];this.state.players.forEach(p=>p.ready=false);this.syncPlayers();}
 tick(now:number,dt:number){this.state.serverTime=now;
  if(this.state.phase==='lobby'){for(const [id,m] of this.members)if(!m.player.connected&&now-m.disconnectedAt>45000)this.members.delete(id);this.syncPlayers();}
  if(this.state.phase==='countdown'&&now>=this.state.countdownEndsAt){this.state.phase='playing';this.state.startedAt=now;this.state.endsAt=now+this.state.duration;this.event('The treasure rush is on!');}
  if(this.state.phase!=='playing')return false;
  if(now>=this.state.endsAt){this.state.phase='finished';this.event('Expedition complete!');return true;}
  for(const m of this.members.values()){
   const p=m.player;if(!p.connected)continue;const input=now-m.inputAt<350?m.input:{x:0,y:0,dig:false};
   const norm=Math.max(1,Math.hypot(input.x,input.y));const speed=now<p.stunUntil?0:now<p.speedUntil?300:210;
   const step=Math.min(dt,0.075)*speed;const nx={x:p.x+input.x/norm*step,y:p.y};if(walkable(nx))p.x=nx.x;const ny={x:p.x,y:p.y+input.y/norm*step};if(walkable(ny))p.y=ny.y;
   if(TRAPS.some(t=>distance(p,t)<t.r+10)&&now-p.lastTrap>1800){p.lastTrap=now;if(p.shieldUntil>now){p.shieldUntil=0;this.event(`${p.name}'s shield blocked a trap.`,'reward',p);}else{p.score=Math.max(0,p.score-20);p.stunUntil=now+850;this.event(`${p.name} hit a trap! −20`,'trap',p);}}
   for(const t of this.state.treasures){if(!t.active)continue;if(t.hidden&&distance(p,t)<125)t.hidden=false;if(distance(p,t)>(t.kind==='chest'?65:27))continue;if(t.kind==='chest'&&(!input.dig||now-p.lastDig<500))continue;
    t.active=false;t.respawnAt=t.kind==='chest'?0:now+22000;let value=0;
    if(t.kind==='coin'){value=10;p.coins++;}if(t.kind==='diamond')value=35;if(t.kind==='chest'){value=[50,75,100][randomInt(3)];p.lastDig=now;}
    if(t.kind==='boots')p.speedUntil=now+6000;if(t.kind==='shield')p.shieldUntil=now+12000;
    p.score+=value;this.event(`${p.name}: ${t.kind==='boots'?'speed boost!':t.kind==='shield'?'shield equipped!':`+${value} ${t.kind==='chest'?'mystery treasure!':t.kind}`}`,'reward',p);
    if(p.coins>=8&&!p.missionDone){p.missionDone=true;p.score+=80;this.event(`${p.name} completed Coin Collector! +80`,'reward',p);}
   }
  }
  for(const t of this.state.treasures)if(!t.active&&t.respawnAt&&now>=t.respawnAt){t.active=true;t.respawnAt=0;}
  return false;
 }
}
