# Editing FieldX Docs (no coding needed)

Pages are plain HTML. Look for green `<!-- EDIT: ... -->` notes in the file —
everything they point at is safe to change.

## Preview your change

```powershell
python -m http.server 8000 --directory "C:\Users\prati\OneDrive\Desktop\FieldX Doc"
```
Open http://localhost:8000 — edit, save, refresh the browser.

## Safe to edit (just change the words)

| What | Where | Example |
|---|---|---|
| Page heading + intro | After `<!-- EDIT: heading + intro -->` | `<h1>`, `<p>`, `<span class="meta">` |
| Article titles | `<button class="article-title"><span>…` | Text inside `<span>` |
| Article bodies | `<div class="article-body">…` | `<p>`, table cells `<td>`, steps `<div class="step">` |
| Right-side menu | `<nav class="toc">…` | Link text (keep `href="#…"` matching a section `id`) |
| FAQ / Changelog entries | Copy a full `<article>…</article>` block, paste, change text |

## Do NOT touch

- Anything in `class="…"` or `id="…"` (styling + search depend on these)
- `<script src="…">` lines and anything inside `<script>` / `<style>`
- The sidebar (`<aside class="sidebar">…`) — it is copied on every page; ask before changing
- File names (links + search index point at them)

## Publish (goes live on its own)

```powershell
git add -A
git commit -m "Describe your change"
git push origin main
```
Vercel redeploys https://fieldx-doc.vercel.app/ automatically in ~1 minute.

## Add a brand-new page (ask first)

A new page needs the same header/sidebar/footer as the others plus a search-index
rebuild. Ping before doing this one — it needs a helper script run.
