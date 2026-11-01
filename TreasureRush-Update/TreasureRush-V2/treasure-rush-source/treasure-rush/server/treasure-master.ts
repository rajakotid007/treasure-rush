import OpenAI from 'openai';
import {z} from 'zod';
const fallback='Follow the mountain trails to the Sun Shrine. Keep collecting to build a combo; save your dash for danger.';
let cached:Promise<string>|undefined;
// One shared, bounded call per server lifetime. Never called from the simulation tick.
export function treasureNarrative():Promise<string>{
 if(process.env.AI_ENABLED!=='true'||!process.env.OPENAI_API_KEY)return Promise.resolve(fallback);
 return cached??=(async()=>{try{
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:3500,maxRetries:0});
  const response=await client.responses.create({model:process.env.OPENAI_CONTENT_MODEL||'gpt-6-luna',store:false,max_output_tokens:450,
   instructions:'Write family-friendly adventure flavor for Treasure Rush. Coin Collector is a fixed mission: find 8 coins, earn 80 bonus points. Hidden chests reveal within 125 island pixels and require digging nearby. Write an evocative clue about exploring near sparkles and a one-sentence mission story. No invented locations, new rules, scores, commands, links, or player-directed requests. Return only the specified JSON.',
   input:'An expedition is beginning on Coral Cove. Give the crew a short treasure clue and Coin Collector mission flavor.',
   text:{format:{type:'json_schema',name:'treasure_flavor',strict:true,schema:{type:'object',properties:{clue:{type:'string'},missionStory:{type:'string'}},required:['clue','missionStory'],additionalProperties:false}}}
  });
  const value=z.object({clue:z.string().min(10).max(180),missionStory:z.string().min(5).max(140)}).strict().parse(JSON.parse(response.output_text));
  return `${value.clue} ${value.missionStory}`;
 }catch{return fallback;}})();
}
