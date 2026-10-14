const path = require('path');
const chat = require(path.join(__dirname, '..', '..', 'api', 'chat.js'));
function mockRes() {
  return { code: 0, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; } };
}
async function run() {
  // OpenRouter-style env
  process.env.OPENAI_API_KEY = 'sk-or-test';
  process.env.OPENAI_BASE_URL = 'https://openrouter.ai/api/v1/';
  process.env.OPENAI_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';
  let gotUrl = null, gotBody = null;
  global.fetch = async (url, opts) => {
    gotUrl = url; gotBody = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'OK [Kiosk](apps.html#kiosk-mode).' } }] }) };
  };
  const r = mockRes();
  await chat({ method: 'POST', body: { message: 'what is kiosk mode?' } }, r);
  console.log('code:', r.code, '| url:', gotUrl, '| model:', gotBody.model);
  if (r.code !== 200) throw new Error('openrouter path failed');
  if (gotUrl !== 'https://openrouter.ai/api/v1/chat/completions') throw new Error('base url not honored (trailing slash)');
  if (gotBody.model !== 'meta-llama/llama-3.3-70b-instruct:free') throw new Error('model not honored');

  // defaults (OpenAI) when env unset
  delete process.env.OPENAI_BASE_URL; delete process.env.OPENAI_MODEL;
  const r2 = mockRes();
  await chat({ method: 'POST', body: { message: 'what is kiosk mode?' } }, r2);
  console.log('default url:', gotUrl, '| default model:', gotBody.model);
  if (gotUrl !== 'https://api.openai.com/v1/chat/completions') throw new Error('default base wrong');
  if (gotBody.model !== 'gpt-4o-mini') throw new Error('default model wrong');
  console.log('OPENROUTER COMPAT TESTS PASSED');
  delete process.env.OPENAI_API_KEY;
}
run().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
