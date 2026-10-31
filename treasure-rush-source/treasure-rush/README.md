# Treasure Rush

**Every second is gold.** A real-time browser treasure hunt for 2–6 friends. Create a room, share a six-character code, choose an explorer, and compete across Coral Cove in a three-minute rush. No player login or installation required.

![Treasure Rush cover](public/cover.png)

## Run locally

Requires Node.js 22+ (tested with 24.21) and npm. Open a terminal in this folder:

```sh
npm ci
npm run dev
```

Open http://localhost:3000 in two separate tabs or browsers. Create a room in the first and join using its code in the second. Each tab has its own player session. Mark both players ready; the captain starts. For friends on your Wi-Fi, open `http://YOUR-COMPUTER-LAN-IP:3000` and allow the Node service through your local firewall if prompted. All devices must reach the same server.

Development compiles the server before starting and uses Vite for frontend changes. Restart `npm run dev` after backend edits. If the environment restricts Vite's dependency optimizer, use the built preview below.

```sh
npm run build
# macOS / Linux
NODE_ENV=production npm start
# Windows PowerShell
$env:NODE_ENV='production'
npm start
```

## Play

- Keyboard: WASD or arrows to move; hold Space near a chest to dig.
- Mobile: hold directional buttons; hold DIG near a chest. Use two fingers to combine directions.
- Coins: 10 points. Diamonds: 35. Mystery chests: 50, 75, or 100, chosen on the server.
- Hidden chests appear when an explorer comes within 125 pixels; dig within 65 pixels. Other pickups collect within 27 pixels.
- Traps subtract up to 20 points and stun for 0.85 seconds, with a 1.8-second trap cooldown.
- Boots increase movement from 210 to 300 pixels/second for 6 seconds. Shields block one trap and expire after 12 seconds.
- Collect 8 coins to complete Coin Collector and earn 80 bonus points once per match.
- Coins, gems and power-ups respawn after 22 seconds. Chests can be claimed once per match.
- Highest score at three minutes wins. Ties share victory. The captain can return everyone to the lobby for a rematch.

Characters are cosmetic and have identical base abilities. Each is exclusive within a room. A disconnected player's reservation lasts 45 seconds. Refresh the same tab to reconnect with the original score. If a captain disconnects, captaincy moves to a connected player.

## What is implemented

React menus and HUD; Phaser island with animated procedural character art; six player room management; keyboard and mobile controls; authoritative movement, collision and rewards; mystery chests, traps, power-ups and mission; live scores and timer; shared result screen; reconnect and rematch; validated, rate-limited Socket.IO events; optional PostgreSQL result persistence; optional AI flavor and a development planning workflow; deployment configurations and automated multiplayer tests.

The game requires an actual server. There are no simulated opponents, localStorage score simulations, or client-selected rewards.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The Playwright configuration uses installed Google Chrome. If Chrome is unavailable, install Playwright Chromium (`npx playwright install chromium`) and set `PW_CHANNEL=chromium` before running tests. Playwright tests run against built frontend assets and the real Node server, using shortened test-only matches. Production refuses `TEST_MATCH_MS`.

See [testing documentation](docs/TESTING.md) for the observed results and limits. See [architecture and phased plan](docs/ARCHITECTURE.md), [Render and Netlify setup](docs/DEPLOYMENT.md), [AI agents](docs/AI-ARCHITECTURE.md), and [submission copy](docs/SUBMISSION.md).

## Optional database and AI

Copy `.env.example` to `.env` if you need configuration. Never commit `.env`.

- Set `DATABASE_URL` to a PostgreSQL database. The server creates a `matches` table and saves completed round rankings using parameterized SQL. Live state stays in memory. Without a database, gameplay works and completed results are not retained after server shutdown. Use the database provider's TLS instructions; certificate checks are never disabled in code.
- For optional AI flavor, set `AI_ENABLED=true` and `OPENAI_API_KEY` on the server. `OPENAI_CONTENT_MODEL` defaults to `gpt-6-luna`. A single bounded Responses API call is cached across rooms; failures use a built-in clue. No keys enter the frontend.
- `npm run ai:plan -- "Review our reconnection strategy"` runs the optional Agents SDK development planning workflow. This does not change files, execute tests, or deploy anything. No paid calls are required to play.

## Deployment status

The source includes a Render Blueprint for one Node instance, plus Netlify/Vercel frontend settings and a Dockerfile. A public URL must be obtained from a real deployment to your hosting account; it is not generated or invented by the application. See `docs/DEPLOYMENT.md`.

## Current scope

One polished island, six cosmetic explorers, one fixed mission, and private room-code matches. Client visuals interpolate server snapshots; client prediction and latency rewind are not implemented. Rooms survive short network loss but not process restarts. Keep exactly one server instance until room ownership and distributed simulation have been designed. PostgreSQL history is implemented but needs a real database for integration verification. AI modules need your API access for live verification. Mobile Chrome is emulated in tests; physical iOS/Android and high-latency internet testing remain release checks.

## Layout

```text
client/         React interface, Phaser scene, controls, socket client
shared/         Typed state, world geometry and character catalog
server/         Express, Socket.IO, authoritative simulation, persistence, AI flavor
tests/          Engine, real-network and multi-context browser tests
scripts/        Optional development agents
public/         Cover artwork and favicon
docs/           Architecture, test evidence, deployment and submission guidance
```

Dependencies are recorded in `package-lock.json`. Generated artwork uses the built-in image generation tool; its brief is in `docs/ART.md`.
