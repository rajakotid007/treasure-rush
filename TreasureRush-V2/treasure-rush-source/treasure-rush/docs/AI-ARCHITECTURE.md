# OpenAI and agent architecture

The five development agents are an optional planning workflow. They are not players or services running inside a match. The AI Treasure Master provides optional story flavor only. These modules are implemented, typechecked and disabled by default; live API behavior needs a backend API key and has not been verified using a paid call.

## Suggested models

Recommendations below are architectural choices based on the official model descriptions checked on 31 October 2026. Availability depends on your API project; environment variables let you choose a model you can access.

| Agent | Default model | Responsibility and allowed output |
|---|---|---|
| Main Coordinator | `gpt-6.1-sol` | Sequence milestones, consult specialists, define acceptance gates |
| Game Designer | `gpt-6.1-sol` | Propose balanced rules, maps, missions and scoring for review |
| Development | `gpt-6.1-sol` | Propose TypeScript contracts and implementation patches |
| QA | `gpt-6.1-sol` | Derive adversarial cases and multiplayer acceptance tests |
| UI/UX | `gpt-6.1-terra` | Review interaction and screenshots, accessibility and mobile flows |
| AI Treasure Master | `gpt-6-luna` | Short family-friendly clues and mission story copy |

Use `gpt-6-astra` selectively for difficult architecture reviews when quality justifies the extra cost, rather than for every story fragment. These are recommendations, not a measured comparison on Treasure Rush. No performance or cost benchmark is claimed.

## Development workflow: Agents SDK

`scripts/agents.ts` defines the specialists using the TypeScript OpenAI Agents SDK. The coordinator calls four specialists via `asTool`; this keeps ownership with the coordinator while collecting focused advice. The separate Treasure Master agent defines the content role. Explicit models avoid depending on SDK defaults. The planning run caps its turns and disables tracing by default.

```sh
npm run ai:plan -- "Design a second island and its multiplayer test cases"
```

Provide `OPENAI_API_KEY` locally or as a server secret. Never paste it into a chat or commit it. `OPENAI_DEV_MODEL`, `OPENAI_UX_MODEL`, and `OPENAI_CONTENT_MODEL` can override defaults.

No agent has filesystem, shell, deployment, or game-state tools. The script produces advice only. A future automated developer could receive narrowly scoped code tools in an isolated branch, with CI evidence before merging. QA output must never be mistaken for executed tests. Coordinator output is not evidence of deployment.

## Runtime flavor: Responses API

`server/treasure-master.ts` uses the Responses API directly for a bounded structured response: `clue` and `missionStory`. Direct Responses use is simpler here than running a multi-agent workflow during a match. A strict JSON schema limits the structure; Zod validates the returned shape and lengths. The user interface renders the result as text.

The content call is not awaited by the game command or tick. It has a 3.5-second timeout, no retries, `store: false`, and a maximum output token budget. Its promise is cached per process, giving every room a safe fallback or the same flavor text without per-player request amplification.

The model receives fixed game facts only, not room secrets or player names. No external tool is enabled. The model cannot invoke the engine or database. The fixed Coin Collector mission remains 8 coins for 80 points; generated text adds story but never supplies rule parameters.

## Hard boundary

| Server engine owns | AI may suggest or describe |
|---|---|
| Legal movement and collisions | Future map concepts |
| Treasure activation and single claim | Flavor and clues |
| Mystery reward amount | Narrative chest descriptions |
| Scores, power-up expiry and mission progress | Future mission copy |
| Start/deadline and victory | Results-screen story copy |

This boundary means a timeout, malformed response or model outage has no effect on fairness or match completion. Structured output validates format, not truth; narrative quality still needs an offline content evaluation before expanding generation.

## Official references

- [Model catalog](https://developers.openai.com/api/docs/models)
- [Agents SDK](https://developers.openai.com/api/docs/guides/agents/sdk)
- [Explicit model selection](https://developers.openai.com/api/docs/guides/agents/models)
- [Agent definitions and tools](https://developers.openai.com/api/docs/guides/agents/define-agents)
- [Responses API](https://developers.openai.com/api/reference/responses/overview)
