import express from 'express';
import path from 'node:path';
import {createGameServer} from '../../server/app.js';
export default async function setup(){
 const server=createGameServer({duration:20000});
 server.app.use(express.static(path.resolve('dist/client')));
 server.app.get('/{*path}',(_req,res)=>res.sendFile(path.resolve('dist/client/index.html')));
 await new Promise<void>(resolve=>server.http.listen(3101,'127.0.0.1',resolve));
 return ()=>server.close();
}
