import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import {createGameServer} from './app.js';
import {initStorage,pool} from './storage.js';
const prod=process.env.NODE_ENV==='production';
if(prod&&process.env.TEST_MATCH_MS)throw Error('TEST_MATCH_MS must never be used in production.');
const origins=process.env.CLIENT_ORIGIN?.split(',').map(x=>x.trim()).filter(Boolean);
const server=createGameServer({allowedOrigins:origins,duration:!prod&&process.env.TEST_MATCH_MS?Number(process.env.TEST_MATCH_MS):undefined});
await initStorage();
if(prod||process.env.NODE_ENV==='test'){server.app.use(express.static(path.resolve('dist/client')));server.app.get('/{*path}',(_req,res)=>res.sendFile(path.resolve('dist/client/index.html')));}
else{const {createServer}=await import('vite');const vite=await createServer({configLoader:'runner',server:{middlewareMode:true},appType:'spa'});server.app.use(vite.middlewares);}
const port=Number(process.env.PORT??3000);server.http.listen(port,'0.0.0.0',()=>console.log(`Treasure Rush ready: http://localhost:${port}`));
async function shutdown(){await server.close();await pool?.end();process.exit(0);}process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
