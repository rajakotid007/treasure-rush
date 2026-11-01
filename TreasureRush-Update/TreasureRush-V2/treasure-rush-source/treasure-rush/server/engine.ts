import {randomInt,randomUUID} from 'node:crypto';
import {CHARACTERS,TRAPS,WORLD,SPAWNS,EVENT_INFO,comboMultiplier,distance,walkable,onLand,waterfallAt,CHEST_DIG_MS,RELIC_DIG_MS,type Character,type GameEvent,type Input,type Player,type RoomState,type Treasure,type IslandEvent} from '../shared/game.js';
export interface Member {player:Player;token:string;socketId:string|null;disconnectedAt:number;input:Input;inputAt:number}
export class Room {
 state:RoomState; members=new Map<string,Member>(); idleSince=0; private eventId=0;
 constructor(code:string,duration=180_000) {this.state={code,hostId:'',phase:'lobby',players:[],treasures:[],startedAt:0,endsAt:0,countdownEndsAt:0,serverTime:Date.now(),events:[],round:0,duration,clue:'Follow the mountain trails to the Sun Shrine. Keep collecting to build a combo; save your dash for danger.',islandEvent:'calm',storm:{x:1280,y:800},eventEndsAt:0};}
 private resetPlayer(p:Player,i:number){Object.assign(p,{...SPAWNS[i],score:0,coins:0,diamonds:0,chests:0,missionDone:false,gemMissionDone:false,chestMissionDone:false,speedUntil:0,shieldUntil:0,magnetUntil:0,dashUntil:0,dashReadyAt:0,stunUntil:0,lastTrap:0,lastDig:0,lastSeq:-1,combo:0,lastPickup:0,digTarget:null,digProgress:0,digStartedAt:0,digNeedsRelease:false,dangerUntil:0,dangerKind:null,lastWaterHit:-10000});}
 add(name:string,character:Character,socketId:string) {
  if(this.state.phase!=='lobby')throw Error('This expedition has already started. Join the next round.');if(this.members.size>=6)throw Error('This crew is full (6 explorers).');
  const free=CHARACTERS.find(c=>![...this.members.values()].some(m=>m.player.character===c.id));if([...this.members.values()].some(m=>m.player.character===character))character=free!.id;
  const player={id:randomUUID(),name,character,ready:false,connected:true} as Player;this.resetPlayer(player,this.members.size);
  const m:Member={player,token:randomUUID()+randomUUID(),socketId,disconnectedAt:0,input:{x:0,y:0,dig:false,seq:0},inputAt:0};this.members.set(player.id,m);if(!this.state.hostId)this.state.hostId=player.id;this.syncPlayers();return m;
 }
 syncPlayers(){this.state.players=[...this.members.values()].map(m=>m.player);}
 event(text:string,kind:GameEvent['kind']='system',p?:Player){this.state.events.push({id:++this.eventId,text,kind,playerId:p?.id,x:p?.x,y:p?.y});this.state.events=this.state.events.slice(-14);}
 choose(id:string,character:Character){if(this.state.phase!=='lobby')throw Error('Choose your explorer in the lobby.');if([...this.members.values()].some(m=>m.player.id!==id&&m.player.character===character))throw Error('That explorer is already taken.');this.members.get(id)!.player.character=character;}
 start(id:string,now:number){
  if(id!==this.state.hostId)throw Error('Only the captain can start.');if(this.state.phase!=='lobby')throw Error('A round is already underway.');const active=[...this.members.values()].filter(m=>m.player.connected);if(active.length<2)throw Error('Invite at least one friend to begin.');if(active.some(m=>!m.player.ready))throw Error('Every explorer must be ready.');
  for(const [key,m] of this.members)if(!m.player.connected)this.members.delete(key);this.syncPlayers();
  Object.assign(this.state,{round:this.state.round+1,phase:'countdown',countdownEndsAt:now+3000,events:[],treasures:this.generate(),islandEvent:'calm',eventEndsAt:0});
  this.state.players.forEach((p,i)=>{this.resetPlayer(p,i);const m=this.members.get(p.id)!;m.input={x:0,y:0,dig:false,seq:0};m.inputAt=0;});
 }
 generate(){const items:Treasure[]=[];const put=(x:number,y:number,kind:Treasure['kind'])=>items.push({id:randomUUID(),x,y,kind,active:true,hidden:kind==='chest'&&items.length%2===0,respawnAt:0});
  for(const spawn of SPAWNS){put(spawn.x,spawn.y-55,'coin');put(spawn.x,spawn.y-105,'coin');}
  const kinds:Treasure['kind'][]=[...Array(40).fill('coin'),...Array(14).fill('diamond'),...Array(8).fill('chest'),...Array(5).fill('boots'),...Array(5).fill('shield'),...Array(4).fill('magnet'),...Array(2).fill('pearl')];
  for(const kind of kinds){let p={x:0,y:0};let found=false;for(let attempt=0;attempt<5000;attempt++){p={x:randomInt(WORLD.minX+50,WORLD.maxX-50),y:randomInt(WORLD.minY+50,WORLD.maxY-70)};if(walkable(p,38)&&TRAPS.every(t=>distance(p,t)>=70)&&SPAWNS.every(spawn=>distance(p,spawn)>=70)&&items.every(t=>distance(p,t)>=65)){found=true;break;}}if(found)put(p.x,p.y,kind);}return items;
 }
 input(id:string,input:Input,now:number){const m=this.members.get(id);if(!m||input.seq<=m.player.lastSeq)return;m.player.lastSeq=input.seq;m.input=input;m.inputAt=now;if(!input.dig){m.player.digNeedsRelease=false;m.player.digTarget=null;m.player.digProgress=0;m.player.digStartedAt=0;}else if(Math.hypot(input.x,input.y)>=.2){m.player.digTarget=null;m.player.digProgress=0;m.player.digStartedAt=0;}}
 dash(id:string,now:number){const p=this.members.get(id)?.player;if(!p||!p.connected||this.state.phase!=='playing')throw Error('Dash is available during the expedition.');if(now<p.dashReadyAt)throw Error('Your dash is recharging.');if(now<p.stunUntil)throw Error('Wait until the stun ends.');p.digTarget=null;p.digProgress=0;p.digStartedAt=0;p.dashUntil=now+450;p.dashReadyAt=now+8000;this.event(`${p.name}: adventure dash!`,'reward',p);}
 disconnect(id:string,now:number){const m=this.members.get(id);if(!m)return;Object.assign(m.player,{connected:false,ready:false,digTarget:null,digProgress:0});m.socketId=null;m.disconnectedAt=now;m.input={x:0,y:0,dig:false,seq:0};if(this.state.hostId===id){const next=[...this.members.values()].find(x=>x.player.connected);if(next)this.state.hostId=next.player.id;}this.event(`${m.player.name} disconnected. Their place is reserved for 45 seconds.`);}
 resume(id:string,token:string,socketId:string,now:number){const m=this.members.get(id);if(!m||m.token!==token)throw Error('Your session could not be restored. Please join again.');if(!m.player.connected&&now-m.disconnectedAt>45000)throw Error('Your reconnection window expired. Join the next round.');const oldSocket=m.socketId;m.socketId=socketId;m.player.connected=true;m.disconnectedAt=0;m.inputAt=0;m.player.lastSeq=-1;if(!this.members.get(this.state.hostId)?.player.connected)this.state.hostId=id;this.event(`${m.player.name} is back on the island.`);return {m,oldSocket};}
 leave(id:string,now:number){if(this.state.phase==='lobby'||this.state.phase==='finished'){this.members.delete(id);if(this.state.hostId===id)this.state.hostId=[...this.members.keys()][0]??'';this.syncPlayers();}else{this.disconnect(id,now);this.members.get(id)!.disconnectedAt=now-45001;}}
 reset(id:string){if(id!==this.state.hostId)throw Error('Only the captain can open the next expedition.');if(this.state.phase!=='finished')throw Error('Finish this expedition first.');for(const [key,m] of this.members)if(!m.player.connected)this.members.delete(key);this.state.phase='lobby';this.state.treasures=[];this.state.events=[];this.syncPlayers();this.state.players.forEach(p=>p.ready=false);}
 private updateEvent(now:number){const progress=(now-this.state.startedAt)/this.state.duration;const stage:IslandEvent=progress<.23?'calm':progress<.4?'gold-rush':progress<.58?'storm':progress<.8?'relic-rise':'final-rush';const fraction={calm:.23,'gold-rush':.4,storm:.58,'relic-rise':.8,'final-rush':1}[stage];this.state.eventEndsAt=this.state.startedAt+this.state.duration*fraction;
  if(stage!==this.state.islandEvent){this.state.islandEvent=stage;this.event(`${EVENT_INFO[stage].name}: ${EVENT_INFO[stage].description}`);}if(stage==='relic-rise'&&!this.state.treasures.some(t=>t.kind==='relic'))this.state.treasures.push({id:randomUUID(),x:1280,y:780,kind:'relic',active:true,hidden:false,respawnAt:0});this.state.storm={x:1280+Math.sin((now-this.state.startedAt)/5500)*540,y:820+Math.cos((now-this.state.startedAt)/7000)*220};
 }
 private hazard(p:Player,now:number,storm=false){if(now-p.lastTrap<1800)return;p.lastTrap=now;if(p.shieldUntil>now){p.shieldUntil=0;this.event(`${p.name}'s shield blocked ${storm?'the storm':'a trap'}.`,'reward',p);}else{const penalty=storm?15:20;p.score=Math.max(0,p.score-penalty);p.stunUntil=now+650;p.combo=0;p.digProgress=0;this.event(`${p.name}: ${storm?'storm strike':'trap'}! −${penalty}`,'trap',p);}}
 private waterBoundary(p:Player,attempt:{x:number;y:number},now:number){
  const fall=waterfallAt(attempt,16);if(!fall&&onLand(attempt,16))return;
  p.dangerKind=fall?'waterfall':'ocean';p.dangerUntil=now+1400;p.digTarget=null;p.digProgress=0;p.digStartedAt=0;
  if(!fall||now-p.lastWaterHit<2000)return;p.lastWaterHit=now;
  if(p.shieldUntil>now){p.shieldUntil=0;this.event(`${p.name}: shield blocked the waterfall!`,'reward',p);}
  else{p.score=Math.max(0,p.score-25);p.combo=0;p.stunUntil=now+650;this.event(`${p.name}: waterfall danger! −25. Stay on land.`,'trap',p);}
 }
 private collect(p:Player,t:Treasure,now:number){
  t.active=false;t.respawnAt=['chest','relic'].includes(t.kind)?0:now+22000;let value=0;
  if(t.kind==='coin'){value=this.state.islandEvent==='gold-rush'?20:10;p.coins++;}if(t.kind==='diamond'){value=this.state.islandEvent==='final-rush'?70:35;p.diamonds++;}if(t.kind==='pearl')value=this.state.islandEvent==='final-rush'?120:60;
  if(t.kind==='chest'){value=[50,75,100][randomInt(3)];p.chests++;p.lastDig=now;}if(t.kind==='relic'){value=200;p.lastDig=now;}
  if(t.kind==='boots')p.speedUntil=now+6000;if(t.kind==='shield')p.shieldUntil=now+12000;if(t.kind==='magnet')p.magnetUntil=now+8000;
  if(value>0){p.combo=now-p.lastPickup<3500?p.combo+1:1;p.lastPickup=now;if(t.kind!=='relic')value=Math.round(value*comboMultiplier(p.combo));p.score+=value;}
  this.event(`${p.name}: ${value?`+${value} ${t.kind}${p.combo>=5?' · combo!':''}`:t.kind==='magnet'?'treasure magnet!':t.kind==='boots'?'speed boost!':'shield equipped!'}`,'reward',p);
  const missions=[{done:'missionDone',progress:p.coins,target:8,reward:80,name:'Coin Collector'},{done:'gemMissionDone',progress:p.diamonds,target:4,reward:120,name:'Gem Hunter'},{done:'chestMissionDone',progress:p.chests,target:2,reward:150,name:'Master Excavator'}] as const;
  for(const mission of missions)if(mission.progress>=mission.target&&!p[mission.done]){p[mission.done]=true;p.score+=mission.reward;this.event(`${p.name}: ${mission.name} complete! +${mission.reward}`,'reward',p);}
 }
 tick(now:number,dt:number){
  this.state.serverTime=now;if(this.state.phase==='lobby'){for(const [id,m] of this.members)if(!m.player.connected&&now-m.disconnectedAt>45000)this.members.delete(id);this.syncPlayers();}
  if(this.state.phase==='countdown'&&now>=this.state.countdownEndsAt){this.state.phase='playing';this.state.startedAt=now;this.state.endsAt=now+this.state.duration;this.event('The mountain expedition begins!');}
  if(this.state.phase!=='playing')return false;if(now>=this.state.endsAt){this.state.phase='finished';this.state.players.forEach(p=>{p.digTarget=null;p.digProgress=0;});this.event('Expedition complete!');return true;}
  this.updateEvent(now);const stepSeconds=Math.min(Math.max(dt,0),.075);
  for(const m of this.members.values()){
   const p=m.player;if(!p.connected)continue;const input=now-m.inputAt<350?m.input:{x:0,y:0,dig:false};if(now-p.lastPickup>=3500)p.combo=0;
   const norm=Math.max(1,Math.hypot(input.x,input.y));const speed=now<p.stunUntil?0:now<p.dashUntil?520:now<p.speedUntil?300:210;
   const steps=Math.max(1,Math.ceil(stepSeconds*speed/8));for(let i=0;i<steps;i++){const step=stepSeconds*speed/steps;const nx={x:p.x+input.x/norm*step,y:p.y};if(walkable(nx))p.x=nx.x;else this.waterBoundary(p,nx,now);if(p.stunUntil>now)break;const ny={x:p.x,y:p.y+input.y/norm*step};if(walkable(ny))p.y=ny.y;else this.waterBoundary(p,ny,now);if(p.stunUntil>now)break;}
   if(TRAPS.some(t=>distance(p,t)<t.r+10))this.hazard(p,now);if(this.state.islandEvent==='storm'&&distance(p,this.state.storm)<105)this.hazard(p,now,true);
   const target=input.dig&&!p.digNeedsRelease&&now>=p.stunUntil&&now>=p.dashUntil&&Math.hypot(input.x,input.y)<.2?this.state.treasures.filter(t=>t.active&&['chest','relic'].includes(t.kind)&&distance(p,t)<65).sort((a,b)=>distance(p,a)-distance(p,b))[0]:undefined;
   if(target){if(p.digTarget!==target.id){p.digTarget=target.id;p.digStartedAt=now;}p.digProgress=Math.min(1,(now-p.digStartedAt)/(target.kind==='relic'?RELIC_DIG_MS:CHEST_DIG_MS));}else{p.digTarget=null;p.digProgress=0;p.digStartedAt=0;}
   for(const t of this.state.treasures){if(!t.active)continue;if(t.hidden&&distance(p,t)<150)t.hidden=false;if(['chest','relic'].includes(t.kind)){if(p.digTarget!==t.id||p.digProgress<1)continue;p.digTarget=null;p.digProgress=0;p.digStartedAt=0;p.digNeedsRelease=true;}else{const radius=p.magnetUntil>now&&['coin','diamond','pearl'].includes(t.kind)?105:30;if(distance(p,t)>radius)continue;}this.collect(p,t,now);}
  }
  for(const t of this.state.treasures)if(!t.active&&t.respawnAt&&now>=t.respawnAt){t.active=true;t.respawnAt=0;}return false;
 }
}
