const chat = require('REPO/api/chat.js');
process.env.OPENAI_API_KEY = 'test-key';
let called = false;
global.fetch = async () => { called = true; return { ok: true, json: async () => ({ choices: [{ message: { content: 'x' } }] }) }; };
function mockRes() { return { code: 0, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; } }; }
(async () => {
  const r = mockRes();
  await chat({ method: 'POST', body: { message: 'asdfgh qwerty zzz' } }, r);
  console.log('code:', r.code, '| fetch called:', called, '| reply:', JSON.stringify(r.body.reply));
  if (r.code !== 200 || called || r.body.reply !== "I couldn't find this information in the FieldX documentation.") throw new Error('threshold path broken');
  console.log('THRESHOLD TEST PASSED (no LLM call on weak retrieval)');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
