import {io} from 'socket.io-client';
import type {Reply,Session} from '../shared/game';
export const socket=io(import.meta.env.VITE_SERVER_URL||undefined,{autoConnect:false,transports:['websocket','polling'],reconnectionDelay:500,reconnectionDelayMax:3000});
export function request(event:string,data:unknown={}):Promise<Reply>{return new Promise(resolve=>socket.timeout(6000).emit(event,data,(err:Error|null,reply:Reply)=>resolve(err?{ok:false,error:'The island is taking a moment to respond. Please try again.'}:reply)));}
export function savedSession():Session|null{try{return JSON.parse(sessionStorage.getItem('treasure-session')||'null');}catch{return null;}}
export function storeSession(s:Session|null){if(s)sessionStorage.setItem('treasure-session',JSON.stringify(s));else sessionStorage.removeItem('treasure-session');}
