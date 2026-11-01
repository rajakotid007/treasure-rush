# Publish Treasure Rush

## Recommended first route: one Render service

This publishes both the frontend and the real multiplayer server at one URL. Netlify is optional.

1. Create a GitHub repository named `treasure-rush`. Upload the **contents** of this source folder, including `package-lock.json`, `render.yaml`, `client/`, `server/`, `shared/`, `public/`, and `scripts/`. Do not upload `node_modules`, `.env`, `dist`, `dist-tests`, reports, or test artifacts. If you upload the enclosing folder too, set Render's Root Directory to that folder.
2. Sign in at [Render](https://dashboard.render.com/) using GitHub. Authorize access to the new repository.
3. Select **New → Blueprint**, choose the repository and inspect `render.yaml`. The supplied Blueprint uses one Free Node service. Review the current plan and charges shown by Render before choosing a paid plan.
4. Alternatively, select **New → Web Service**, choose the repository, and enter:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Health check | `/api/health` |
| Environment | `NODE_ENV=production` |
| Node version | `NODE_VERSION=24.21.0` |
| Instances | **1** |

5. Click deploy and wait for a successful live status. Use Render's actual returned `https://…onrender.com` URL; names and URLs cannot be promised before allocation.
6. Visit `/api/health`. It should return JSON with `ok: true`.
7. Open the main URL on two different devices. Create and join a room, ready both, move and collect treasure. Both leaderboards must update. Refresh one tab within 45 seconds and confirm its score is retained. Complete a three-minute match and start a rematch.
8. Only after that check, use the live game URL in your project submission.

The server binds `0.0.0.0` and reads Render's `PORT`. All players in one game must connect to the same service. Do not enable multiple replicas for this in-memory simulation.

From the source folder, you can also run `npm run test:deployed -- YOUR_ACTUAL_BACKEND_URL` to check health, six WebSocket players, the production clock and shared scoring. The command creates a temporary test room and leaves it afterward; it does not finish a full match or replace the two-device visual check.

Render Free services can spin down after inactivity, causing a slow first visit; service restarts lose active rooms. Review [Render's free service limits](https://render.com/docs/free) and consider an always-on instance for public demos. The supplied file does not purchase a paid service.

## Optional: Netlify frontend + Render backend

You can use your Netlify account for the frontend after the Render server is live.

1. In Netlify, import the same GitHub repository. Use `npm run build` as build command and `dist/client` as publish directory (already in `netlify.toml`).
2. Set Netlify's **build-time** environment variable `VITE_SERVER_URL` to the exact Render server URL, e.g. your actual HTTPS origin without a trailing slash. Redeploy after setting it. This variable is public by design; never put keys in a `VITE_` variable.
3. In Render, set `CLIENT_ORIGIN` to the exact Netlify frontend origin, with no trailing slash. Multiple approved origins can be comma-separated. Redeploy the backend.
4. Open the Netlify URL on two devices and repeat the multiplayer smoke test. Share the Netlify URL with players.

The frontend must not use localhost for a public server address. Room invite links automatically use the frontend origin from which a room was created. Use the same frontend URL for all participants so they reach the configured server.

Vercel can use the equivalent values in `vercel.json`. Neither frontend hosting configuration hosts the Socket.IO simulation as a serverless function.

## Optional PostgreSQL

Create a PostgreSQL database on your provider. Set `DATABASE_URL` on Render, using an internal URL if the database and service are in the same provider network. Follow the provider's TLS settings (including CA verification when required). On startup, the server creates the `matches` table. It saves final scoreboards only, not anonymous player identities across visits. No database is required for matches to function.

Startup fails visibly if a configured database cannot initialize, rather than silently pretending persistence works. A save failure during a game is logged and does not block the simulation; a retry/outbox queue is future work.

## Optional OpenAI

Set `OPENAI_API_KEY` only in the backend's secret environment. Set `AI_ENABLED=true` and optionally `OPENAI_CONTENT_MODEL=gpt-6-luna`. The server makes at most one cached, time-bounded flavor request per process lifetime and uses fixed fallback text on failure. AI cannot change a score, position, timer or winner.

## Sources

- [Render web service deployment](https://render.com/docs/web-services)
- [Render WebSocket support](https://render.com/docs/websocket)
- [Render Blueprint specification](https://render.com/docs/blueprint-spec)
- [Socket.IO server options](https://socket.io/docs/v4/server-options/)
