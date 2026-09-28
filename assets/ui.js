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
