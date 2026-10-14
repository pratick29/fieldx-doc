# FieldX Documentation site

Static docs site (plain HTML + CSS + JS) with an AI chatbot backed by a
serverless API. Currently live at https://fieldx-doc.vercel.app/.

## What's inside

- `*.html` — content pages (root level)
- `restrictions/*.html` — one page per restriction category
- `assets/` — `minimal.css` (theme), `ui.js` (site behavior),
  `ai-chat.js` (chatbot widget), `full-index.js` + `full-index.json`
  (search index, generated — see Tools)
- `api/chat.js` — chatbot serverless function (needs a Node host)
- `api/kb.json` — chatbot knowledge base (**hand-curated**, see below)
- `tools/` — `build_index.py`, `build_kb.py`, `verify.py`, `tests/`
- `sitemap.xml`, `robots.txt`, `EDITING.md` (content-editing guide)

## Run locally

```powershell
python -m http.server 8000
# open http://localhost:8000
```

Note: plain `http.server` cannot run `/api/chat`, so locally the
chatbot shows "backend unreachable". It works once deployed with the
env vars below.

## Hosting

**Option A — Vercel (current, recommended).** Push to `main` and Vercel
auto-deploys. No build step, no config file. The chatbot API runs as a
serverless function automatically.

**Option B — any other static host (cPanel, Nginx, S3…).** Pages work
unchanged, but `/api/chat.js` will NOT run there. Two choices:

1. Keep the API on Vercel and point the widget at it (works from any
   domain). In `assets/ai-chat.js`, or per-embed via
   `data-api="https://<your-vercel-app>.vercel.app/api/chat"`.
2. Re-host the API on another Node backend (rewrite of `api/chat.js`
   only — the widget, KB format, and prompt stay the same).

## Moving to a new domain (checklist)

If the site stops living at `fieldx-doc.vercel.app`, update all three:

1. `sitemap.xml` — replace the domain in every `<loc>`.
2. `ALLOWED_ORIGINS` env var — must list the exact new domain(s),
   comma-separated, no trailing slashes. Then redeploy.
3. Search this repo for remaining `fieldx-doc.vercel.app` references
   (widget defaults, API CORS text, docs) and update them.

## Environment variables (wherever the API runs)

| Var | Required | Purpose / value |
|---|---|---|
| `OPENAI_API_KEY` | yes | LLM provider key. Never commit it anywhere. |
| `OPENAI_BASE_URL` | no | Provider endpoint. Omit for OpenAI (`https://api.openai.com/v1`). E.g. OpenRouter: `https://openrouter.ai/api/v1`; Hugging Face: `https://router.huggingface.co/v1`. |
| `OPENAI_MODEL` | no | Model id. Omit for `gpt-4o-mini`. Free-tier ids change often — check the provider's model list. |
| `ALLOWED_ORIGINS` | yes for embeds | Comma-separated domains allowed to call `/api/chat`. Must include the docs domain itself plus every embedding site (e.g. admin console). |

**After changing any variable: redeploy.** Env changes never apply to
existing deployments.

## Content workflow

- Text edits: plain HTML, guided by `EDITING.md`. No build needed.
- New/removed/restructured articles or pages:
  1. `python tools/build_index.py` (safe — byte-identical when nothing
     relevant changed) → regenerates the search index.
  2. Chatbot KB: `api/kb.json` is **hand-curated**. Run
     `python tools/build_kb.py` to print draft records for new
     articles only, then hand-finish keys/intents/platforms/sources
     like the existing records and append manually. Never
     blind-overwrite the file.
  3. New page? Also add it to the sidebar (copied per page), the
     prev/next chain, `sitemap.xml`, and the home module list.
- Health check anytime: `python tools/verify.py`.
- Chatbot tests (need Node): `node tools/tests/test_chat.js`,
  `test_or.js`, `test_canon.js`, `test_thresh.js`, `test_console.js`,
  `test_widget.js`.

## Chatbot in brief

- Widget `assets/ai-chat.js`: floating bubble on content pages; embed
  anywhere with the `data-api` snippet above (+ optional
  `data-page="Groups"` for screen-aware answers).
- Backend `api/chat.js`: keyword RAG (synonyms, negation, weighted
  tiers, rerank, confidence threshold) over `api/kb.json`, then one
  LLM call. Stateless — no chat history is stored anywhere by design.
- If answers fail: the widget shows the provider's reason. Common
  causes are missing `OPENAI_API_KEY`, an expired free model id, or a
  missing `ALLOWED_ORIGINS` entry (cross-domain embeds).
