export const WORLD = {width:2560,height:1600,minX:190,maxX:2370,minY:170,maxY:1370};
export const SPAWNS=Array.from({length:6},(_,i)=>({x:870+i*160,y:1200}));
export const CHARACTERS = [
 {id:'fox',name:'Finn',role:'The fearless fox',color:0xf18b55,emoji:'🦊'},
 {id:'frog',name:'Moss',role:'The curious scout',color:0x78c893,emoji:'🐸'},
 {id:'raccoon',name:'Pip',role:'The midnight bandit',color:0xb5a1df,emoji:'🦝'},
 {id:'cat',name:'Cleo',role:'The lucky wanderer',color:0xffcf6c,emoji:'🐱'},
 {id:'bear',name:'Bruno',role:'The gentle adventurer',color:0xc38b68,emoji:'🐻'},
 {id:'rabbit',name:'Luna',role:'The quick explorer',color:0xf1adca,emoji:'🐰'}
] as const;
export type Character = typeof CHARACTERS[number]['id'];
export type Phase = 'lobby'|'countdown'|'playing'|'finished';
export type Kind = 'coin'|'diamond'|'chest'|'boots'|'shield'|'magnet'|'pearl'|'relic';
export type IslandEvent='calm'|'gold-rush'|'storm'|'relic-rise'|'final-rush';
export const EVENT_INFO:Record<IslandEvent,{name:string;description:string;icon:string}>={
 'calm':{name:'Explore the lost island',description:'Follow mountain trails. Discover buried treasure.',icon:'✦'},
 'gold-rush':{name:'Gold Rush',description:'All coins are worth double. Build your collection combo!',icon:'☀'},
 'storm':{name:'Tempest tide',description:'A roaming storm costs 15 points. Dash out of its path!',icon:'ϟ'},
 'relic-rise':{name:'The Sun Relic awakens',description:'Race to the central shrine. Hold DIG to claim 200 points.',icon:'◈'},
 'final-rush':{name:'Final Fortune',description:'Diamonds and pearls are worth double until the timer ends!',icon:'♛'}
};
export interface Point {x:number;y:number}
export interface Input {x:number;y:number;dig:boolean;seq:number}
export interface Player extends Point {id:string;name:string;character:Character;score:number;coins:number;missionDone:boolean;ready:boolean;connected:boolean;speedUntil:number;shieldUntil:number;stunUntil:number;lastTrap:number;lastDig:number;lastSeq:number;diamonds:number;chests:number;gemMissionDone:boolean;chestMissionDone:boolean;magnetUntil:number;dashUntil:number;dashReadyAt:number;combo:number;lastPickup:number;digTarget:string|null;digProgress:number;digStartedAt:number;digNeedsRelease:boolean;dangerUntil:number;dangerKind:'ocean'|'waterfall'|null;lastWaterHit:number}
export interface Treasure extends Point {id:string;kind:Kind;active:boolean;hidden:boolean;respawnAt:number}
export interface GameEvent {id:number;text:string;playerId?:string;kind:'reward'|'trap'|'system';x?:number;y?:number}
export interface RoomState {code:string;hostId:string;phase:Phase;players:Player[];treasures:Treasure[];startedAt:number;endsAt:number;countdownEndsAt:number;serverTime:number;events:GameEvent[];round:number;duration:number;clue:string;islandEvent:IslandEvent;storm:Point;eventEndsAt:number}
export interface Session {code:string;playerId:string;token:string}
export type Reply = {ok:true;session?:Session}|{ok:false;error:string};
export const ROCKS = [{x:755,y:590,r:125},{x:1745,y:650,r:155},{x:1240,y:340,r:125},{x:570,y:1010,r:70},{x:2080,y:1010,r:65}];
export const TRAPS = [{x:1050,y:1020,r:26},{x:1480,y:500,r:26},{x:1930,y:1120,r:26},{x:480,y:700,r:26},{x:1280,y:950,r:26},{x:2140,y:530,r:26}];
export const distance = (a:Point,b:Point) => Math.hypot(a.x-b.x,a.y-b.y);
// Authored against mountain-island-v2.png. The same geometry drives server collision and client warnings.
export const LAND_OUTLINE:Point[]=[[.43,.085],[.58,.085],[.66,.14],[.78,.135],[.86,.22],[.91,.32],[.89,.43],[.93,.53],[.89,.66],[.84,.72],[.75,.78],[.65,.815],[.56,.835],[.45,.83],[.34,.80],[.24,.73],[.155,.675],[.13,.60],[.10,.52],[.135,.39],[.14,.30],[.20,.22],[.29,.15],[.39,.13]].map(([x,y])=>({x:x*WORLD.width,y:y*WORLD.height}));
export const WATERFALLS=[
 {id:'north-west',x:968,y:251,w:113,h:153}, {id:'north-east',x:1534,y:258,w:129,h:177},
 {id:'west-bridge',x:888,y:484,w:81,h:161}, {id:'cave-pool',x:759,y:686,w:137,h:81},
 {id:'west-cascade',x:961,y:774,w:97,h:137}, {id:'shrine-pool',x:1453,y:839,w:161,h:129},
 {id:'east-cascade',x:1840,y:678,w:178,h:161}, {id:'south-east',x:2034,y:884,w:137,h:194},
 {id:'south-west',x:831,y:839,w:105,h:145}
];
export const CHEST_DIG_MS=1000,RELIC_DIG_MS=1600;
export function inPolygon(p:Point,polygon:Point[]){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
function segmentDistance(p:Point,a:Point,b:Point){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return distance(p,{x:a.x+t*dx,y:a.y+t*dy});}
export function waterfallAt(p:Point,margin=0){return WATERFALLS.find(z=>p.x>=z.x-margin&&p.x<=z.x+z.w+margin&&p.y>=z.y-margin&&p.y<=z.y+z.h+margin);}
export function onLand(p:Point,margin=16){return inPolygon(p,LAND_OUTLINE)&&LAND_OUTLINE.every((a,i)=>segmentDistance(p,a,LAND_OUTLINE[(i+1)%LAND_OUTLINE.length])>=margin);}
export function walkable(p:Point,margin=16){return onLand(p,margin)&&!waterfallAt(p,margin)&&ROCKS.every(r=>distance(p,r)>r.r+margin);}
export const comboMultiplier=(combo:number)=>1+Math.min(3,Math.floor(Math.max(0,combo-1)/4))*.25;
export const ranked = (players:Player[]) => [...players].sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name));
