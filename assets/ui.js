/* FieldX Docs — UI enhancements: scrollspy, mobile TOC, to-top, progress, copy-link, master filter */
(function(){
'use strict';
function reduced(){return window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
document.addEventListener('DOMContentLoaded',function(){
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

  /* copy-link buttons on section headings */
  Array.prototype.forEach.call(document.querySelectorAll('.catrow h2, .intro h1'),function(h){
    var sec=h.closest('section');if(!sec||!sec.id)return;
    var b=document.createElement('button');b.className='head-link';b.setAttribute('aria-label','Copy link to this section');b.textContent='#';
    b.addEventListener('click',function(ev){
      ev.stopPropagation();
      var url=location.origin+location.pathname+'#'+sec.id;
      function done(){b.textContent='\u2713';b.classList.add('copied');setTimeout(function(){b.textContent='#';b.classList.remove('copied');},1200);}
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(done,done);}
      else{var ta=document.createElement('textarea');ta.value=url;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch(e){}document.body.removeChild(ta);done();}
    });
    h.appendChild(b);
  });

  /* master-table quick filter (Restrictions hub) */
  var mf=document.querySelector('#master-filter');
  if(mf){
    mf.addEventListener('input',function(){
      var q=mf.value.toLowerCase().trim(),n=0,total=0;
      Array.prototype.forEach.call(document.querySelectorAll('.master tbody tr'),function(r){
        total++;
        var hit=!q||r.innerText.toLowerCase().indexOf(q)!==-1;
        r.style.display=hit?'':'none';if(hit)n++;
      });
      var c=document.querySelector('#master-count');
      if(c)c.textContent=q?(n+' of '+total+' shown'):'';
      var art=mf.closest('.article');if(art&&q)art.classList.add('open');
    });
  }

  /* announcement banner (dismissible, remembered) */
  try{
    if(localStorage.getItem('fx-banner')!=='off'){
      var bn=document.createElement('div');bn.className='fx-banner';
      bn.innerHTML='<span><strong>New:</strong> Restrictions are now 29 category pages — <a href="policies.html">Browse →</a></span><button aria-label="Dismiss announcement">✕</button>';
      document.body.insertBefore(bn,document.body.firstChild);
      bn.querySelector('button').addEventListener('click',function(){
        bn.remove();try{localStorage.setItem('fx-banner','off');}catch(e){}
      });
    }
  }catch(e){}

  /* print / PDF button in the right rail */
  var rightRail=document.querySelector('.right');
  if(rightRail){
    var pb2=document.createElement('button');pb2.className='print-btn';pb2.textContent='Print / PDF';
    pb2.addEventListener('click',function(){window.print();});
    rightRail.insertBefore(pb2,rightRail.firstChild);
  }

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
        if(node.classList&&(node.classList.contains('gloss')||node.classList.contains('fxs-dd')||node.classList.contains('fxc-panel')))return;
        var kids=Array.prototype.slice.call(node.childNodes);
        for(var i=0;i<kids.length&&gcount<=80;i++)glossWalk(kids[i]);
      }
    }
    if(main0)glossWalk(main0);
  }catch(e){}

  /* was-this-helpful widget before the footer */
  try{
    var foot=document.querySelector('main .footer');
    if(foot){
      var page=location.pathname.split('/').pop()||'index.html';
      var key='fx-help-'+page;
      var hw=document.createElement('div');hw.className='help-card';
      var voted=null;try{voted=localStorage.getItem(key);}catch(e2){}
      if(voted){hw.innerHTML='<strong>Thanks for your feedback!</strong><span>You rated this page '+voted+'.</span>';}
      else{
        hw.innerHTML='<strong>Was this page helpful?</strong><span class="help-btns"><button data-v="helpful">Yes</button><button data-v="needs work">No</button></span>';
        Array.prototype.forEach.call(hw.querySelectorAll('button'),function(b){
          b.addEventListener('click',function(){
            try{localStorage.setItem(key,b.getAttribute('data-v'));}catch(e3){}
            hw.innerHTML='<strong>Thanks for your feedback!</strong>';
          });
        });
      }
      foot.parentNode.insertBefore(hw,foot);
    }
  }catch(e){}

  /* recently viewed in the sidebar */
  try{
    var side=document.querySelector('.sidebar');
    if(side){
      var cur={t:document.title.replace(/^FieldX Documentation\s*[—–-]\s*/,'').trim()||'Page',u:location.pathname.split('/').pop()||'index.html'};
      var rec=[];try{rec=JSON.parse(localStorage.getItem('fx-recent')||'[]');}catch(e4){rec=[];}
      rec=[cur].concat(rec.filter(function(r){return r.u!==cur.u;})).slice(0,6);
      try{localStorage.setItem('fx-recent',JSON.stringify(rec));}catch(e5){}
      var others=rec.filter(function(r){return r.u!==cur.u;}).slice(0,5);
      if(others.length){
        var g=document.createElement('div');g.className='nav-group recent-group';
        var lb=document.createElement('div');lb.className='nav-label';lb.textContent='Recently viewed';g.appendChild(lb);
        others.forEach(function(r){
          var row=document.createElement('div');row.className='recent-row';
          var a=document.createElement('a');a.className='nav-item';a.href=r.u;
          var s=document.createElement('span');s.textContent=r.t.length>26?r.t.slice(0,25)+'…':r.t;a.appendChild(s);row.appendChild(a);
          var x=document.createElement('button');x.className='recent-x';x.setAttribute('aria-label','Remove '+r.t+' from recently viewed');x.textContent='✕';
          x.addEventListener('click',function(ev){
            ev.preventDefault();ev.stopPropagation();
            var kept=[];try{kept=JSON.parse(localStorage.getItem('fx-recent')||'[]');}catch(e6){kept=[];}
            kept=kept.filter(function(k){return k.u!==r.u;});
            try{localStorage.setItem('fx-recent',JSON.stringify(kept));}catch(e7){}
            row.remove();
            if(!g.querySelector('.recent-row'))g.remove();
          });
          row.appendChild(x);g.appendChild(row);
        });
        side.appendChild(g);
      }
    }
  }catch(e){}

  /* scrollspy + to-top visibility */
  var spyLinks=Array.prototype.slice.call(document.querySelectorAll('.right .toc a[href^="#"]'));
  var spyMap={};
  spyLinks.forEach(function(a){var el=document.querySelector(a.getAttribute('href'));if(el)spyMap[a.getAttribute('href')]=el;});
  var ticking=false;
  function onScroll(){
    ticking=false;
    var y=window.scrollY+140,cur=null;
    Object.keys(spyMap).forEach(function(h){if(spyMap[h].offsetTop<=y)cur=h;});
    spyLinks.forEach(function(a){a.classList.toggle('spy',a.getAttribute('href')===cur);});
    st.classList.toggle('show',window.scrollY>600);
    prog();
  }
  document.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
  onScroll();
});
})();
