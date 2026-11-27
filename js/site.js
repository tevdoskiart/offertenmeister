/* Offertenmeister – gemeinsames Script für /index.html und /en/index.html.
   Sprache kommt aus <html lang>. Nach jeder Änderung die Version im <script> beider Seiten erhöhen (?v=). */
{
const EN=document.documentElement.lang.startsWith('en');
const TX=EN?{
 leer:'Please enter your company name.',
 nachricht:(firma,ort,web,paket)=>`Hello Mr Tevdoski\n\nCompany: ${firma}\nLocation: ${ort||'-'}\nWebsite: ${web||'none'}\nInterested in: ${paket}\n\nPlease send me a free website check.`
}:{
 leer:'Bitte geben Sie Ihren Firmennamen ein.',
 nachricht:(firma,ort,web,paket)=>`Grüezi Herr Tevdoski\n\nFirma: ${firma}\nOrt: ${ort||'-'}\nWebsite: ${web||'keine'}\nInteresse: ${paket}\n\nBitte schicken Sie mir einen kostenlosen Website-Check.`
};
const H=document.querySelector('.hero-bild');const go=()=>H.classList.add('da');H.complete?go():H.addEventListener('load',go);H.addEventListener('error',go);
if(matchMedia('(prefers-reduced-motion:no-preference) and (min-width:901px)').matches){
 const hs=document.querySelector('.hero');
 if(matchMedia('(pointer:fine)').matches)hs.addEventListener('pointermove',e=>{const r=hs.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;H.style.setProperty('--px',(-x*24)+'px');H.style.setProperty('--py',(-y*14)+'px')});
 hs.addEventListener('pointerleave',()=>{H.style.setProperty('--px','0px');H.style.setProperty('--py','0px')});
 let t=false;addEventListener('scroll',()=>{if(t)return;t=true;requestAnimationFrame(()=>{const y=scrollY;if(y<800)H.style.setProperty('--py',(y*.15)+'px');t=false})},{passive:true});
}
const K=document.querySelector('.kopf'),B=K.querySelector('.burger');
const zu=()=>{K.classList.remove('offen');B.setAttribute('aria-expanded','false')};
B.addEventListener('click',()=>B.setAttribute('aria-expanded',K.classList.toggle('offen')));
K.querySelectorAll('.links a').forEach(a=>a.addEventListener('click',zu));
K.addEventListener('keydown',e=>{if(e.key==='Escape'&&K.classList.contains('offen')){zu();B.focus()}});
const S=document.querySelector('.schalter');
S.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const m=b.dataset.m;
 S.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));
 document.querySelectorAll('[data-abo]').forEach(el=>el.textContent=el.dataset[m])});
document.querySelectorAll('[data-plan]').forEach(a=>a.addEventListener('click',()=>{document.getElementById('paket').value=a.dataset.plan}));
document.getElementById('f').addEventListener('submit',e=>{e.preventDefault();
 const v=id=>document.getElementById(id).value.trim();
 const firma=v('firma');
 if(!firma){document.getElementById('hinweis').textContent=TX.leer;document.getElementById('firma').focus();return}
 const msg=TX.nachricht(firma,v('ort'),v('web'),v('paket'));
 window.open('https://wa.me/38978338208?text='+encodeURIComponent(msg),'_blank','noopener')});

// Intro-Banner: einmal pro Besucher, kurz nach dem Laden. Schliessen mit ×, Esc oder Klick daneben.
const I=document.getElementById('intro');
if(I&&typeof I.showModal==='function'){
 const K='om-intro-990';let gesehen=false;
 try{gesehen=localStorage.getItem(K)==='1'}catch(e){}
 const zu=()=>{if(I.open)I.close();try{localStorage.setItem(K,'1')}catch(e){}};
 I.querySelector('.intro-zu').addEventListener('click',zu);
 I.querySelectorAll('a[href="#kontakt"]').forEach(a=>a.addEventListener('click',zu));
 I.addEventListener('click',e=>{if(e.target===I)zu()});
 I.addEventListener('close',zu);
 if(!gesehen&&!location.hash){const auf=()=>setTimeout(()=>{if(!I.open)I.showModal()},700);document.readyState==='complete'?auf():addEventListener('load',auf)}
}
}
/* Treppen-Video «In 7 Tagen online»: startet erst, wenn es sichtbar ist; ohne Bewegung (prefers-reduced-motion) bleibt das Standbild. */
{
 const V=document.querySelector('.stufen-video');
 if(V&&'IntersectionObserver' in window&&matchMedia('(prefers-reduced-motion:no-preference)').matches){
  new IntersectionObserver(es=>es.forEach(e=>{
   if(e.isIntersecting){const p=V.play();if(p&&p.then)p.then(()=>V.classList.add('laeuft')).catch(()=>{})}
   else V.pause();
  }),{threshold:.35}).observe(V);
 }
}
