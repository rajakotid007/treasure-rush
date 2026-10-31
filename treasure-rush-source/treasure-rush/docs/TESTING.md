# Verification record

Tested locally on Windows with Node.js 24.21.0 and installed Google Chrome, on 31 October 2026. These results concern a genuine Express/Socket.IO service, not a mock network. Public deployment and provider integrations have separate acceptance checks below.

## Commands and observed outcomes

| Check | Result |
|---|---|
| `npm run typecheck` | Passed |
| `npm run build` | Passed; browser assets and compiled Node server generated |
| `npm test` | **13 passed, 0 failed** |
| `npm run test:e2e` | **3 browser scenarios passed** after renderer/lifecycle fixes |
| Six-browser refresh/rematch regression, `--repeat-each=2` | **2 consecutive passes** after the renderer fix |
| `npm run test:deployed -- http://localhost:3000` | Passed against the built production service with six real sockets |
| `npm audit --omit=dev --audit-level=high` | **0 vulnerabilities** after updating Zod to 4.6.7 |

The build reports a large lazy Phaser engine chunk (~1.2 MB uncompressed / 335 KB gzip). The initial UI bundle is ~285 KB uncompressed / 89 KB gzip. The game engine is requested when entering a match. These sizes are build observations, not a mobile loading benchmark.

## Engine coverage (12 tests)

1. Captain-only start, two-player minimum and readiness enforcement.
2. Six-slot cap and unique character ownership.
3. Normalized diagonal movement, stale-input expiry and large-delta cap.
4. Rock and world-boundary collision.
5. Single reward for a treasure contested by two players in the same tick.
6. Hidden chest discovery, nearby dig requirement and non-repeating reward.
7. One-time mission bonus, shield consumption, trap penalty and cooldown.
8. Deadline freezes scoring; rematch resets readiness.
9. Token validation, score-preserving reconnect and expired reservations.
10. Generated maps avoid rocks and trap overlap.
11. New rounds accept input sequences restarting from zero.
12. A reconnecting player receives captaincy when the entire crew was offline.

## Real-network coverage (1 integration test)

Starts a real server on an ephemeral TCP port and opens six independent Socket.IO clients. Verifies shared crew state, character exclusivity, a rejected seventh player, an isolated second room, forbidden non-captain start, validated movement input, synchronized server-awarded scores, token-protected reconnect, frozen results and rematch readiness. No browser-local scoreboard is substituted for server results.

## Browser coverage (3 scenarios)

- Desktop home and guide, plus a 390 × 844 mobile viewport with no horizontal overflow.
- Six independent Chrome browser contexts, each with its own session: create/join, full crew, ready/start, actual Phaser canvas, keyboard movement, a server-awarded pickup visible in all leaderboards, refresh/reconnect, result announcement, rematch, and movement/reward in the second round. Incoming WebSocket snapshots are observed to verify agreement across all six sessions; no test-only gameplay endpoint is exposed.
- A mobile-emulated browser and another participant join a real room. The mobile direction control produces actual server movement and a synchronized pickup. Screenshot review confirms the island and touch controls are visible together.

Browser tests use 20-second match durations through the internal test server constructor. The deployed-service smoke test independently verifies the production three-minute duration. Production refuses the `TEST_MATCH_MS` override.

## Reproducing tests

```sh
npm ci
npm run build
npm test
npm run test:e2e
```

The tests use Google Chrome via `channel: chrome`. For a machine without Chrome, run `npx playwright install chromium` and set `PW_CHANNEL=chromium`. View the generated HTML report using `npx playwright show-report`. Reports and failure traces are ignored by Git. Preview screenshots are saved in `docs/` for review.

The browser suite owns an in-process test server on 127.0.0.1:3101 and closes it during teardown. Tests run against built frontend assets. This avoids both development optimizer differences and external-process shutdown problems in the restricted Windows environment.

## Issues found and addressed

- Windows restricted the original test runner's OS-user lookup and the development dependency optimizer. The project now compiles server/test TypeScript with standard `tsc`, uses Vite's configuration runner, and runs browser checks against built assets.
- New-round inputs were rejected when their sequence restarted below the previous round's sequence. Starting a round now resets the input sequence and stale-input timestamp; engine and second-round browser checks cover this.
- After every crew member disconnected, captaincy could remain with an offline member. The first successful return becomes captain if no connected captain exists.
- Repeat refresh checks exposed intermittent late canvas attachment while the live scoreboard resumed. Phaser now attaches in React's layout lifecycle and uses Canvas rendering for this vector scene, avoiding per-tab WebGL context allocation. The completed browser run verifies refresh and rematch with that implementation.
- A production dependency audit identified a Zod advisory; Zod was updated to a compatible patched version and validation tests rerun.

## Visual evidence

- `preview-home.png` — desktop home and cover integration.
- `preview-lobby.png` — six-player crew and character selection.
- `preview-game.png` — live game with six synchronized players.
- `preview-results.png` — real server-ended round.
- `preview-mobile.png` — mobile home.
- `preview-mobile-game.png` — mobile controls, map and HUD.

## Not yet verified

- Actual public Render deployment, HTTPS/WebSocket connectivity through its proxy, and Netlify frontend pairing.
- Two physical devices on independent internet connections; physical iOS Safari/Android Chrome; packet-loss, latency and long-running soak tests.
- Live PostgreSQL initialization and result insertion against a provisioned database.
- Live paid OpenAI requests and account-specific model access. AI is optional and disabled by default.
- Distributed room ownership or restart recovery; neither is implemented. Run exactly one server instance.
- Handshake AI Skills Studio submission or acceptance.

## Public release gate

After deployment, run `npm run test:deployed -- YOUR_ACTUAL_BACKEND_URL`. Then use two actual browsers/devices on the public frontend to create/join a room, move, collect, refresh within 45 seconds, finish the full three-minute match and play again. If Netlify serves the frontend, verify its exact origin is allowed by the Render backend. Add the real URL and deployed test outcome to this record before calling the project submission-ready.
