# Treasure Rush 2.0 — Sunstone Expedition

## What changed

- A painted mountain-and-ocean world with jungle temples, waterfalls, coves, caves and winding stone trails replaces the flat green field.
- The world is 2560 × 1600: four times V1's area. A follow camera and an illustrated minimap show your position, crew and available relic.
- Illustrated explorer sprites, golden doubloons, diamond gems, ornate chests and power-up artwork replace the original simple shapes.
- Ninety initial pickups include coins, diamonds, eight chests, pearls, boots, shields and magnets. Hidden chests reveal as players approach.
- Three independent contracts reward collecting 8 coins (+80), 4 diamonds (+120), and excavating 2 chests (+150).
- Rapid scoring pickups build a combo: collect within 3.5 seconds to maintain the chain; every four pickups raises the multiplier by 0.25, up to ×1.75. Relics retain their fixed 200-point award.
- Dash with Q, Shift or the touch/desktop button: a 0.45-second movement burst with an 8-second server cooldown. Collision substeps prevent tunnelling through blocked mountains.
- Stand still and hold Space/DIG for 0.65 seconds to open a chest. A progress indicator shows the server's excavation progress. Releasing or moving cancels progress.
- Magnets increase coin/gem/pearl collection range to 105 pixels for eight seconds.
- Optional ocean ambience and pickup/trap sounds start only after the sound toggle is pressed. Sound is off by default.
- Fonts are hosted with the game, eliminating requests to external font services during play. Their licenses are included in `public/fonts`.
- Lobby guidance explains the two-player minimum and the current captain's role.

## Event schedule

Events follow authoritative server time, rather than browser clocks or AI output:

| Round progress | Event | Rules |
|---|---|---|
| 0–23% | Explore | Base treasure values |
| 23–40% | Gold Rush | Coins are worth 20 before combo bonuses |
| 40–58% | Tempest Tide | A moving storm costs 15 points and briefly stuns; a shield blocks it |
| 58–80% | Sun Relic | One relic appears at the central shrine; hold DIG for 1.2 seconds to claim 200 points |
| 80–100% | Final Fortune | Diamonds are worth 70 and pearls 120 before combo bonuses |

The relic remains claimable after its appearance. Each chest/relic can be claimed once per round. Regular pickups respawn after 22 seconds. All players receive the same event, pickup, mission and score state. At the deadline scoring freezes before another pickup is processed.

## Local preview

From the project directory:

```sh
npm ci --include=dev
npm run build
```

Windows PowerShell:

```powershell
$env:NODE_ENV='production'
npm start
```

Open http://localhost:3000 in two tabs, create/join the same room, mark ready and start as captain. On mobile, use the same public server URL after deployment; localhost refers to the phone itself.

## Update the existing GitHub repository and Render service

V1 is currently live at https://treasure-rush-i2co.onrender.com/. V2 does not replace that deployment until its files are committed to GitHub and Render rebuilds.

The update archive is arranged to match the repository's **existing** nested directory:

```text
README.md
treasure-rush-source/
  treasure-rush/
    package.json
    package-lock.json
    client/
    server/
    shared/
    public/
    ...
```

1. Extract `treasure-rush-v2-update.zip`.
2. Open the extracted folder. Upload the `README.md` file and the `treasure-rush-source` folder inside it to the existing GitHub repository using **Add file → Upload files**. Preserve that exact hierarchy; do not upload the ZIP or an additional wrapper directory.
3. Commit with a message such as `Upgrade Treasure Rush to Sunstone Expedition v2`.
4. Keep Render settings:
   - Root Directory: `treasure-rush-source/treasure-rush`
   - Build Command: `npm ci --include=dev && npm run build`
   - Start Command: `npm start`
   - `NODE_ENV=production`, `NODE_VERSION=24.21.0`
   - Health check: `/api/health`
5. Deploy the latest commit if auto-deploy does not start it.
6. After Render says **Live**, refresh the game. The match title should read **Sunstone Island** and the map badge **EXPANDED WORLD · V2**.
7. Use two browsers/devices to join, ready, move, dig, dash and finish a match. Run the deployed smoke test against the public server after the update.

Redeployment restarts the server and resets active rooms. Finish any current match first and create a fresh room after deploying.

## Verification and scope

The engine/network suite covers the original room, fairness, reconnect and rematch behavior, plus dash cooldown/collision, the event schedule, dig cancellation, contested relic claims, magnet range, combo bonuses, contracts, storm damage and final-event rewards. The Playwright suite covers real six-session browser play, keyboard dash, shared scores, reconnect, rematch, illustrated scene loading and mobile controls.

The previous V1 evidence is preserved in `TESTING.md`. Final V2 checks:

- TypeScript validation and the production build passed.
- **20 engine/network tests passed**, including all new scoring, event, dig, dash and storm regressions.
- **3 Playwright scenarios passed**: desktop/mobile layouts; six independent sessions with synchronized scoring, keyboard dash, reconnect and second-round play; and real mobile-control movement in a shared match.
- The built local production service passed the six-WebSocket-client smoke test, including the three-minute production clock.
- `npm audit --omit=dev --audit-level=high` reported **0 vulnerabilities**.

The first browser pass exposed an external-font loading delay and a missed very short Q-key tap. Fonts are now self-hosted, and dash uses a key-down event rather than per-frame polling. The full browser suite passed after both fixes. Desktop and mobile screenshots were visually reviewed.

A fresh release check also found that random pickups could appear close enough to a spawn to award points immediately. Random pickups now stay at least 70 pixels from every spawn; the map regression checks 100 generated layouts. The production build, all 20 engine/network tests and all three browser scenarios passed after this fix.

V2 is **not yet deployed publicly**. The six-client smoke test for this version used the built local service; it must be repeated against Render after deployment. Physical mobile and internet latency/packet-loss checks remain follow-up release checks.

The terrain is an illustrated 2D world with simplified collision volumes for major cliffs. Authored elevation and navigation meshes remain future work. The game still runs on one Node process, with short reconnect support but no room recovery across restarts. PostgreSQL and OpenAI remain optional integrations awaiting live account verification. This update does not introduce bots or simulated multiplayer.
