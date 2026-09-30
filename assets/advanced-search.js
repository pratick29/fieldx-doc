/* FieldX Docs — Advanced search: full-text, fuzzy, ranked, snippets, cross-page.
   Works on minimal theme (#docs-search) and classic theme (#searchBox). */
(function(){
'use strict';
var ROOT=(typeof window!=='undefined'&&window.FX_ROOT)||'';
var INDEX=[], READY=false;
function norm(s){return (s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();}
function termsOf(q){return norm(q).split(' ').filter(function(t){return t.length>1;});}
function lev(a,b){ // edit distance, capped at 2
  if(Math.abs(a.length-b.length)>1) return 2;
  var m=a.length,n=b.length,prev=[],i,j;
  for(j=0;j<=n;j++) prev[j]=j;
  for(i=1;i<=m;i++){var cur=[i],c1=a[i-1];
    for(j=1;j<=n;j++){var cost=c1===b[j-1]?0:1;
      cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+cost);}
    prev=cur; if(Math.min.apply(null,prev)>1) return 2;}
  return prev[n];
}
function termMatch(term, text, words, compact){
  if(text.indexOf(term)!==-1) return 2;            // exact substring
  if(compact.indexOf(term)!==-1) return 1;          // de-spaced (wi-fi/wifi)
  var k;
  for(k=0;k<words.length;k++){ if(words[k].indexOf(term)===0) return 1; } // prefix
  if(term.length>=4){ for(k=0;k<words.length;k++){ var w=words[k];
    if(w.length>=4 && Math.abs(w.length-term.length)<=1 && lev(w,term)<=1) return 0.5; } } // typo
  return 0;
}
function prep(e){
  e._t=norm(e.title); e._c=norm(e.crumb||''); e._x=norm(e.text||'');
  e._tw=e._t.split(' '); e._xw=e._x.split(' ');
  e._tc=e._t.replace(/ /g,''); e._xc=e._x.replace(/ /g,'');
  return e;
}
function score(e, terms){
  var s=0,i,m;
  for(i=0;i<terms.length;i++){ var t=terms[i];
    m=termMatch(t,e._t,e._tw,e._tc);
    if(m===0){ var m2=termMatch(t,e._c,e._c.split(' '),e._c.replace(/ /g,''))||termMatch(t,e._x,e._xw,e._xc);
      if(!m2) return -1; s+=m2*0.6; continue; }
    s+=m*(m===2?10:5);
    var cm=termMatch(t,e._c,e._c.split(' '),e._c.replace(/ /g,''));
    s+=cm*2;
    s+=termMatch(t,e._x,e._xw,e._xc)*1;
  }
  if(e.group==='Reference' && terms.length===1) s+=0.5;
  return s;
}
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function hi(text, terms){
  var out=esc(text), i;
  terms.slice().sort(function(a,b){return b.length-a.length;}).forEach(function(t){
    try{ out=out.replace(new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>'); }catch(e){}
  });
  return out;
}
function snippet(e, terms){
  var txt=e.text||'', low=txt.toLowerCase(), best=-1, i;
  for(i=0;i<terms.length;i++){ var p=low.indexOf(terms[i]); if(p!==-1&&(best===-1||p<best)) best=p; }
  if(best===-1){ // try compact match position approx
    var c=low.replace(/[^a-z0-9]/g,'');
    for(i=0;i<terms.length;i++){ var cp=c.indexOf(terms[i]);
      if(cp!==-1){ best=Math.floor(cp/c.length*txt.length); break; } }
  }
  if(best===-1) return esc(txt.slice(0,140))+(txt.length>140?'…':'');
  var a=Math.max(0,best-70), b=Math.min(txt.length,best+90), s=txt.slice(a,b);
  return (a>0?'…':'')+hi(s,terms)+(b<txt.length?'…':'');
}
function search(q, limit){
  var terms=termsOf(q); if(!terms.length) return [];
  return INDEX.map(function(e){return {e:e,s:score(e,terms)};})
    .filter(function(r){return r.s>0;}).sort(function(a,b){return b.s-a.s;}).slice(0,limit||50);
}
function css(){
  if(document.getElementById('fxs-css')) return;
  var st=document.createElement('style'); st.id='fxs-css';
  st.textContent='.fxs-dd{position:absolute;top:46px;left:0;right:0;background:#fff;border:1px solid #DFE3E8;border-radius:10px;box-shadow:0 14px 34px rgba(20,25,40,.18);display:none;max-height:400px;overflow:auto;z-index:500;color:#1c252e;text-align:left}.fxs-lb{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#98a2b3;padding:8px 12px;border-bottom:1px solid #DFE3E8}.fxs-it{display:block;padding:9px 12px;border-bottom:1px solid #f0f1f3}.fxs-it:hover,.fxs-it.on{background:#E8F6FD;text-decoration:none}.fxs-g{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#009cde;background:#E8F6FD;border-radius:4px;padding:1px 6px;margin-right:6px}.fxs-t{font-weight:700;font-size:13px;color:#1c252e}.fxs-c{font-size:11px;color:#98a2b3}.fxs-s{font-size:12px;color:#637083;margin-top:2px}.fxs-s mark,.fxs-t mark{background:rgba(0,156,222,.22);color:inherit;border-radius:3px;padding:0 2px}.fxs-ft{display:block;padding:9px 12px;font-size:12.5px;font-weight:700;color:#009cde}.fxs-ft:hover{background:#E8F6FD;text-decoration:none}.fxs-no{padding:12px;font-size:12.5px;color:#637083}#result-count{font-size:11px;color:#98a2b3;margin:6px 0}';
  document.head.appendChild(st);
}
function boxEl(){ return document.querySelector('#docs-search')||document.querySelector('#searchBox'); }
function wrapEl(box){ return box.closest('.header-search')||box.closest('#searchWrap')||box.parentElement; }

function initDropdown(){
  var box=boxEl(); if(!box) return null;
  css();
  var wrap=wrapEl(box); wrap.style.position='relative';
  var dd=wrap.querySelector('.fxs-dd');
  if(!dd){ dd=document.createElement('div'); dd.className='fxs-dd'; wrap.appendChild(dd); }
  var idx=-1, cur=[];
  function render(){
    var q=box.value, terms=termsOf(q);
    if(q.trim().length<2||!terms.length){ dd.style.display='none'; dd.innerHTML=''; cur=[]; return; }
    var res=search(q,8); cur=res; idx=-1;
    if(!res.length){ dd.style.display='block'; dd.innerHTML='<div class="fxs-no">No matches. Try “kiosk”, “vpn”, “wifi”, “ota”, “bluetooth”. <a href=""+ROOT+"search.html?q='+encodeURIComponent(q)+'">Full results →</a></div>'; return; }
    dd.innerHTML='<div class="fxs-lb">'+res.length+' of results • ↑↓ + Enter • <a href=""+ROOT+"search.html?q='+encodeURIComponent(q)+'">see all</a></div>'+
      res.map(function(r,i){return '<a class="fxs-it" data-i="'+i+'" href="'+ROOT+r.e.url+'"><span class="fxs-g">'+esc(r.e.group||'Docs')+'</span><span class="fxs-t">'+hi(r.e.title,terms)+'</span><div class="fxs-c">'+esc(r.e.crumb||r.e.page||'')+'</div><div class="fxs-s">'+snippet(r.e,terms)+'</div></a>';}).join('')+
      '<a class="fxs-ft" href=""+ROOT+"search.html?q='+encodeURIComponent(q)+'">See all results for “'+esc(q)+'” →</a>';
    dd.style.display='block';
  }
  var deb=null;
  box.addEventListener('input',function(){fxUnmark();clearTimeout(deb);deb=setTimeout(function(){render();filterLocal(box.value);},110);});
  box.addEventListener('focus',function(){if(box.value.trim().length>=2)render();});
  box.addEventListener('keydown',function(e){
    var items=dd.querySelectorAll('.fxs-it');
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ if(!items.length)return; e.preventDefault();
      idx=e.key==='ArrowDown'?(idx+1)%items.length:(idx-1+items.length)%items.length;
      for(var i=0;i<items.length;i++) items[i].classList.toggle('on',i===idx);
      items[idx].scrollIntoView({block:'nearest'});
    } else if(e.key==='Enter'){ e.preventDefault();
      try{sessionStorage.setItem('fxq',box.value);}catch(err){}
      if(idx>=0&&items[idx]) window.location.href=items[idx].getAttribute('href');
      else window.location.href='"+ROOT+"search.html?q='+encodeURIComponent(box.value);
    } else if(e.key==='Escape'){ dd.style.display='none'; box.value=''; fxUnmark(); filterLocal(''); box.blur(); }
  });
  dd.addEventListener('click',function(e){ try{sessionStorage.setItem('fxq',box.value);}catch(err){}
    var a=e.target.closest('a'); if(a&&a.classList.contains('fxs-ft')) return; });
  document.addEventListener('click',function(e){ if(!e.target.closest('.header-search')&&!e.target.closest('#searchWrap')) dd.style.display='none'; });
  return {render:render};
}

function filterLocal(raw){
  var q=(raw||'').toLowerCase().trim(), arts=document.querySelectorAll('.article'), n=0;
  arts.forEach(function(a){
    var hay=((a.innerText||'')+' '+(a.dataset.search||'')).toLowerCase().replace(/[^a-z0-9 ]/g,' ');
    var terms=q.replace(/[^a-z0-9 ]/g,' ').split(' ').filter(Boolean);
    var hit=!q||terms.every(function(t){return hay.indexOf(t)!==-1||hay.replace(/ /g,'').indexOf(t)!==-1;});
    a.style.display=hit?'':'none'; if(hit)n++;
    if(q&&hit)a.classList.add('open'); else if(!q)a.classList.remove('open');
  });
  document.querySelectorAll('.category-block').forEach(function(c){
    var as=c.querySelectorAll('.article'); if(!as.length)return;
    c.style.display=Array.prototype.some.call(as,function(a){return a.style.display!=='none';})?'':'none';
  });
  // classic-theme sidebar filter
  document.querySelectorAll('.sidebar a').forEach(function(a){
    if(!q)a.classList.remove('searchHide');
    else a.classList.toggle('searchHide',a.textContent.toLowerCase().indexOf(q)===-1);
  });
  var rows=document.querySelectorAll('.master tbody tr'), rn=0;
  rows.forEach(function(r){var hit=!q||r.innerText.toLowerCase().replace(/[^a-z0-9 ]/g,' ').indexOf(q.replace(/[^a-z0-9 ]/g,' '))!==-1;
    r.style.display=hit?'':'none'; if(hit)rn++;});
  document.querySelectorAll('.empty').forEach(function(e){e.style.display=q&&(n===0&&rn===0)?'block':'none';});
  var cnt=document.querySelector('#result-count');
  if(cnt)cnt.textContent=q?(n+' section(s)'+(rn?' • '+rn+' table row(s)':'')):'';
}

/* highlight query terms on arrival from search */
function retrace(){
  var q=null;
  try{q=sessionStorage.getItem('fxq');}catch(e){}
  if(!q) return;
  var terms=termsOf(q); if(!terms.length) return;
  var box=boxEl(); if(box&&!box.value) box.placeholder='Last search: '+q;
  try{
    document.querySelectorAll('.article').forEach(function(a){
      var hay=(a.innerText||'').toLowerCase();
      if(terms.some(function(t){return hay.indexOf(t)!==-1;})) a.classList.add('open');
    });
  }catch(e){}
}

/* yellow arrival highlight: open + mark + scroll to the exact match */
function fxUnmark(){
  try{
    document.querySelectorAll('mark.fx-hl').forEach(function(mk){
      var t=document.createTextNode(mk.textContent);
      mk.parentNode.replaceChild(t,mk);
    });
    var main=document.querySelector('main');if(main)main.normalize();
  }catch(e){}
}
function fxArrive(){
  var q=null;
  try{q=sessionStorage.getItem('fxq');}catch(e){}
  if(!q) return;
  var terms=termsOf(q); if(!terms.length) return;
  try{sessionStorage.removeItem('fxq');}catch(e){}
  var main=document.querySelector('main'); if(!main) return;
  var pats=terms.map(function(t){return t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');});
  var rx=null;
  try{rx=new RegExp('('+pats.join('|')+')','gi');}catch(e){return;}
  var MAX=250,made=0,first=null;
  function walk(node){
    if(made>=MAX||!node)return;
    if(node.nodeType===3){
      var text=node.nodeValue,last=0,m,out=document.createDocumentFragment(),hit=false;
      rx.lastIndex=0;
      while((m=rx.exec(text))&&made<MAX){
        hit=true;made++;
        if(m.index>last)out.appendChild(document.createTextNode(text.slice(last,m.index)));
        var mk=document.createElement('mark');mk.className='fx-hl';mk.textContent=m[0];
        out.appendChild(mk);if(!first)first=mk;
        last=m.index+m[0].length;
        if(m[0].length===0)rx.lastIndex++;
      }
      if(hit){out.appendChild(document.createTextNode(text.slice(last)));node.parentNode.replaceChild(out,node);}
    }else if(node.nodeType===1){
      var tag=(node.tagName||'').toLowerCase();
      if(tag==='script'||tag==='style'||tag==='input'||tag==='textarea'||tag==='select')return;
      if(node.classList&&(node.classList.contains('fxs-dd')||node.classList.contains('fxc-panel')||node.classList.contains('fxc-fab')))return;
      var kids=Array.prototype.slice.call(node.childNodes);
      for(var i=0;i<kids.length&&made<MAX;i++)walk(kids[i]);
    }
  }
  walk(main);
  if(!first) return;
  var art=first.closest?first.closest('.article'):null;
  if(art&&!art.classList.contains('open')){
    art.classList.add('open');
    var btn=art.querySelector('.article-title');if(btn)btn.setAttribute('aria-expanded','true');
  }
  setTimeout(function(){
    try{first.scrollIntoView({block:'center',behavior:'smooth'});}catch(e){try{first.scrollIntoView();}catch(_){}}
  },60);
}

function initResultsPage(){
  var list=document.querySelector('#all-results'); if(!list) return;
  css();
  var params=new URLSearchParams(window.location.search);
  var q=params.get('q')||'';
  var input=document.querySelector('#page-search'); if(input)input.value=q;
  var f=params.get('f')||'All';
  function draw(){
    var terms=termsOf(q), res=q?search(q,200):[];
    if(f!=='All')res=res.filter(function(r){return r.e.group===f;});
    document.querySelector('#res-count').textContent=q?(res.length+' result(s) for “'+q+'”'):'Type above to search all documentation.';
    list.innerHTML=res.map(function(r){
      return '<a class="fxs-it" href="'+ROOT+r.e.url+'"><span class="fxs-g">'+esc(r.e.group||'Docs')+'</span><span class="fxs-t">'+hi(r.e.title,terms)+'</span><div class="fxs-c">'+esc(r.e.crumb||r.e.page||'')+' • '+esc(r.e.page||'')+'</div><div class="fxs-s">'+snippet(r.e,terms)+'</div></a>';
    }).join('')||(q?'<div class="fxs-no">Nothing found. Try fewer words, check spelling (“wifi”, not “wiffi”), or browse the <a href="policies.html">Restrictions reference</a>.</div>':'');
    list.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){try{sessionStorage.setItem('fxq',q);}catch(e){}});});
  }
  if(input)input.addEventListener('input',function(){q=input.value;draw();});
  document.querySelectorAll('[data-f]').forEach(function(b){b.addEventListener('click',function(){
    f=b.getAttribute('data-f');
    document.querySelectorAll('[data-f]').forEach(function(x){x.classList.toggle('active',x===b);});
    draw();});});
  draw();
}

function crawlLocal(){
  /* file:// fallback: build a mini index from the current page DOM */
  var out=[], page=(location.pathname.split('/').pop()||'index.html').split('?')[0];
  document.querySelectorAll('.article').forEach(function(a){
    var t=a.querySelector('.article-title span')||a.querySelector('.article-title');
    var title=t?t.innerText.trim():'Section';
    var body=(a.innerText||'').trim().slice(0,1500);
    if(title&&body.length>20)out.push(prep({page:page,url:page,title:title,group:'This page',crumb:document.title,text:body}));
  });
  document.querySelectorAll('.card').forEach(function(c){
    var h=c.querySelector('h2');
    var title=h?h.innerText.trim():document.title;
    var body=(c.innerText||'').trim().slice(0,1500);
    if(body.length>40)out.push(prep({page:page,url:page,title:title,group:'This page',crumb:document.title,text:body}));
  });
  return out;
}
document.addEventListener('DOMContentLoaded',function(){
  function ready(){ READY=true; initResultsPage(); }
  if(window.FX_FULL_INDEX&&window.FX_FULL_INDEX.length){
    INDEX=window.FX_FULL_INDEX.map(prep); ready();
    /* refresh in background when hosted over http */
    try{fetch(ROOT+'assets/full-index.json').then(function(r){return r.json();}).then(function(j){
      if(j&&j.length){INDEX=j.map(prep);initResultsPage();}
    }).catch(function(){});}catch(e){}
  } else {
    try{fetch(ROOT+'assets/full-index.json').then(function(r){return r.json();}).then(function(j){
      INDEX=(j||[]).map(prep); if(!INDEX.length)INDEX=crawlLocal(); ready();
    }).catch(function(){ INDEX=crawlLocal(); ready(); });}catch(e){ INDEX=crawlLocal(); ready(); }
  }
  initDropdown();
  retrace();
  fxArrive();
  (function initFontSize(){
    var LEVELS=[100,112,125],cur=100;
    try{var s=parseInt(localStorage.getItem('fx-zoom')||'100',10);if(LEVELS.indexOf(s)!==-1)cur=s;}catch(e){}
    function paint(){
      document.querySelectorAll('.font-toggle').forEach(function(b){
        b.style.fontSize=Math.round(12*cur/100)+'px';
        b.setAttribute('title','Text size: '+cur+'% (click to change)');
        b.setAttribute('aria-label','Text size '+cur+' percent. Activate to change.');
      });
    }
    function apply(v){cur=v;try{document.body.style.zoom=(v/100);}catch(e){}try{localStorage.setItem('fx-zoom',String(v));}catch(e2){}paint();}
    apply(cur);
    /* text-size changes now come from the Accessibility panel (ui.js) */
  })();
  (function initTheme(){
    var root=document.documentElement;
    function isDark(){return root.getAttribute('data-theme')==='dark';}
    function paint(){
      var d=isDark();
      document.querySelectorAll('.theme-toggle').forEach(function(b){
        b.textContent=d?'\u2600':'\u263e';
        b.setAttribute('aria-label',d?'Switch to light mode':'Switch to dark mode');
      });
      var m=document.querySelector('meta[name="theme-color"]');
      if(m)m.setAttribute('content',d?'#141A21':'#ffffff');
    }
    paint();
    document.querySelectorAll('.theme-toggle').forEach(function(b){
      b.addEventListener('click',function(){
        var d=!isDark();
        if(d)root.setAttribute('data-theme','dark');else root.removeAttribute('data-theme');
        try{localStorage.setItem('fx-theme',d?'dark':'light');}catch(e){}
        paint();
      });
    });
  })();
  document.querySelectorAll('.article-title').forEach(function(b){
    if(b.dataset.fxb)return; b.dataset.fxb='1';
    var art0=b.closest('.article');
    b.setAttribute('aria-expanded',art0&&art0.classList.contains('open')?'true':'false');
    b.addEventListener('click',function(){
      var a=b.closest('.article'); if(!a)return;
      a.classList.toggle('open');
      b.setAttribute('aria-expanded',a.classList.contains('open')?'true':'false');
    });
  });
  document.querySelectorAll('.nav-drop-toggle,.nav-drop-main').forEach(function(t){
    t.addEventListener('click',function(){
      var d=t.closest('.nav-drop');if(!d)return;
      d.classList.toggle('open');
      if(t.classList.contains('nav-drop-main'))t.setAttribute('aria-expanded',d.classList.contains('open')?'true':'false');
    });
  });
  document.querySelectorAll('.sidebar .nav-item,.sidebar .nav-sub-item').forEach(function(a){
    a.addEventListener('click',function(){
      if(window.innerWidth<=760){var s=document.querySelector('.sidebar'); if(s)s.style.display='';}
    });
  });
  document.addEventListener('keydown',function(e){
    var box=boxEl();
    if(e.key==='/'&&box&&document.activeElement!==box&&!document.querySelector('#page-search')){e.preventDefault();box.focus();}
  });
});
})();
