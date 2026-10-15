# FieldX Documentation site

Static docs site (plain HTML + CSS + JS). Purely static — no backend.
Currently live at https://fieldx-doc.vercel.app/.

The AI chatbot lives in its own repo/project
(`pratick29/fieldx-chatbot`) and appears here as an embedded iframe.
This repo contains no chatbot code, no API keys, no secrets.

## What's inside

- `*.html` — content pages (root level)
- `restrictions/*.html` — one page per restriction category
- `assets/` — `minimal.css` (theme), `ui.js` (site behavior),
  `full-index.js` + `full-index.json` (search index, generated)
- `tools/` — `build_index.py`, `verify.py`
- `sitemap.xml`, `robots.txt`, `EDITING.md` (content-editing guide)

## Run locally

```powershell
python -m http.server 8000
# open http://localhost:8000
```

The chat bubble opens the chatbot iframe (needs internet + a
deployed chatbot project).

## Hosting

Push to `main` and Vercel auto-deploys. No build step, no config file.
Runs on any static host (cPanel, Nginx, S3…) with zero changes.

## Moving to a new domain (checklist)

1. `sitemap.xml` — replace the domain in every `<loc>`.
2. The chatbot project's `ALLOWED_ORIGINS` must list the new domain
   (then redeploy the chatbot project).

## Content workflow

- Text edits: plain HTML, guided by `EDITING.md`. No build needed.
- New/removed/restructured articles or pages:
  1. `python tools/build_index.py` (safe — byte-identical when nothing
     relevant changed) → regenerates the search index.
  2. Tell the chatbot repo: new documented features need matching
     `api/kb.json` records there (hand-curated — mirror existing ones).
  3. New page? Also add it to the sidebar (copied per page), the
     prev/next chain, `sitemap.xml`, and the home module list.
- Health check anytime: `python tools/verify.py`.

## Chatbot (separate project)

- Lives at `pratick29/fieldx-chatbot`, deployed as its own Vercel site.
- These docs embed it as an iframe (bubble button + lazy-loaded frame
  on all content pages). The iframe URL is the only coupling — update
  it if the chatbot project moves.
- No API keys, env vars, or backend concerns exist in this repo.
