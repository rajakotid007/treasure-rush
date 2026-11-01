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
export interface Player extends Point {id:string;name:string;character:Character;score:number;coins:number;missionDone:boolean;ready:boolean;connected:boolean;speedUntil:number;shieldUntil:number;stunUntil:number;lastTrap:number;lastDig:number;lastSeq:number;diamonds:number;chests:number;gemMissionDone:boolean;chestMissionDone:boolean;magnetUntil:number;dashUntil:number;dashReadyAt:number;combo:number;lastPickup:number;digTarget:string|null;digProgress:number}
export interface Treasure extends Point {id:string;kind:Kind;active:boolean;hidden:boolean;respawnAt:number}
export interface GameEvent {id:number;text:string;playerId?:string;kind:'reward'|'trap'|'system';x?:number;y?:number}
export interface RoomState {code:string;hostId:string;phase:Phase;players:Player[];treasures:Treasure[];startedAt:number;endsAt:number;countdownEndsAt:number;serverTime:number;events:GameEvent[];round:number;duration:number;clue:string;islandEvent:IslandEvent;storm:Point;eventEndsAt:number}
export interface Session {code:string;playerId:string;token:string}
export type Reply = {ok:true;session?:Session}|{ok:false;error:string};
export const ROCKS = [{x:755,y:590,r:125},{x:1745,y:650,r:155},{x:1240,y:340,r:125},{x:570,y:1010,r:70},{x:2080,y:1010,r:65}];
export const TRAPS = [{x:1050,y:1020,r:26},{x:1480,y:500,r:26},{x:1930,y:1120,r:26},{x:480,y:700,r:26},{x:1280,y:950,r:26},{x:2140,y:530,r:26}];
export const distance = (a:Point,b:Point) => Math.hypot(a.x-b.x,a.y-b.y);
export function walkable(p:Point,margin=16) {const edge=Math.max(0,350-p.y)*.9+Math.max(0,p.y-1100)*1.3;return p.x>=WORLD.minX+edge && p.x<=WORLD.maxX-edge && p.y>=WORLD.minY && p.y<=WORLD.maxY && ROCKS.every(r=>distance(p,r)>r.r+margin);}
export const comboMultiplier=(combo:number)=>1+Math.min(3,Math.floor(Math.max(0,combo-1)/4))*.25;
export const ranked = (players:Player[]) => [...players].sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name));
