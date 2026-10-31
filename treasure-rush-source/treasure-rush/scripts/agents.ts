import 'dotenv/config';
import {Agent,run,setTracingDisabled} from '@openai/agents';
// A planning-only workflow, deliberately without filesystem, deployment, or game-state tools.
setTracingDisabled(true);
const devModel=process.env.OPENAI_DEV_MODEL||'gpt-6.1-sol';
const uxModel=process.env.OPENAI_UX_MODEL||'gpt-6.1-terra';
const contentModel=process.env.OPENAI_CONTENT_MODEL||'gpt-6-luna';
const common='Treasure Rush: Phaser 3 + React + TypeScript + Express + Socket.IO. 2–6 players. Server owns movement, collision, scores, timer and winners. Output actionable proposals with acceptance criteria; never claim tests or deployment occurred. You have no access to files or live matches.';
const designer=new Agent({name:'Game Designer',model:devModel,instructions:`${common} Design balanced levels, scoring, missions and progression. Keep runtime rules deterministic.`});
const developer=new Agent({name:'Development',model:devModel,instructions:`${common} Propose typed contracts, patches and implementation steps. Address simulation authority, room lifecycle, stale inputs and reconnect ownership.`});
const qa=new Agent({name:'QA',model:devModel,instructions:`${common} Identify falsifiable failure cases and write a multi-context Playwright test plan. Include races, six players, reconnect, input abuse and room isolation.`});
const ux=new Agent({name:'UI/UX',model:uxModel,instructions:`${common} Review mobile controls, keyboard access, feedback, readability and responsive interfaces. Request screenshots if a visual judgment needs evidence.`});
export const treasureMaster=new Agent({name:'AI Treasure Master',model:contentModel,instructions:'Write short family-friendly treasure clues and story flavor. Never alter gameplay, rewards, player state, timers or winning conditions.'});
export const coordinator=new Agent({name:'Main Coordinator',model:devModel,instructions:`${common} Coordinate a development plan. Consult the relevant specialists via tools. Order implementation in independently testable phases and distinguish evidence from suggestions.`,tools:[designer.asTool({toolName:'game_design',toolDescription:'Get game rules and balancing proposals'}),developer.asTool({toolName:'development',toolDescription:'Get implementation and architecture proposals'}),qa.asTool({toolName:'quality_assurance',toolDescription:'Get acceptance tests and risk analysis'}),ux.asTool({toolName:'user_experience',toolDescription:'Get interface and accessibility proposals'})]});
if(!process.env.OPENAI_API_KEY){console.error('Set OPENAI_API_KEY locally to run the optional AI planning workflow. Never paste it into chat.');process.exitCode=1;}
else {const result=await run(coordinator,process.argv.slice(2).join(' ')||'Plan the next Treasure Rush milestone: evaluate latency compensation and production reliability.',{maxTurns:8});console.log(result.finalOutput);}
