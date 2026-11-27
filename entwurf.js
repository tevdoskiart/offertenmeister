/* Entwurf-Seiten: /entwurf/?f=<kürzel>. Daten je Betrieb: [Firma, Ort, Ansprache, Mobile]. */
(function(){
  var F={"grueter": ["Malergeschäft Grüter GmbH", "Luzern", "", "078 609 09 14"], "donato": ["Maler Donato", "Chur", "Herr Grecuccio", "079 449 07 39"], "ficorilli": ["James Ficorilli Maler und Renovationen", "Chur", "Herr Ficorilli", "076 647 48 94"], "bornhauser": ["Bornhauser Maler", "Chur", "Herr Bornhauser", "079 462 90 56"], "rettich": ["Maler Michael Rettich", "Chur", "Herr Rettich", "076 560 11 66"], "holderegger": ["Malergeschäft Holderegger GmbH", "Olten", "Herr Holderegger", "079 299 58 47"], "cosentino": ["Malergeschäft Vincenzo Cosentino", "Olten", "Herr Cosentino", "079 342 16 74"], "haechler": ["Malergeschäft D. Hächler", "Aarau Rohr", "Herr Hächler", "079 414 19 22"]};
  var k=(new URLSearchParams(location.search).get('f')||'').toLowerCase(),d=F[k];
  var firma=d?d[0]:'Ihr Malergeschäft',ort=d?d[1]:'Ihre Region',wa=d?'41'+d[3].replace(/ /g,'').slice(1):'';
  if(d){
    var set=function(n,v){document.querySelectorAll('[data-f="'+n+'"]').forEach(function(e){e.textContent=v;});};
    set('firma',d[0]);set('ort',d[1]);set('tel',d[3]);set('gruss',d[2]?'Grüezi '+d[2]:'Grüezi');
    document.title='Entwurf '+d[0];
    document.getElementById('tel').href='tel:+'+wa;
    document.getElementById('ja').href='https://wa.me/38978338208?text='+encodeURIComponent('Grüezi Herr Tevdoski, der Entwurf für '+d[0]+' gefällt mir. Bitte melden Sie sich.');
  }
  var a=document.getElementById('arbeit'),q=document.getElementById('qm'),o=document.getElementById('qmout'),p=document.getElementById('preis'),s=document.getElementById('senden');
  function chf(n){n=Math.round(n/10)*10;return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,"'");}
  function upd(){
    var r=a.value.split(','),m=+q.value,t='CHF '+chf(m*r[0])+'–'+chf(m*r[1]);
    o.textContent=m+' m²';p.textContent=t;
    var msg='Grüezi '+firma+'\nIch möchte eine Offerte.\nArbeit: '+a.options[a.selectedIndex].text+'\nFläche: ca. '+m+' m²\nRichtpreis laut Website: '+t+'\nOrt: '+ort+'\nFotos schicke ich gleich nach.';
    s.href=(wa?'https://wa.me/'+wa:'https://wa.me/38978338208')+'?text='+encodeURIComponent(msg);
  }
  a.addEventListener('change',upd);q.addEventListener('input',upd);
  document.getElementById('rechner').addEventListener('submit',function(e){e.preventDefault();});
  upd();
})();
