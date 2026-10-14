// Minimal DOM stub to smoke-test assets/ai-chat.js end to end.
const fs = require('fs');
const path = require('path');

function makeCtx() {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'createRadialGradient' || p === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (p === 'measureText') return () => ({ width: 0 });
      if (p === 'canvas') return {};
      return () => {};
    },
    set() { return true; }
  });
}
function makeEl(tag) {
  const el = {
    tag, children: [], style: {}, dataset: {},
    className: '', _html: '', textContent: '', value: '',
    scrollTop: 0, scrollHeight: 0, width: tag === 'canvas' ? 56 : 0,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, focus() {},
    appendChild(c) { el.children.push(c); return c; },
    addEventListener(ev, fn) { el['on' + ev] = fn; },
    querySelector(sel) {
      el._qcache = el._qcache || {};
      if (!el._qcache[sel]) el._qcache[sel] = (sel.indexOf('canvas') !== -1) ? makeEl('canvas') : makeEl('div');
      return el._qcache[sel];
    },
    querySelectorAll() { return []; },
    getContext() { return makeCtx(); }
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._html; },
    set(v) {
      el._html = String(v);
      // crude: expose named hooks used by the widget
      el._body = null; el._input = null; el._send = null;
    }
  });
  return el;
}

const listeners = {};
global.document = {
  head: makeEl('head'), body: makeEl('body'),
  hidden: false,
  createElement: t => makeEl(t),
  addEventListener: (ev, fn) => { listeners[ev] = fn; },
  querySelectorAll: () => [],
  getElementById: () => null
};
global.window = { matchMedia: () => ({ matches: true }), innerWidth: 1200 };
global.location = { pathname: '/index.html' };
global.requestAnimationFrame = () => { throw new Error('rAF should not run with reduced motion'); };
global.fetch = async () => ({
  ok: true,
  json: async () => ({ reply: 'Do X.\n1. First [Guide](policies.html#all)\n2. **Second**' })
});

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'ai-chat.js'), 'utf8');
eval(src);
if (!listeners.DOMContentLoaded) throw new Error('no DOMContentLoaded listener');
listeners.DOMContentLoaded();

// widget mounted?
const fab = global.document.body.children.find(c => c.className === 'fxa-fab');
const panel = global.document.body.children.find(c => c.className && c.className.indexOf('fxa-panel') !== -1);
if (!fab || !panel) throw new Error('fab/panel not mounted');
console.log('mounted: fab + panel OK');

// panel innerHTML wiring uses real querySelector on panel stub: returns first child (none) -> generic stub; ensure no crash so far = pass
// simulate a question through captured send handler
const body = panel.querySelector('.fxa-body');
const input = panel.querySelector('input');
const send = panel.querySelector('.fxa-send');
input.value = 'how to wipe a lost device';
if (!send.onclick && !send.onsubmit && !send.onclick) {
  // handler attached via addEventListener('click')
  if (typeof send.onclick !== 'function') console.log('send handler via addEventListener (stub-captured as on...)');
}
const clickFn = send['onclick'];
(async () => {
  if (clickFn) clickFn();
  await new Promise(r => setTimeout(r, 50));
  const dump = JSON.stringify(body);
  const hasReply = dump.indexOf('Do X.') !== -1;
  const hasLink = dump.indexOf('<a href') !== -1;
  const hasBold = dump.indexOf('<strong>') !== -1;
  const hasBr = dump.indexOf('<br>') !== -1;
  console.log('reply rendered:', hasReply, '| link:', hasLink, '| bold:', hasBold, '| breaks:', hasBr);
  if (!hasReply || !hasLink || !hasBold || !hasBr) throw new Error('ask flow broken');
  console.log('WIDGET SMOKE TEST PASSED');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
