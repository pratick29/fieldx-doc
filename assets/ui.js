/* FieldX Docs — UI enhancements: scrollspy, mobile TOC, to-top, progress, copy-link, master filter */
(function(){
'use strict';
var ROOT=(typeof window!=='undefined'&&window.FX_ROOT)||'';
function reduced(){return window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
document.addEventListener('DOMContentLoaded',function(){
  /* persisted high contrast */
  try{if(localStorage.getItem('fx-contrast')==='high')document.documentElement.setAttribute('data-contrast','high');}catch(e0){}
  /* reading progress */
  var pb=document.createElement('div');pb.className='read-progress';document.body.appendChild(pb);
  function prog(){var h=document.documentElement;var max=h.scrollHeight-h.clientHeight;pb.style.width=(max>0?(h.scrollTop/max)*100:0)+'%';}

  /* back to top (bottom-left, chat owns bottom-right) */
  var st=document.createElement('button');st.className='to-top';st.setAttribute('aria-label','Back to top');st.textContent='\u2191';
  document.body.appendChild(st);
  st.addEventListener('click',function(){window.scrollTo({top:0,behavior:reduced()?'auto':'smooth'});});

  /* mobile "On this page" built from the right TOC */
  var tocNav=document.querySelector('.right .toc'),introSec=document.querySelector('main .intro');
  if(tocNav&&introSec){
    var d=document.createElement('details');d.className='mobile-toc';
    var s=document.createElement('summary');s.textContent='On this page';d.appendChild(s);
    Array.prototype.forEach.call(tocNav.querySelectorAll('a'),function(a){
      var c=a.cloneNode(true);
      c.addEventListener('click',function(){d.open=false;});
      d.appendChild(c);
    });
    introSec.after(d);
  }

  /* master table: first 10 rows + expand, combined with quick filter */
  var masterTbl=document.querySelector('.master tbody');
  if(masterTbl){
    var mrows=Array.prototype.slice.call(masterTbl.querySelectorAll('tr'));
    var SHOW=10,mExpanded=false;
    var mWrap=masterTbl.closest('.masterwrap');
    var mBtn=document.createElement('button');mBtn.className='master-toggle';mBtn.type='button';
    if(mWrap&&mWrap.parentNode)mWrap.parentNode.insertBefore(mBtn,mWrap.nextSibling);
    var mf=document.querySelector('#master-filter'),mc=document.querySelector('#master-count');
    function refreshMaster(){
      var q=mf?mf.value.toLowerCase().trim():'',n=0;
      mrows.forEach(function(r,i){
        var hit=!q||r.innerText.toLowerCase().indexOf(q)!==-1;
        var vis=hit&&(q||mExpanded||i<SHOW);
        r.style.display=vis?'':'none';if(vis)n++;
      });
      if(mc)mc.textContent=q?(n+' of '+mrows.length+' shown'):('Showing '+(mExpanded?('all '+mrows.length):('first '+Math.min(SHOW,mrows.length)+' of '+mrows.length)));
      mBtn.style.display=q?'none':'';
      mBtn.textContent=mExpanded?'Show less':'Show all '+mrows.length+' rows';
      if(q&&mf){var art=mf.closest('.article');if(art&&!art.classList.contains('open')){art.classList.add('open');var ab=art.querySelector('.article-title');if(ab)ab.setAttribute('aria-expanded','true');}}
    }
    if(mf)mf.addEventListener('input',refreshMaster);
    mBtn.addEventListener('click',function(){
      mExpanded=!mExpanded;refreshMaster();
      if(!mExpanded&&mWrap){try{mWrap.scrollIntoView({block:'start'});}catch(e){}}
    });
    refreshMaster();
  }

  /* announcement banner removed per request */

  /* print / PDF button removed per request */

  /* glossary tooltips */
  var GLOSS=[
    ['MDM','Mobile Device Management — software that manages device fleets from a console.'],
    ['UEM','Unified Endpoint Management — device management extended to every endpoint type.'],
    ['EMM','Enterprise Mobility Management — Android-focused device management.'],
    ['Kiosk','Lockdown mode that limits a device to approved apps.'],
    ['OTA','Over-the-air updates — firmware or software delivered wirelessly, no cables.'],
    ['Knox','Samsung\u2019s hardware security and device-management platform.'],
    ['IMEI','Unique identifier of a cellular device, used for bulk registration.'],
    ['APK','Android application package — the install file for apps.'],
    ['VPN','Encrypted tunnel that protects device network traffic.'],
    ['Geofence','Virtual boundary that triggers alerts when devices enter or exit.'],
    ['SLA','Service-level agreement — e.g. guaranteed signage uptime.'],
    ['ERP','Enterprise planning system that can sync with FieldX via API.'],
    ['CRM','Customer system that can sync with FieldX via API.'],
    ['Webhook','Automatic HTTP message sent to your URL when an event happens.'],
    ['AOSP','Open-source Android, used as the base for custom device builds.'],
    ['BYOD','Bring your own device — personal devices under partial management.'],
    ['CSV','Comma-separated file format, used for bulk device registration.'],
    ['Allowlist','Approved-apps-only rule — anything else is blocked or removed.'],
    ['SMS control','Encrypted text-message commands that work even with no data connection.'],
    ['Compliance','Whether a device follows the policies assigned to it.'],
    ['Rollout','Staged release of an app or firmware build across device groups.'],
    ['Firmware','Low-level device software, updated over the air.'],
    ['Console','The FieldX web portal where fleets are managed.'],
    ['Zone','Site-level grouping with isolated policies and its own admins.'],
    ['Bucket','Logical container that groups devices and their policies.']
  ];
  try{
    var main0=document.querySelector('main'),gcount=0;
    function glossWalk(node){
      if(gcount>80||!node)return;
      if(node.nodeType===3){
        var text=node.nodeValue,found=null,fidx=-1,fterm='';
        for(var gi=0;gi<GLOSS.length;gi++){
          var rx=new RegExp('\\b'+GLOSS[gi][0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i');
          var m=rx.exec(text);
          if(m&&(fidx===-1||m.index<fidx)){fidx=m.index;found=GLOSS[gi];fterm=m[0];}
        }
        if(found&&fidx!==-1){
          gcount++;
          var frag=document.createDocumentFragment();
          frag.appendChild(document.createTextNode(text.slice(0,fidx)));
          var sp=document.createElement('span');sp.className='gloss';sp.setAttribute('tabindex','0');sp.setAttribute('data-def',found[1]);sp.textContent=fterm;
          frag.appendChild(sp);
          var rest=document.createTextNode(text.slice(fidx+fterm.length));
          frag.appendChild(rest);
          node.parentNode.replaceChild(frag,node);
          glossWalk(rest);
        }
      }else if(node.nodeType===1){
        var tag=(node.tagName||'').toLowerCase();
        if(tag==='script'||tag==='style'||tag==='input'||tag==='textarea'||tag==='select'||tag==='a'||tag==='button'||/^h[1-6]$/.test(tag))return;
        if(node.classList&&(node.classList.contains('gloss')||node.classList.contains('guide-dir')||node.classList.contains('fxs-dd')||node.classList.contains('fxc-panel')))return;
        var kids=Array.prototype.slice.call(node.childNodes);
        for(var i=0;i<kids.length&&gcount<=80;i++)glossWalk(kids[i]);
      }
    }
    if(main0)glossWalk(main0);
  }catch(e){}

  /* helpful widget removed per request */

  /* recently viewed removed per request */

  /* screen-reader announcements — only when the Accessibility toggle is ON */
  var A11Y_ON=false;try{A11Y_ON=localStorage.getItem('fx-a11y')==='on';}catch(e){}
  function paintFontBtn(v){
    document.querySelectorAll('.font-toggle').forEach(function(b){
      b.style.fontSize=Math.round(12*v/100)+'px';
      b.setAttribute('title','Text size: '+v+'% (click for options)');
      b.setAttribute('aria-label','Accessibility options. Text size '+v+' percent.');
    });
  }
  function setZoom(v){
    try{document.body.style.zoom=(v/100);}catch(e){}
    try{localStorage.setItem('fx-zoom',String(v));}catch(e2){}
    paintFontBtn(v);
    if(aPanel){
      Array.prototype.forEach.call(aPanel.querySelectorAll('[data-z]'),function(b){
        b.classList.toggle('on',parseInt(b.getAttribute('data-z'),10)===v);
      });
    }
  }
  var aPanel=null;
  function closeA11y(){if(aPanel){aPanel.remove();aPanel=null;}}
  function openA11y(){
    closeA11y();
    var zoom=100;try{zoom=parseInt(localStorage.getItem('fx-zoom')||'100',10);}catch(e3){}
    aPanel=document.createElement('div');aPanel.className='a11y-panel';aPanel.setAttribute('role','dialog');aPanel.setAttribute('aria-label','Accessibility options');
    aPanel.innerHTML='<div class="a11y-row a11y-title"><span>Accessibility</span><button class="a11y-x" aria-label="Close options">\u2715</button></div>'
      +'<div class="a11y-row"><span>Text size</span><span class="a11y-zoom">'
      +[100,112,125].map(function(v){return '<button data-z="'+v+'" class="'+(v===zoom?'on':'')+'">'+v+'%</button>';}).join('')
      +'</span></div>'
      +'<div class="a11y-row"><span>Announcements</span><button class="a11y-switch" role="switch" aria-checked="'+A11Y_ON+'" aria-label="Screen reader announcements"><i></i></button></div>'
      +'<div class="a11y-row"><span>High contrast</span><button class="a11y-hc" role="switch" aria-checked="false" aria-label="High contrast"><i></i></button></div>';
    document.body.appendChild(aPanel);
    Array.prototype.forEach.call(aPanel.querySelectorAll('[data-z]'),function(b){
      b.addEventListener('click',function(){setZoom(parseInt(b.getAttribute('data-z'),10));});
    });
    var sw=aPanel.querySelector('.a11y-switch');
    sw.addEventListener('click',function(){
      A11Y_ON=!A11Y_ON;
      try{localStorage.setItem('fx-a11y',A11Y_ON?'on':'off');}catch(e4){}
      if(A11Y_ON){try{sessionStorage.setItem('fx-a11y-msg','1');}catch(e5){}}
      location.reload();
    });
    var hc=aPanel.querySelector('.a11y-hc');
    function paintHC(){
      var on=document.documentElement.getAttribute('data-contrast')==='high';
      hc.setAttribute('aria-checked',on?'true':'false');
    }
    paintHC();
    hc.addEventListener('click',function(){
      var on=document.documentElement.getAttribute('data-contrast')==='high';
      if(on)document.documentElement.removeAttribute('data-contrast');
      else document.documentElement.setAttribute('data-contrast','high');
      try{localStorage.setItem('fx-contrast',on?'off':'high');}catch(e6){}
      paintHC();
    });
    aPanel.querySelector('.a11y-x').addEventListener('click',function(){closeA11y();});
  }
  paintFontBtn((function(){try{var v=parseInt(localStorage.getItem('fx-zoom')||'100',10);return v===112||v===125?v:100;}catch(e){return 100;}})());
  document.querySelectorAll('.font-toggle').forEach(function(b){
    b.addEventListener('click',function(ev){ev.stopPropagation();if(aPanel){closeA11y();}else{openA11y();}});
  });
  document.addEventListener('click',function(e){
    if(aPanel&&!e.target.closest('.a11y-panel')&&!e.target.closest('.font-toggle'))closeA11y();
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeA11y();});
  var live=document.createElement('div');live.className='sr-only';live.setAttribute('aria-live','polite');live.setAttribute('role','status');
  document.body.appendChild(live);
  function say(msg){if(!A11Y_ON)return;try{live.textContent='';setTimeout(function(){live.textContent=msg;},40);}catch(e){}}
  try{if(sessionStorage.getItem('fx-a11y-msg')){sessionStorage.removeItem('fx-a11y-msg');setTimeout(function(){say('Accessibility announcements on.');},400);}}catch(e4){}
  document.addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('.article-title'):null;
    if(b){
      var art=b.closest('.article'),t=(b.innerText||'section').trim();
      setTimeout(function(){say(t+(art&&art.classList.contains('open')?', expanded':', collapsed'));},60);
    }
  });
  var rc=document.querySelector('#result-count');
  if(rc&&window.MutationObserver){
    var last='';
    new MutationObserver(function(){var v=(rc.textContent||'').trim();if(v&&v!==last){last=v;say(v);}}).observe(rc,{childList:true,characterData:true,subtree:true});
  }
  var chatBody=null,chatTimer=null;
  document.addEventListener('click',function(){
    if(!chatBody)chatBody=document.querySelector('.fxc-body');
    if(chatBody&&!chatBody.dataset.fxw){
      chatBody.dataset.fxw='1';
      new MutationObserver(function(muts){
        var added=false;
        muts.forEach(function(mu){if(mu.addedNodes&&mu.addedNodes.length)added=true;});
        if(added){clearTimeout(chatTimer);chatTimer=setTimeout(function(){say('Assistant reply received.');},700);}
      }).observe(chatBody,{childList:true});
    }
  });

  /* sidebar collapse for focused reading (remembered) */
  function paintSide(){
    var off=document.body.classList.contains('docs-collapsed');
    document.querySelectorAll('.side-toggle').forEach(function(b){
      b.innerHTML='&#9776;';
      b.setAttribute('aria-label',off?'Expand sidebar':'Collapse sidebar');
      b.setAttribute('title',off?'Expand sidebar':'Collapse sidebar');
    });
  }
  try{if(localStorage.getItem('fx-side')==='off')document.body.classList.add('docs-collapsed');}catch(e){}
  paintSide();
  document.querySelectorAll('.side-toggle').forEach(function(b){
    b.addEventListener('click',function(){
      var off=document.body.classList.toggle('docs-collapsed');
      try{localStorage.setItem('fx-side',off?'off':'on');}catch(e2){}
      paintSide();
    });
  });

  /* copy buttons on command steps + code spans */
  function copyText(txt,el,done){
    function ok(){if(el){var o=el.textContent;el.textContent='\u2713 Copied';el.classList.add('copied');setTimeout(function(){el.textContent=o;el.classList.remove('copied');},1200);}}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(ok,ok);}
    else{var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch(e){}document.body.removeChild(ta);ok();}
  }
  var CMD=/^(adb|dumpsys|pm\s|cmd\s|curl|FX\s|cd\s|ls\s|source\s|lunch|fastboot|apksigner|unzip|ping|tail|grep|ssh)\b/i;
  document.querySelectorAll('.step').forEach(function(s){
    var txt=(s.innerText||'').trim();
    if(!CMD.test(txt))return;
    var b=document.createElement('button');b.className='copy-btn';b.textContent='Copy';b.setAttribute('aria-label','Copy command');
    b.addEventListener('click',function(ev){ev.stopPropagation();copyText(txt,b);});
    s.appendChild(b);
  });
  document.querySelectorAll('.code').forEach(function(c){
    if(/^\d+\.\d+\.\d+\.\d+$/.test((c.innerText||'').trim()))return;
    c.classList.add('copyable');c.setAttribute('title','Click to copy');
    c.addEventListener('click',function(){copyText(c.innerText,c);});
  });

  /* image lightbox: click any screenshot to pop out */
  var lb=document.createElement('div');lb.className='lightbox';lb.setAttribute('role','dialog');lb.setAttribute('aria-label','Image viewer');
  lb.innerHTML='<img alt=""><button class="lb-x" aria-label="Close viewer">✕</button><div class="lb-cap"></div>';
  document.body.appendChild(lb);
  var lbImg=lb.querySelector('img'),lbCap=lb.querySelector('.lb-cap');
  function closeLb(){lb.classList.remove('open');document.body.style.overflow='';}
  lb.addEventListener('click',function(e){if(e.target!==lbImg)closeLb();});
  lb.querySelector('.lb-x').addEventListener('click',closeLb);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeLb();});
  document.querySelectorAll('.shot img').forEach(function(img){
    img.classList.add('zoomable');img.setAttribute('tabindex','0');
    img.setAttribute('aria-label','Enlarge image: '+(img.getAttribute('alt')||'screenshot'));
    function openLb(){
      lbImg.src=img.currentSrc||img.src;lbImg.alt=img.getAttribute('alt')||'';
      var cap=img.parentNode?img.parentNode.querySelector('.shot-cap'):null;
      lbCap.textContent=cap?cap.textContent:'';
      lb.classList.add('open');document.body.style.overflow='hidden';
      lb.querySelector('.lb-x').focus();
    }
    img.addEventListener('click',openLb);
    img.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openLb();}});
  });

  /* platform pills: color-code availability so restrictions scan by platform */
  function platClass(name){
    if(/samsung/i.test(name))return 'plat-ss';
    if(/android enterprise/i.test(name))return 'plat-ae';
    if(/fieldx emm/i.test(name))return 'plat-fx';
    return 'plat-na';
  }
  function pillify(el){
    if(!el||el.getAttribute('data-pilled'))return;
    var parts=el.textContent.split(',').map(function(s){return s.trim();}).filter(Boolean);
    if(!parts.length)return;
    el.textContent='';
    parts.forEach(function(p){
      var s=document.createElement('span');s.className='plat '+platClass(p);s.textContent=p;el.appendChild(s);
    });
    el.setAttribute('data-pilled','1');
  }
  document.querySelectorAll('.field').forEach(function(f){
    var b=f.querySelector('b'),v=f.querySelector('span');
    if(b&&v&&b.textContent.trim()==='Available for')pillify(v);
  });
  document.querySelectorAll('table.master tbody tr').forEach(function(tr){
    pillify(tr.cells&&tr.cells[2]);
  });

  /* scrollspy + to-top visibility (right rail AND sidebar submenu) */
  var spyLinks=Array.prototype.slice.call(document.querySelectorAll('.right .toc a[href^="#"]'));
  var spyMap={};
  spyLinks.forEach(function(a){var el=document.querySelector(a.getAttribute('href'));if(el)spyMap[a.getAttribute('href')]=el;});
  var curPage=(location.pathname.split('/').pop()||'index.html').split('?')[0];
  var sideMap=[];
  Array.prototype.forEach.call(document.querySelectorAll('.sidebar .nav-sub-item'),function(a){
    var h=a.getAttribute('href')||'',parts=h.split('#');
    if(parts.length<2||!parts[1])return;
    if(parts[0]&&parts[0]!==curPage)return;
    var el=document.getElementById(parts[1]);
    if(el)sideMap.push({a:a,el:el,hash:'#'+parts[1]});
  });
  var ticking=false;
  function onScroll(){
    ticking=false;
    var y=window.scrollY+140,cur=null;
    Object.keys(spyMap).forEach(function(h){if(spyMap[h].offsetTop<=y)cur=h;});
    spyLinks.forEach(function(a){a.classList.toggle('spy',a.getAttribute('href')===cur);});
    var scur=null;
    sideMap.forEach(function(s){if(s.el.offsetTop<=y)scur=s.hash;});
    sideMap.forEach(function(s){s.a.classList.toggle('active',s.hash===scur);});
    st.classList.toggle('show',window.scrollY>600);
    prog();
  }
  document.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
  onScroll();
});
})();
