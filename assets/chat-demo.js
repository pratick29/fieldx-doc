/* FieldX Docs — demo chatbot prototype ( rule-based canned replies, no backend ) */
(function(){
'use strict';
function css(){
  if(document.getElementById('fxc-css'))return;
  var st=document.createElement('style');st.id='fxc-css';
  st.textContent='.fxc-fab{position:fixed;right:22px;bottom:22px;width:52px;height:52px;border-radius:50%;border:1px solid var(--border);background:#fff;color:#009cde;font-size:22px;font-weight:800;cursor:pointer;box-shadow:0 10px 26px rgba(20,25,40,.18);z-index:600;display:grid;place-items:center}[data-theme="dark"] .fxc-fab{background:#1C252E;border-color:rgba(145,158,171,.32)}.fxc-fab:hover{transform:scale(1.05)}.fxc-panel{position:fixed;right:22px;bottom:86px;width:330px;max-width:calc(100vw - 44px);max-height:480px;background:#fff;border:1px solid #DFE3E8;border-radius:14px;box-shadow:0 20px 50px rgba(20,25,40,.25);z-index:600;display:none;flex-direction:column;overflow:hidden}.fxc-panel.open{display:flex}.fxc-head{background:#009cde;color:#fff;padding:11px 14px;font-weight:750;font-size:13px;display:flex;justify-content:space-between;align-items:center}.fxc-head small{font-weight:400;opacity:.8;font-size:10px}.fxc-x{border:0;background:none;color:#fff;font-size:16px;cursor:pointer}.fxc-body{padding:12px;display:flex;flex-direction:column;gap:8px;overflow:auto;min-height:180px;max-height:330px;background:#fbfbff}.fxc-m{max-width:85%;padding:8px 11px;border-radius:10px;font-size:12.5px;line-height:1.5}.fxc-bot{background:#fff;border:1px solid #DFE3E8;color:#1c252e;align-self:flex-start}.fxc-user{background:#009cde;color:#fff;align-self:flex-end}.fxc-m a{color:#009cde;font-weight:700}.fxc-user a{color:#fff}.fxc-chips{display:flex;gap:6px;flex-wrap:wrap}.fxc-chip{border:1px solid #BFE7F7;background:#E8F6FD;color:#009cde;border-radius:999px;padding:4px 10px;font-size:11px;cursor:pointer}.fxc-foot{display:flex;gap:8px;padding:10px;border-top:1px solid #DFE3E8}.fxc-foot input{flex:1;border:1px solid #DFE3E8;border-radius:8px;padding:8px 10px;font-size:12.5px;outline:none}.fxc-foot input:focus{border-color:#009cde}.fxc-send{border:0;background:#009cde;color:#fff;border-radius:8px;padding:0 14px;font-size:13px;cursor:pointer}.fxc-demo{font-size:10px;color:#98a2b3;text-align:center;padding:0 10px 8px}.fxc-fab img{display:block;width:26px;height:26px}.fxc-fab .logo-dark{display:none}[data-theme="dark"] .fxc-fab .logo-light{display:none}[data-theme="dark"] .fxc-fab .logo-dark{display:block}';
  document.head.appendChild(st);
}
function reply(q){
  q=(q||'').toLowerCase();
  if(/kiosk/.test(q))return 'Lock any device to one app (POS, signage) or a small approved set from <a href="apps.html">Apps →</a>. Need the exit PIN flow? It is on the same page.';
  if(/enroll|qr|onboard|add device/.test(q))return 'Fastest path is QR: Console → Devices → Add → QR Enrollment, ~3 min. Full steps: <a href="enroll-device.html">Enroll Device →</a>';
  if(/price|pricing|cost|trial|plan/.test(q))return 'For plans and pricing, please contact the team: <a href="support.html">Contact FieldX →</a>';
  if(/ota|firmware|update|upgrade/.test(q))return 'FieldX pushes full + incremental OTA via CDN with staged rollout and rollback. See <a href="reports.html">Reports →</a> for rollout tracking.';
  if(/restrict|policy|policies|block|lock/.test(q))return 'All 118 restrictions live in the <a href="policies.html">Restrictions reference →</a> — try searching “kiosk”, “camera” or “USB”.';
  if(/vpn|security|knox/.test(q))return 'Always-On VPN, Samsung Knox controls and encrypted channels are covered under <a href="getting-started.html">Getting Started →</a> requirements and the Restrictions reference.';
  if(/report|alert|sla|monitor/.test(q))return 'Inventory, compliance, app, OTA and SLA exports (CSV/Excel/PDF) plus alerts: <a href="reports.html">Reports →</a>';
  if(/api|integrat|webhook|erp/.test(q))return 'REST APIs, on-device App-to-App actions and webhooks connect ERP/CRM dashboards. Ask <a href="support.html">Support →</a> for API tokens.';
  if(/hi|hello|hey/.test(q))return 'Hello! Ask me about enrollment, kiosk, restrictions, OTA, reports or pricing.';
  return 'I am a demo prototype — I only know a few topics. Try “enroll”, “kiosk”, “OTA”, “reports” or “pricing”. For anything else: <a href="support.html">Contact FieldX →</a>';
}
function addMsg(body,cls,html){
  var d=document.createElement('div');d.className='fxc-m '+cls;
  if(html)d.innerHTML=html;else d.textContent=html;
  body.appendChild(d);body.scrollTop=body.scrollHeight;return d;
}
document.addEventListener('DOMContentLoaded',function(){
  css();
  var LOGO='<img class="logo-light" src="assets/icon.png" alt="" width="26" height="26"><img class="logo-dark" src="assets/icon-white.png" alt="" width="26" height="26">';
  var fab=document.createElement('button');fab.className='fxc-fab';fab.setAttribute('aria-label','Open chat');fab.innerHTML=LOGO;
  var panel=document.createElement('div');panel.className='fxc-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','FieldX assistant demo');
  panel.innerHTML='<div class="fxc-head"><span>FieldX Assistant <small>demo</small></span><button class="fxc-x" aria-label="Close chat">✕</button></div><div class="fxc-body"></div><div class="fxc-chips" style="padding:0 12px 4px;display:flex;gap:6px;flex-wrap:wrap"></div><div class="fxc-foot"><input placeholder="Ask about enrollment, kiosk…" aria-label="Chat message"><button class="fxc-send">➤</button></div><div class="fxc-demo">Prototype — canned demo replies, no real AI</div>';
  document.body.appendChild(fab);document.body.appendChild(panel);
  var body=panel.querySelector('.fxc-body'),input=panel.querySelector('input'),chips=panel.querySelector('.fxc-chips');
  addMsg(body,'fxc-bot','Hi! I am the FieldX docs assistant <b>(demo)</b>. What do you want to do?');
  ['Enroll a device','Kiosk mode','Reports'].forEach(function(c){
    var b=document.createElement('button');b.className='fxc-chip';b.textContent=c;
    b.addEventListener('click',function(){send(c);});chips.appendChild(b);
  });
  function send(text){
    var q=(text!==undefined?text:input.value).trim();if(!q)return;
    addMsg(body,'fxc-user',q);input.value='';
    var t=addMsg(body,'fxc-bot','Typing…');
    setTimeout(function(){t.innerHTML=reply(q);body.scrollTop=body.scrollHeight;},600);
  }
  panel.querySelector('.fxc-send').addEventListener('click',function(){send();});
  input.addEventListener('keydown',function(e){if(e.key==='Enter')send();});
  function toggle(force){
    var open=force!==undefined?force:!panel.classList.contains('open');
    panel.classList.toggle('open',open);
    fab.innerHTML=open?'\u2715':LOGO;fab.setAttribute('aria-label',open?'Close chat':'Open chat');
    if(open)setTimeout(function(){input.focus();},50);
  }
  fab.addEventListener('click',function(){toggle();});
  panel.querySelector('.fxc-x').addEventListener('click',function(){toggle(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')toggle(false);});
});
})();
