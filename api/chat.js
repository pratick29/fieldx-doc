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

const STOP = new Set(('how,do,does,what,when,where,which,who,why,the,a,an,and,or,for,to,of,on,in,is,are,was,can,i,my,with,please,tell,show,give,me,device,devices').split(','));
const SYN = {
  wipe: ['wipe', 'wipes', 'factory reset', 'erase'],
  lost: ['lost', 'stolen', 'lock', 'lockdown'],
  stolen: ['stolen', 'lost', 'lock', 'wipe'],
  lock: ['lock', 'lockdown'],
  block: ['block', 'disallow', 'disable', 'blacklist'],
  allow: ['allow', 'permit', 'whitelist'],
  install: ['install', 'push', 'deploy', 'sideload'],
  update: ['update', 'upgrade', 'ota', 'firmware', 'rollout'],
  password: ['password', 'passcode', 'pin'],
  pin: ['pin', 'passcode', 'password'],
  wifi: ['wifi', 'wi-fi', 'ssid', 'wireless'],
  kiosk: ['kiosk'],
  enroll: ['enroll', 'enrollment', 'provisioning', 'onboard'],
  qr: ['qr'],
  group: ['group', 'bucket', 'zone'],
  report: ['report', 'export', 'audit', 'compliance'],
  app: ['app', 'application', 'package', 'apk'],
  camera: ['camera'],
  sms: ['sms', 'text message', 'fallback'],
  certificate: ['certificate', 'scep', 'credential'],
  vpn: ['vpn'],
};
function expand(terms) {
  const out = [];
  terms.forEach(function (t) {
    out.push(t);
    if (SYN[t]) SYN[t].forEach(function (s) { if (out.indexOf(s) === -1) out.push(s); });
  });
  return out;
}

function score(entry, terms, neg) {
  let s = 0, covered = 0;
  const title = entry.title.toLowerCase();
  for (const t of terms) {
    if (!t) continue;
    const th = title.split(t).length - 1;
    const xh = entry._t.split(t).length - 1;
    if (th > 0 || xh > 0) covered++;
    if (th > 0) s += 5 * Math.min(th, 3);
    s += Math.min(xh, 5);
  }
  if (covered >= 2) s += 12 * covered;
  if (neg) {
    for (const t of neg) {
      const nh = entry._t.split(t).length - 1;
      if (nh > 0) s -= 15 * Math.min(nh, 3);
      if (title.split(t).length > 1) s -= 60;
    }
  }
  return s;
}

function retrieve(q, k) {
  k = k || 6;
  let terms = q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2 && !STOP.has(w); });
  if (!terms.length) terms = q.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 2; });
  const neg = [];
  const nq = q.toLowerCase();
  ['without', 'except', 'no ', 'not '].forEach(function (n) {
    const i = nq.indexOf(n === 'no ' || n === 'not ' ? n : n);
    if (i !== -1) {
      const w = nq.slice(i + n.length).split(/\s+/).filter(Boolean)[0];
      if (w && w.length > 1) neg.push(w.replace(/[^a-z0-9]/g, ''));
    }
  });
  terms = expand(terms);
  return loadKB()
    .map(function (e) { return { e: e, s: score(e, terms, neg) }; })
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

  try {
    const chunks = retrieve(message, 5);
    const context = chunks.map(function (c, i) {
      return '[' + (i + 1) + '] ' + c.title + ' (' + c.page + '#' + c.id + '): ' + c.text;
    }).join('\n\n');

  const sys = 'You are the FieldX documentation assistant. Answer ONLY from the documentation excerpts below, ' +
    'using their terminology. Be precise and concise: open with the direct answer in 1-2 lines, then give ' +
    'steps as a short numbered list or key points as bullets when helpful. No background, no fluff, no repetition. ' +
    'Reference relevant pages as [title](page#id) using exactly the page and id given. ' +
    'If the excerpts lack the answer, say so in one line and suggest info@fieldx.io. ' +
    'Never invent console paths, settings, or version numbers.';

    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
        'HTTP-Referer': 'https://fieldx-doc.vercel.app/',
        'X-Title': 'FieldX Docs Assistant'
      },
      body: JSON.stringify({
        model: model, max_tokens: 500, temperature: 0.2,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: 'Documentation excerpts:\n' + context + '\n\nQuestion: ' + message }
        ]
      })
    });
    if (!r.ok) {
      let detail = '';
      try { detail = String(await r.text()).slice(0, 200); } catch (e2) { detail = ''; }
      res.status(502).json({ error: 'AI service error (provider said ' + r.status + '). ' + detail + ' Try again.' });
      return;
    }
    const j = await r.json();
    const reply = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
    res.status(200).json({
      reply: String(reply).trim(),
      sources: chunks.map(function (c) { return { title: c.title, page: c.page, id: c.id }; })
    });
  } catch (e) {
    const msg = (e && e.message ? String(e.message) : 'unknown').slice(0, 160);
    res.status(502).json({ error: 'AI service error (' + msg + '). Try again.' });
  }
};

module.exports.retrieve = retrieve;
