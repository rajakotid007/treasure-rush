# Treasure Rush — project description

## Short description

Treasure Rush is a real-time multiplayer browser adventure for 2–6 friends. Explore a colorful island, uncover mystery treasure, dodge traps, grab power-ups and race to the top of a synchronized leaderboard. No player account or installation is required.

## Professional project description

Treasure Rush turns a simple room code into a shared three-minute island adventure. Players choose one of six explorers and compete for coins, diamonds and hidden mystery chests while balancing trap risks, temporary power-ups and a collection mission. A live leaderboard and shared results screen make every pickup part of the competition.

Built with TypeScript, React, Phaser 3, Express and Socket.IO, the game uses a server-authoritative simulation. The backend validates movement inputs, resolves collisions and treasure claims, awards points and controls the match deadline. Short-lived session credentials support reconnection without requiring player accounts. Optional PostgreSQL persistence stores final results.

AI has a deliberate supporting role. An OpenAI Responses integration can provide bounded treasure flavor, while a separate Agents SDK workflow organizes development advice across design, implementation, QA and UI/UX roles. Neither AI path can modify critical gameplay state. Automated engine, socket and multi-context browser tests provide reproducible evidence of actual multiplayer behavior.

## Submission details

- **Title:** Treasure Rush — Real-Time Multiplayer Island Adventure
- **Live project link:** https://treasure-rush-i2co.onrender.com/
- **Source link:** https://github.com/rajakotid007/treasure-rush
- **Direct code location:** https://github.com/rajakotid007/treasure-rush/tree/main/treasure-rush-source/treasure-rush
- **Cover:** `public/cover.png`
- **Demo evidence:** `docs/preview-home.png`, `docs/preview-lobby.png`, `docs/preview-game.png`, and the test report.
- **Skills:** TypeScript, real-time multiplayer architecture, server-authoritative simulation, React, Phaser, Socket.IO, Playwright, AI tool boundaries, deployment design.

## Test evidence for reviewers

- TypeScript validation and the production build passed.
- 13 automated engine/network tests passed.
- Three Playwright scenarios passed, including six independent browser sessions and mobile-emulated controls.
- The six-browser refresh/rematch regression passed two additional consecutive runs.
- The public Render server passed a six-client WebSocket smoke test for room joining, synchronized movement/rewards and the production three-minute clock.
- The owner and a friend completed a real public match and reached final scores of 1,895 and 1,745; the owner reported completing the play-again flow. This is user-reported evidence, distinct from the automated tests.

## Reviewer quick start

Open the live link in two tabs or on two devices. Create an expedition in one, share the invite, and enter a name and select Join in the other. Confirm both lobbies display the same room code. Mark both explorers ready; the current captain starts. Move with WASD/arrows or the mobile direction pad, collect treasure, and hold Space/DIG near a revealed chest. The highest score after three minutes wins. Equal top scores share victory.

The Free Render service can have a slow first load after inactivity. Rooms live in one server process and do not survive restarts. Current content includes one island, six cosmetic characters and one fixed collection mission. PostgreSQL persistence and OpenAI integrations are implemented as optional modules, but live database/API calls are not verified and should not be represented as active production features. No paid API call is required to play.

## Suggested AI-use disclosure

I used an AI coding assistant to help with architecture, game design, TypeScript implementation, generated cover artwork, testing and deployment troubleshooting. I configured the hosting and repository and playtested the public multiplayer game with a friend. The project also includes an optional OpenAI Responses integration for story flavor and an Agents SDK development planning workflow. Critical gameplay remains controlled by deterministic backend code, rather than model output.

Review this disclosure for accuracy before submitting it under your name. Verify the form's actual current requirements in your Handshake account. These are prepared submission materials; no submission or acceptance is claimed.
