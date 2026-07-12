# Muskaan.ai 🏠

**Plot size → floor plan, in seconds.**

Muskaan.ai is a residential floor-plan generator built for how Indian homes actually get planned. Enter your plot's length, width, and facing direction — get 10 real, computed layout options with 2D blueprints, 3D views, a Vastu guidance score, and a rough cost estimate.

Not AI-generated images, not stock photos — every layout is computed by a room-allocation algorithm from your plot's actual dimensions.

---

## ✨ Features

- **10 layout variations per plot** — hall, kitchen, bedrooms, washrooms, garage, balcony, proportioned to your actual plot area
- **Multi-floor support** — Ground floor only, G+1, or G+2
- **2D Blueprint + 3D View** — dimensioned architectural drawing and an isometric massing view for every layout
- **Hindi + English room labels** — बैठक, रसोई, शयन कक्ष alongside their English names
- **Vastu guidance score** — rule-of-thumb compliance check with tips (clearly marked as traditional guidance, not a scientific claim)
- **Rough cost estimator** — Basic / Standard / Premium quality tiers with a per-sq-ft cost breakdown
- **Compare 2 layouts side-by-side** — pick any two and compare rooms, Vastu score, and cost
- **PDF export** — download any layout's blueprint and details
- **WhatsApp share** — send a layout summary straight to a chat
- **Accounts + saved plans** — sign up, save layouts you like, revisit them anytime
- **Interior/exterior style moodboards** — Modern, Traditional Indian, Contemporary, Industrial directions (real AI photo generation requires connecting an image API — see backend README)

---

## 📁 Project structure

```
muskaan-ai/
├── muskaan-ai.html        → the main app (plot input, layouts, blueprints, everything)
├── muskaan-landing.html   → marketing/landing page, links to the app
└── muskaan-backend/       → Node.js/Express API (auth, saved plans, floor-plan engine, image-gen route)
    ├── server.js
    ├── routes/
    ├── db/
    ├── middleware/
    ├── utils/
    └── README.md          → backend-specific setup instructions
```

---

## 🚀 Running it locally

### 1. Backend

```bash
cd muskaan-backend
npm install
cp .env.example .env
# open .env and set JWT_SECRET to a long random string
# (optional) set IMAGE_API_KEY if you have one, for the interior/exterior image feature
npm start
```

Backend runs at `http://localhost:4000`.

### 2. Frontend

Just open `muskaan-ai.html` (or `muskaan-landing.html`) directly in a browser — no build step needed. Make sure the backend is running so signup, saved plans, and layout generation work; if the backend isn't reachable, layout generation still works locally as a fallback.

---

## 🌐 Deploying

See `muskaan-backend/DEPLOYMENT.md` for step-by-step instructions to host the backend on Render and the frontend on Netlify/Vercel.

---

## ⚠️ Honest limitations

- Layouts are algorithmically generated, not drawn by a human architect — use them as a starting point for the conversation with a licensed architect, not a construction-ready drawing.
- The Vastu score is traditional rule-of-thumb guidance, not an engineering or scientific claim.
- The cost estimate is a rough per-sq-ft calculation — get local contractor quotes for an accurate figure.
- The database is a simple JSON file by default (`muskaan-backend/db/data.json`) — fine for a prototype, but should be migrated to Postgres before real production use (see `prisma-schema-example.prisma` in the backend folder).

---

## 🛠️ Built with

Vanilla HTML/CSS/JS on the frontend (no framework, no build step) · Node.js + Express backend · JWT auth · a guillotine-partition algorithm for room layout generation.
