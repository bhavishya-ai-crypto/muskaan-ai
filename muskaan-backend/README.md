# Muskaan.ai — Backend

Node.js/Express backend for Muskaan.ai. Handles user accounts, server-side
floor-plan generation (same engine as the frontend, now authoritative),
saved plans, and an AI image-generation route you can plug a real key into.

## Setup

```bash
npm install
cp .env.example .env
# open .env and set JWT_SECRET to a long random string
npm start
```

Server runs on `http://localhost:4000` by default.

## Project structure

```
server.js              Express app entry point
routes/auth.js          POST /api/auth/signup, /api/auth/login
routes/plans.js          POST /api/plans/generate   (public — try before signup)
                          POST /api/plans/save        (auth)
                          GET  /api/plans             (auth — list your plans)
                          GET  /api/plans/:id         (auth)
                          DELETE /api/plans/:id       (auth)
routes/images.js         POST /api/images/generate   (auth — see below)
middleware/auth.js       JWT verification
utils/floorPlanGenerator.js   The room-allocation algorithm (ported from frontend)
db/database.js           Storage layer — currently a JSON file (db/data.json)
```

## Database

Storage is a single JSON file (`db/data.json`), auto-created on first run.
Zero native dependencies, so it runs anywhere Node runs — good for a
prototype or small deployment. **For production with real concurrent
traffic, swap `db/database.js` for Postgres/MySQL** (e.g. via Prisma).
The function signatures (`createUser`, `savePlan`, `getPlansForUser`, etc.)
are written so only this one file needs to change.

## Connecting real AI image generation

`routes/images.js` is a complete, working integration — it's just missing
your API key. To turn it on:

1. Get an API key from **console.x.ai** (xAI/Grok). Check their current
   pricing/free-tier terms yourself before relying on it — those change,
   and the code doesn't assume either way. Their image model name and
   request shape may also have changed since this was written — check
   their docs if `routes/images.js` starts erroring.
2. Set `IMAGE_API_KEY=your-key-here` in `.env`
3. Restart the server

(You can swap the `fetch` call in `routes/images.js` for OpenAI, Stability
AI, or another provider instead — the rest of the route stays the same.)

Until a key is set, the route responds with a clear `501` explaining
what's missing, instead of pretending to return real images.

## Example requests

```bash
# Generate 10 layouts for a 40x30 ft plot (no login needed)
curl -X POST http://localhost:4000/api/plans/generate \
  -H "Content-Type: application/json" \
  -d '{"length":40,"width":30,"facing":"North"}'

# Sign up
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Rohit","email":"rohit@test.com","password":"secret123"}'

# Save a plan (use the token from signup/login)
curl -X POST http://localhost:4000/api/plans/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"length":40,"width":30,"facing":"North","rooms":[...]}'
```

## Connecting the frontend

In `muskaan-ai.html`, replace the client-side `generateLayout()` calls with
a `fetch("http://localhost:4000/api/plans/generate", ...)` call, and add
signup/login forms that call `/api/auth/signup` and `/api/auth/login`,
storing the returned token (e.g. in memory or a cookie) to send as
`Authorization: Bearer <token>` on `/api/plans/save`.
