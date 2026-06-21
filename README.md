# 🐇 Rabbit Holes

**Follow ideas, not tabs.**

Browsers understand tabs, windows, and bookmarks. Rabbit Holes understand
*investigations*. It watches your browsing and automatically organizes it into
structured "rabbit holes" — the questions you were actually chasing — with a
map of how you got there, a replayable timeline, extracted entities, and a
context-restore so you can pick an investigation back up later.

This is **not** a productivity app, a note-taking app, or Notion. The product is
the context graph. AI is used only to cluster, name, and summarize.

---

## Architecture

```
extension/   Chrome MV3 — captures tab opens/closes, URL visits, search
             queries, navigation chains, timestamps; batches → backend.
backend/     FastAPI — ingests events, clusters them into rabbit holes via
             the Anthropic API (Claude Opus 4.8), serves the web app.
web/         Next.js + TypeScript + Tailwind + Framer Motion + React Flow —
             the dashboard, rabbit-hole detail, map graph, and timeline.
```

The web app ships with rich seed data, so it looks and runs great with no
backend. Wire the backend + extension in to capture your own browsing.

---

## Run the web app

```bash
cd web
npm install
npm run dev      # http://localhost:3000
```

Set `NEXT_PUBLIC_BACKEND_URL` if your backend is not on `http://localhost:8000`.
Use **🕳 Build rabbit holes** in the dashboard, or `⌘K` → **Run clustering**,
to fire the rabbit-diving animation from a live `/cluster` response.

Pages:
- **/** — dashboard of rabbit holes (cards à la Arc/Linear) + the painterly hero
- **/holes/[id]** — the detail page: overview, map, timeline, entities, pages
- **/map** — the graph of your curiosity (React Flow)
- **/timeline** — replay your investigations, grouped by day
- `⌘K` — command palette

## Run the backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # then add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

Once both services are running, open a few searches/visits in the extension,
then click **🕳 Build rabbit holes** (dashboard) or **Run clustering** (`⌘K`)
to trigger discovery animation when new clusters are returned.

Endpoints: `POST /events` (ingest), `POST /cluster` (run the AI layer),
`GET /signals`, `GET /health`.

## Load the extension

1. Visit `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** → select the `extension/` folder.
3. Browse. Click the 🐇 to see capture stats and build rabbit holes.

Point `extension/config.js` `BACKEND_URL` at your backend.

---

## ⚠️ Security note

`backend/.env` holds your `ANTHROPIC_API_KEY` and is **gitignored**. If a key was
ever shared in plaintext (chat, a screenshot, a commit), rotate it at
<https://console.anthropic.com/settings/keys>.
