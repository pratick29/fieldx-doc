const chat = require('REPO/api/chat.js');
function mockRes() {
  return { code: 0, body: null, headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.code = c; return this; },
    json(o) { this.body = o; return this; } };
}
(async () => {
  // CORS preflight, allowed origin
  process.env.ALLOWED_ORIGINS = 'https://fieldx-doc.vercel.app,https://admin.fieldx.io';
  let r = mockRes();
  await chat({ method: 'OPTIONS', headers: { origin: 'https://admin.fieldx.io' }, body: {} }, r);
  console.log('preflight:', r.code, '| ACAO:', r.headers['Access-Control-Allow-Origin']);
  if (r.code !== 204 || r.headers['Access-Control-Allow-Origin'] !== 'https://admin.fieldx.io') throw new Error('preflight broken');

  // disallowed origin gets no ACAO
  r = mockRes();
  await chat({ method: 'OPTIONS', headers: { origin: 'https://evil.example' }, body: {} }, r);
  console.log('evil origin ACAO:', JSON.stringify(r.headers['Access-Control-Allow-Origin'] || null));
  if (r.headers['Access-Control-Allow-Origin']) throw new Error('CORS too open');

  // plain GET still 405 (with CORS helper, no crash)
  r = mockRes();
  await chat({ method: 'GET', headers: {}, body: {} }, r);
  if (r.code !== 405) throw new Error('GET guard broken');

  // page boost: same query, Groups page should surface group content first
  const plain = chat.retrieve('auto assign devices rules', 3).map(e => e.id);
  const withPg = chat.retrieve('auto assign devices rules', 3, false, 'Groups').map(e => e.id);
  console.log('plain:', plain.join(' | '));
  console.log('groups-ctx:', withPg.join(' | '));

  // full path carries page into prompt
  process.env.OPENAI_API_KEY = 'test-key';
  delete process.env.OPENAI_BASE_URL; delete process.env.OPENAI_MODEL;
  let sent = null;
  global.fetch = async (url, opts) => {
    sent = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) };
  };
  r = mockRes();
  await chat({ method: 'POST', headers: { origin: 'https://admin.fieldx.io' }, body: { message: 'how do I create a group with auto assign rules?', page: 'Groups' } }, r);
  console.log('full:', r.code, '| ACAO:', r.headers['Access-Control-Allow-Origin']);
  console.log('prompt has page ctx:', sent.messages[1].content.indexOf('Groups') !== -1);
  if (r.code !== 200 || r.headers['Access-Control-Allow-Origin'] !== 'https://admin.fieldx.io') throw new Error('full path broken');
  if (sent.messages[1].content.indexOf('Groups') === -1) throw new Error('page ctx missing');
  delete process.env.OPENAI_API_KEY;
  console.log('CONSOLE-READY TESTS PASSED');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
