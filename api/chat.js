const fs = require('fs');
const path = require('path');

let KB = null;
function loadKB() {
  if (!KB) {
    KB = JSON.parse(fs.readFileSync(path.join(__dirname, 'kb.json'), 'utf8'));
    KB.forEach(function (e) { e._t = (e.title + ' ' + e.text).toLowerCase(); });
  }
  return KB;
}

function score(entry, terms) {
  let s = 0;
  const title = entry.title.toLowerCase();
  for (const t of terms) {
    if (!t) continue;
    const th = title.split(t).length - 1;
    const xh = entry._t.split(t).length - 1;
    if (th > 0) s += 10 * Math.min(th, 3);
    s += Math.min(xh, 5);
  }
  return s;
}

function retrieve(q, k) {
  k = k || 5;
  const terms = q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2; });
  return loadKB()
    .map(function (e) { return { e: e, s: score(e, terms) }; })
    .filter(function (r) { return r.s > 0; })
    .sort(function (a, b) { return b.s - a.s; })
    .slice(0, k)
    .map(function (r) { return r.e; });
}

module.exports = async function (req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const message = String((body && body.message) || '').slice(0, 500).trim();
  if (!message) { res.status(400).json({ error: 'Empty question' }); return; }
  const key = process.env.OPENAI_API_KEY;
  if (!key) { res.status(503).json({ error: 'Chat backend is not configured yet.' }); return; }
  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const chunks = retrieve(message, 5);
  const context = chunks.map(function (c, i) {
    return '[' + (i + 1) + '] ' + c.title + ' (' + c.page + '#' + c.id + '): ' + c.text;
  }).join('\n\n');

  const sys = 'You are the FieldX documentation assistant. Answer ONLY from the documentation excerpts below. ' +
    'Be concise (max ~120 words). Reference relevant pages as [title](page#id) using exactly the page and id given. ' +
    'If the excerpts do not answer the question, say you could not find it in the docs and suggest contacting info@fieldx.io. ' +
    'Never invent console paths, settings, or version numbers.';

  try {
    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
        'HTTP-Referer': 'https://fieldx-doc.vercel.app/',
        'X-Title': 'FieldX Docs Assistant'
      },
      body: JSON.stringify({
        model: model, max_tokens: 300, temperature: 0.2,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: 'Documentation excerpts:\n' + context + '\n\nQuestion: ' + message }
        ]
      })
    });
    if (!r.ok) { res.status(502).json({ error: 'AI service error. Try again.' }); return; }
    const j = await r.json();
    const reply = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
    res.status(200).json({
      reply: String(reply).trim(),
      sources: chunks.map(function (c) { return { title: c.title, page: c.page, id: c.id }; })
    });
  } catch (e) {
    res.status(502).json({ error: 'AI service error. Try again.' });
  }
};

module.exports.retrieve = retrieve;
