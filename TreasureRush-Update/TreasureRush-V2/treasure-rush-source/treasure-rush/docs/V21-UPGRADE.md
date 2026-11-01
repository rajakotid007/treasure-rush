# Treasure Rush 2.1 — Digging and terrain update

## Gameplay changes

- Chests require one uninterrupted second of holding SPACE or the mobile DIG button while stationary and within 65 world pixels. The Sun Relic requires 1.6 seconds. Progress uses server elapsed time. A quick tap, movement, stun, dash, or release cancels progress.
- Release SPACE / DIG before excavating the next chest. A short release between server ticks is handled immediately.
- An authored coastline blocks ocean movement. Nine marked waterfall/pool volumes block movement and show warning symbols. Touching a waterfall costs up to 25 points and briefly stuns the player, with a two-second damage cooldown. Shields absorb a hit. Scores never fall below zero.
- Treasure is generated on valid land, outside waterfall volumes and rocks. Dashed movement uses collision substeps.
- New players see a simple three-step controls guide in the lobby before marking ready. The guide explains keyboard/touch movement, digging, dash, and water hazards. A local browser flag remembers dismissal; How to play remains available.
- Gold, diamonds, pearls, chests and relics use larger illustrated sprites, brighter glows, and contrasting labels. The HUD explains excavation progress and when to release the button.

## Verification — 1 November 2026

- `npm test`: **24 passed, 0 failed**. Includes real six-client Socket.IO integration plus four added regression tests for quick taps/continuous holds, between-tick releases/movement, land/loot placement, and waterfall damage/shield/cooldown.
- `npm run build`: passed, including TypeScript validation and frontend/server builds. The lazy Phaser engine chunk still triggers Vite's size advisory.
- `npm run test:e2e`: **3 passed** in installed Chrome. Independent six-browser create/join, guide acknowledgement, readiness, movement, dash, shared scores, reconnect, results, rematch; mobile-emulated touch controls and no horizontal overflow.
- Reviewed generated desktop, mobile-game and onboarding screenshots in `docs/`.

The new release is locally verified. Its public deployment must be checked after manual upload. Terrain uses approximate authored volumes on a painted image, not a full 3D navigation mesh. Physical iOS/Android and high-latency network testing remain outstanding.

## Manual GitHub upload — keep the current Render root

1. Extract `TreasureRush-V2.1-update.zip` using Extract All.
2. Open the extracted folder. Inside is a folder named **TreasureRush-V2**.
3. Open https://github.com/rajakotid007/treasure-rush, at the repository root (where you already see TreasureRush-V2).
4. Choose Add file → Upload files. Drag the **TreasureRush-V2** folder from inside the extracted ZIP into the upload area. This updates the existing folder. Do not upload the ZIP itself or its outer extraction folder.
5. Confirm the listed paths begin `TreasureRush-V2/treasure-rush-source/treasure-rush/`. Commit as `Update digging, waterfall hazards and beginner guide`.
6. On Render choose Manual Deploy → Deploy latest commit. Keep Root Directory `TreasureRush-V2/treasure-rush-source/treasure-rush`, Build Command `npm ci --include=dev && npm run build`, Start Command `npm start`.
7. Wait for Your service is live. Refresh the game with Ctrl+Shift+R. Leave any old room and create a new one. The map badge should show **LAND & WATERFALLS · V2.1**.
8. Check two players can join, read the guide, ready/start, hold SPACE near a chest for a full second, release before the next chest, and see matching scores. Touch a marked waterfall with a positive score and no shield: expect a 25-point deduction and blocked movement.

The older top-level `treasure-rush-source` folder is not used by the current Render root; do not switch back to it.
