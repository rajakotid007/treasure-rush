export const WORLD = {width:1280,height:800,minX:90,maxX:1190,minY:90,maxY:710};
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
export type Kind = 'coin'|'diamond'|'chest'|'boots'|'shield';
export interface Point {x:number;y:number}
export interface Input {x:number;y:number;dig:boolean;seq:number}
export interface Player extends Point {id:string;name:string;character:Character;score:number;coins:number;missionDone:boolean;ready:boolean;connected:boolean;speedUntil:number;shieldUntil:number;stunUntil:number;lastTrap:number;lastDig:number;lastSeq:number}
export interface Treasure extends Point {id:string;kind:Kind;active:boolean;hidden:boolean;respawnAt:number}
export interface GameEvent {id:number;text:string;playerId?:string;kind:'reward'|'trap'|'system';x?:number;y?:number}
export interface RoomState {code:string;hostId:string;phase:Phase;players:Player[];treasures:Treasure[];startedAt:number;endsAt:number;countdownEndsAt:number;serverTime:number;events:GameEvent[];round:number;duration:number;clue:string}
export interface Session {code:string;playerId:string;token:string}
export type Reply = {ok:true;session?:Session}|{ok:false;error:string};
export const ROCKS = [{x:410,y:310,r:45},{x:860,y:440,r:48},{x:635,y:200,r:40},{x:290,y:520,r:32},{x:1000,y:225,r:35}];
export const TRAPS = [{x:470,y:510,r:27},{x:790,y:245,r:27},{x:1030,y:570,r:27},{x:205,y:285,r:27}];
export const distance = (a:Point,b:Point) => Math.hypot(a.x-b.x,a.y-b.y);
export function walkable(p:Point,margin=16) {return p.x>=WORLD.minX && p.x<=WORLD.maxX && p.y>=WORLD.minY && p.y<=WORLD.maxY && ROCKS.every(r=>distance(p,r)>r.r+margin);}
export const ranked = (players:Player[]) => [...players].sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name));
