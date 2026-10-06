/* FieldX Docs AI chatbot — floating widget backed by /api/chat (OpenAI + docs KB) */
(function () {
'use strict';
var ROOT = location.pathname.indexOf('/restrictions/') !== -1 ? '../' : '';

function css() {
  if (document.getElementById('fxa-css')) return;
  var st = document.createElement('style'); st.id = 'fxa-css';
  st.textContent = '.fxa-fab{position:fixed;right:22px;bottom:22px;width:52px;height:52px;border-radius:50%;border:0;background:#009cde;color:#fff;font-size:22px;font-weight:800;cursor:pointer;box-shadow:0 10px 26px rgba(20,25,40,.25);z-index:600}[data-theme="dark"] .fxa-fab{background:#009cde}.fxa-fab:hover{transform:scale(1.06)}' +
  '.fxa-panel{position:fixed;right:22px;bottom:86px;width:350px;max-width:calc(100vw - 44px);background:#fff;border:1px solid #DFE3E8;border-radius:14px;box-shadow:0 20px 50px rgba(20,25,40,.25);z-index:600;display:none;flex-direction:column;overflow:hidden}[data-theme="dark"] .fxa-panel{background:#1C252E;border-color:rgba(145,158,171,.32)}' +
  '.fxa-panel.open{display:flex}' +
  '.fxa-head{background:#009cde;color:#fff;padding:11px 14px;font-weight:750;font-size:13px;display:flex;justify-content:space-between;align-items:center}' +
  '.fxa-x{border:0;background:none;color:#fff;font-size:16px;cursor:pointer}' +
  '.fxa-body{padding:12px;display:flex;flex-direction:column;gap:8px;overflow:auto;min-height:180px;max-height:340px;background:#fbfbff}[data-theme="dark"] .fxa-body{background:#141A21}' +
  '.fxa-m{max-width:88%;padding:8px 11px;border-radius:10px;font-size:12.5px;line-height:1.55}' +
  '.fxa-bot{background:#fff;border:1px solid #DFE3E8;color:#1c252e;align-self:flex-start}[data-theme="dark"] .fxa-bot{background:#28323D;color:#fff;border-color:rgba(145,158,171,.25)}' +
  '.fxa-user{background:#009cde;color:#fff;align-self:flex-end}' +
  '.fxa-m a{color:#009cde;font-weight:700}' +
  '.fxa-chips{display:flex;gap:6px;flex-wrap:wrap}' +
  '.fxa-chip{border:1px solid #BFE7F7;background:#E8F6FD;color:#009cde;border-radius:999px;padding:4px 10px;font-size:11px;cursor:pointer}[data-theme="dark"] .fxa-chip{background:rgba(0,156,222,.16);border-color:rgba(0,156,222,.4)}' +
  '.fxa-foot{display:flex;gap:8px;padding:10px;border-top:1px solid #DFE3E8}' +
  '.fxa-foot input{flex:1;border:1px solid #DFE3E8;border-radius:8px;padding:8px 10px;font-size:12.5px;outline:none;min-width:0}' +
  '.fxa-foot input:focus{border-color:#009cde}' +
  '.fxa-send{border:0;background:#009cde;color:#fff;border-radius:8px;padding:0 14px;font-size:13px;cursor:pointer}' +
  '.fxa-send:disabled{opacity:.5;cursor:wait}' +
  '.fxa-typing{opacity:.65;font-style:italic}';
  document.head.appendChild(st);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function linkify(s) {
  // [title](page#id) -> anchor, prefixed for subdirectory pages
  return esc(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
    if (/^(https?:|mailto:)/.test(u)) return '<a href="' + u + '" target="_blank" rel="noopener">' + t + '</a>';
    return '<a href="' + ROOT + u + '">' + t + '</a>';
  }).replace(/\n/g, '<br>');
}
function addMsg(body, cls, html) {
  var d = document.createElement('div'); d.className = 'fxa-m ' + cls;
  if (html) d.innerHTML = html; else d.textContent = html;
  body.appendChild(d); body.scrollTop = body.scrollHeight; return d;
}

document.addEventListener('DOMContentLoaded', function () {
  css();
  var fab = document.createElement('button');
  fab.className = 'fxa-fab'; fab.setAttribute('aria-label', 'Ask FieldX docs'); fab.textContent = '?';
  var panel = document.createElement('div');
  panel.className = 'fxa-panel';
  panel.innerHTML = '<div class="fxa-head"><span>FieldX Docs Assistant</span><button class="fxa-x" aria-label="Close chat">✕</button></div>' +
    '<div class="fxa-body"></div>' +
    '<div class="fxa-foot"><input placeholder="Ask about the docs..." maxlength="500" aria-label="Ask about the docs"><button class="fxa-send">Send</button></div>';
  document.body.appendChild(fab); document.body.appendChild(panel);
  var body = panel.querySelector('.fxa-body'),
      input = panel.querySelector('input'),
      send = panel.querySelector('.fxa-send');

  addMsg(body, 'fxa-bot', 'Hi! I answer from the FieldX docs. Try a topic below or ask your own question.');
  var chips = document.createElement('div'); chips.className = 'fxa-chips';
  ['Enroll a device', 'Kiosk mode', 'OTA updates', 'Restrictions'].forEach(function (c) {
    var b = document.createElement('button'); b.className = 'fxa-chip'; b.textContent = c;
    b.addEventListener('click', function () { input.value = c; ask(); });
    chips.appendChild(b);
  });
  var chipWrap = document.createElement('div'); chipWrap.appendChild(chips); body.appendChild(chipWrap);

  fab.addEventListener('click', function () { panel.classList.toggle('open'); if (panel.classList.contains('open')) input.focus(); });
  panel.querySelector('.fxa-x').addEventListener('click', function () { panel.classList.remove('open'); });

  var busy = false;
  function ask() {
    var q = input.value.trim();
    if (!q || busy) return;
    busy = true; send.disabled = true;
    addMsg(body, 'fxa-user', esc(q));
    input.value = '';
    var t = addMsg(body, 'fxa-bot fxa-typing', 'Thinking...');
    var url = ROOT + 'api/chat';
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q }) })
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
