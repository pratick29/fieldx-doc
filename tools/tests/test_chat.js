const path = require('path');
const chat = require(path.join(__dirname, '..', '..', 'api', 'chat.js'));

function mockRes() {
  return { code: 0, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; } };
}
async function run() {
  // 1. retrieval sanity
  const top = chat.retrieve('how do I enroll a device with QR code', 3);
  console.log('top3:', top.map(e => e.page + '#' + e.id).join(' | '));
  if (!top.length || !/enroll/i.test(top[0].page + top[0].title + top[0].text)) throw new Error('retrieval off-topic');

  // 2. method guards (no key needed)
  let r = mockRes();
  await chat({ method: 'GET', body: {} }, r);
  console.log('GET ->', r.code, JSON.stringify(r.body));
  r = mockRes();
  await chat({ method: 'POST', body: { message: '   ' } }, r);
  console.log('empty ->', r.code, JSON.stringify(r.body));
  r = mockRes();
  delete process.env.OPENAI_API_KEY;
  await chat({ method: 'POST', body: { message: 'kiosk?' } }, r);
  console.log('no-key ->', r.code, JSON.stringify(r.body));

  // 3. full path with stubbed fetch
  process.env.OPENAI_API_KEY = 'test-key';
  let sent = null;
  global.fetch = async (url, opts) => {
    sent = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'Use QR enrollment. See [Enroll](enroll-device.html#qr-code).' } }] }) };
  };
  r = mockRes();
  await chat({ method: 'POST', body: { message: 'how to enroll with QR?' } }, r);
  console.log('full ->', r.code, 'reply:', r.body.reply, '| sources:', r.body.sources.length);
  console.log('model:', sent.model, 'max_tokens:', sent.max_tokens, 'msgs:', sent.messages.length);
  console.log('auth header present:', /Bearer test-key/.test(JSON.stringify(sent)) === false ? 'n/a (header, not body)' : 'yes');
  if (r.code !== 200 || !r.body.reply || !r.body.sources.length) throw new Error('full path failed');
  console.log('ALL CHAT TESTS PASSED');
}
run().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
