import pg from 'pg';
import {ranked,type RoomState} from '../shared/game.js';
export const pool=process.env.DATABASE_URL?new pg.Pool({connectionString:process.env.DATABASE_URL,max:3,connectionTimeoutMillis:5000}):null;
export async function initStorage(){if(pool)await pool.query(`CREATE TABLE IF NOT EXISTS matches (id text PRIMARY KEY, room_code text NOT NULL, round integer NOT NULL, finished_at timestamptz NOT NULL DEFAULT now(), results jsonb NOT NULL)`);}
export async function saveMatch(s:RoomState){if(!pool)return;await pool.query('INSERT INTO matches (id,room_code,round,results) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING',[`${s.code}-${s.startedAt}`,s.code,s.round,JSON.stringify(ranked(s.players).map(p=>({name:p.name,character:p.character,score:p.score,missionDone:p.missionDone})))]);}
