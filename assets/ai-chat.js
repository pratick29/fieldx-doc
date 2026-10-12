/* FieldX Docs AI chatbot — floating widget backed by /api/chat (OpenAI + docs KB) */
(function () {
'use strict';
var ROOT = location.pathname.indexOf('/restrictions/') !== -1 ? '../' : '';
var SELF = (document.currentScript) || null;
function selfAttr(n) { try { return SELF && SELF.getAttribute(n); } catch (e) { return null; } }
var API = selfAttr('data-api') || (ROOT + 'api/chat');
var DOCS = /^https?:\/\//.test(API) ? API.replace(/\/api\/chat\/?$/, '') : '';
var LOGO = DOCS ? DOCS + '/assets/icon-chat.png' : ROOT + 'assets/icon-chat.png';
function docUrl(u) {
  if (/^(https?:|mailto:)/.test(u)) return u;
  if (DOCS) return DOCS + '/' + u.replace(/^\.\.\//, '');
  return ROOT + u;
}

function css() {
  if (document.getElementById('fxa-css')) return;
  var st = document.createElement('style'); st.id = 'fxa-css';
  st.textContent = '.fxa-fab{position:fixed;right:22px;bottom:22px;width:58px;height:58px;border-radius:50%;border:1px solid #E5EAF0;background:#fff;cursor:pointer;z-index:600;display:grid;place-items:center;padding:0;box-shadow:0 10px 26px rgba(2,32,51,.22);transition:transform .18s ease}.fxa-fab:hover{transform:scale(1.08)}[data-theme="dark"] .fxa-fab{background:#1B2530;border-color:rgba(145,158,171,.3)}.fxa-fab img{display:block;width:34px;height:34px;object-fit:contain}' +
  '.fxa-panel{position:fixed;right:22px;bottom:90px;width:400px;max-width:calc(100vw - 44px);background:#fff;border:1px solid #E5EAF0;border-radius:20px;box-shadow:0 28px 70px rgba(2,32,51,.28);z-index:600;display:flex;flex-direction:column;overflow:hidden;visibility:hidden;opacity:0;transform:translateY(16px) scale(.98);transform-origin:bottom right;transition:opacity .22s ease,transform .22s ease,visibility .22s}[data-theme="dark"] .fxa-panel{background:#1B2530;border-color:rgba(145,158,171,.3)}' +
  '.fxa-panel.open{visibility:visible;opacity:1;transform:none}' +
  '.fxa-head{background:linear-gradient(135deg,#6D63FF,#3618d3);color:#fff;padding:12px 15px;display:flex;justify-content:space-between;align-items:center}' +
  '.fxa-brand{display:flex;align-items:center;gap:9px;font-weight:750;font-size:14px}.fxa-brand img{height:26px;width:26px;object-fit:contain;display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))}' +
  '.fxa-x{border:0;background:none;color:#fff;font-size:16px;cursor:pointer}' +
  '.fxa-body{padding:14px 12px;display:flex;flex-direction:column;gap:9px;overflow:auto;min-height:260px;max-height:460px;background:linear-gradient(180deg,#f4f9fd,#fff)}[data-theme="dark"] .fxa-body{background:linear-gradient(180deg,#17212b,#141A21)}' +
  '.fxa-row{display:flex;gap:7px;align-items:flex-end}.fxa-row.u{justify-content:flex-end}' +
  '.fxa-ava{width:27px;height:27px;border-radius:50%;flex:none;display:grid;place-items:center;background:#fff;border:1px solid #E5EAF0;box-shadow:0 2px 6px rgba(2,32,51,.14)}.fxa-ava img{width:16px;height:16px;object-fit:contain;display:block}[data-theme="dark"] .fxa-ava{background:#1B2530;border-color:rgba(145,158,171,.3)}' +
  '.fxa-m{max-width:82%;padding:9px 13px;border-radius:15px;font-size:12.8px;line-height:1.6}' +
  '.fxa-bot{background:#fff;border:1px solid #E7EDF3;color:#1c252e;align-self:flex-start;border-bottom-left-radius:5px;box-shadow:0 2px 6px rgba(2,32,51,.06)}[data-theme="dark"] .fxa-bot{background:#28323D;color:#fff;border-color:rgba(145,158,171,.25)}' +
  '.fxa-user{background:linear-gradient(135deg,#6D63FF,#3618d3);color:#fff;align-self:flex-end;border-bottom-right-radius:5px;box-shadow:0 3px 10px rgba(0,156,222,.3)}' +
  '.fxa-m a{color:#4E43FA;font-weight:700}' +
  '.fxa-chips{display:flex;gap:6px;flex-wrap:wrap}' +
  '.fxa-chip{border:1px solid #BFE7F7;background:#E8F6FD;color:#0089c4;border-radius:999px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s}[data-theme="dark"] .fxa-chip{background:rgba(0,156,222,.16);border-color:rgba(0,156,222,.4)}.fxa-chip:hover{background:#4E43FA;color:#fff;border-color:#4E43FA}' +
  '.fxa-foot{display:flex;gap:8px;padding:11px 12px;border-top:1px solid #EDF1F5;background:#fff}[data-theme="dark"] .fxa-foot{background:#1B2530;border-color:rgba(145,158,171,.2)}' +
  '.fxa-foot input{flex:1;border:1px solid #E2E8F0;background:#F6F9FC;border-radius:999px;padding:10px 15px;font-size:12.5px;outline:none;min-width:0}[data-theme="dark"] .fxa-foot input{background:#141A21;border-color:rgba(145,158,171,.3);color:#fff}' +
  '.fxa-foot input:focus{border-color:#4E43FA;background:#fff}[data-theme="dark"] .fxa-foot input:focus{background:#1C252E}' +
  '.fxa-send{border:0;background:linear-gradient(135deg,#6D63FF,#3618d3);color:#fff;border-radius:50%;width:38px;height:38px;font-size:16px;cursor:pointer;flex:none;box-shadow:0 4px 12px rgba(0,156,222,.4);transition:transform .15s}.fxa-send:hover{transform:scale(1.07)}' +
  '.fxa-send:disabled{opacity:.5;cursor:wait}' +
  '.fxa-typing{display:flex;gap:4px;align-items:center;padding:12px 14px}.fxa-typing i{width:7px;height:7px;border-radius:50%;background:#98a2b3;animation:fxab 1.1s infinite}.fxa-typing i:nth-child(2){animation-delay:.15s}.fxa-typing i:nth-child(3){animation-delay:.3s}@keyframes fxab{0%,60%,100%{opacity:.3;transform:none}30%{opacity:1;transform:translateY(-3px)}}';
  document.head.appendChild(st);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function linkify(s) {
  // [title](page#id) -> anchor, prefixed for subdirectory pages
  return esc(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
    if (/^(https?:|mailto:)/.test(u)) return '<a href="' + u + '" target="_blank" rel="noopener">' + t + '</a>';
    var href = docUrl(u);
    var ext = /^https?:\/\//.test(href) && href.indexOf(location.host) === -1;
    return '<a href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>';
  }).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}
function addMsg(body, cls, html) {
  var isBot = cls.indexOf('fxa-bot') !== -1;
  var row = document.createElement('div'); row.className = 'fxa-row' + (isBot ? '' : ' u');
  if (isBot) {
    var av = document.createElement('span'); av.className = 'fxa-ava';
    av.innerHTML = '<img src="' + LOGO + '" alt="">';
    row.appendChild(av);
  }
  var d = document.createElement('div'); d.className = 'fxa-m ' + cls;
  if (html) d.innerHTML = html; else d.textContent = html;
  row.appendChild(d); body.appendChild(row);
  body.scrollTop = body.scrollHeight; return d;
}

document.addEventListener('DOMContentLoaded', function () {
  css();
  var fab = document.createElement('button');
  fab.className = 'fxa-fab'; fab.setAttribute('aria-label', 'Ask FieldX docs');
  fab.innerHTML = '<img src="' + LOGO + '" alt="FieldX chat">';
  var panel = document.createElement('div');
  panel.className = 'fxa-panel';
  panel.innerHTML = '<div class="fxa-head"><span class="fxa-brand"><span>FieldX AI Assistant</span></span><button class="fxa-x" aria-label="Close chat">✕</button></div>' +
    '<div class="fxa-body"></div>' +
    '<div class="fxa-foot"><input placeholder="Ask about the docs..." maxlength="500" aria-label="Ask about the docs"><button class="fxa-send" aria-label="Send">→</button></div>';
  document.body.appendChild(fab); document.body.appendChild(panel);
  var body = panel.querySelector('.fxa-body'),
      input = panel.querySelector('input'),
      send = panel.querySelector('.fxa-send');

  addMsg(body, 'fxa-bot', 'Hello, I am the <strong>FieldX AI Assistant</strong>. How can I help you?<br><span style="opacity:.75">Try asking: how to configure Wi-Fi, enroll a device, or set up kiosk mode.</span>');

  fab.addEventListener('click', function () { panel.classList.toggle('open'); if (panel.classList.contains('open')) input.focus(); });
  panel.querySelector('.fxa-x').addEventListener('click', function () { panel.classList.remove('open'); });

  var busy = false;
  function ask() {
    var q = input.value.trim();
    if (!q || busy) return;
    busy = true; send.disabled = true;
    addMsg(body, 'fxa-user', esc(q));
    input.value = '';
    var row = document.createElement('div'); row.className = 'fxa-row';
    var av = document.createElement('span'); av.className = 'fxa-ava';
    av.innerHTML = '<img src="' + LOGO + '" alt="">'; row.appendChild(av);
    var t = document.createElement('div'); t.className = 'fxa-m fxa-bot fxa-typing'; t.innerHTML = '<i></i><i></i><i></i>';
    row.appendChild(t); body.appendChild(row); body.scrollTop = body.scrollHeight;
    var url = API;
    var pg = selfAttr('data-page') || '';
    try {
      var bp = document.body && document.body.getAttribute('data-fxa-page');
      if (!pg && bp) pg = bp;
    } catch (e2) {}
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q, page: pg }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (out) {
        t.classList.remove('fxa-typing');
        if (out.ok && out.j.reply) t.innerHTML = linkify(out.j.reply);
        else if (out.j && out.j.error) t.textContent = out.j.error + ' (Local preview has no backend — the live site answers once the API key is set.)';
        else t.textContent = 'Something went wrong. Try again.';
        body.scrollTop = body.scrollHeight;
      })
      .catch(function () {
        t.classList.remove('fxa-typing');
        t.textContent = 'Chat backend unreachable. On the live site this answers from the docs.';
        body.scrollTop = body.scrollHeight;
      })
      .then(function () { busy = false; send.disabled = false; input.focus(); });
  }
  send.addEventListener('click', ask);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') ask(); });
});
})();
