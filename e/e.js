/* Entwurf-Seiten /e/<kürzel>/: Preisrechner. Firma, Ort und WhatsApp-Nummer stehen als data-Attribute am <body>.
   Die Seiten selbst erzeugt tools/entwurf-bauen.js aus tools/betriebe.json (npm run entwurf). */
(function(){
  var B=document.body.dataset,a=document.getElementById('arbeit'),q=document.getElementById('qm'),o=document.getElementById('qmout'),p=document.getElementById('preis'),s=document.getElementById('senden');
  function chf(n){n=Math.round(n/10)*10;return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,"'");}
  function upd(){
    var r=a.value.split(','),m=+q.value,t='CHF '+chf(m*r[0])+'–'+chf(m*r[1]);
    o.textContent=m+' m²';p.textContent=t;
    var msg='Grüezi '+B.firma+'\nIch möchte eine Offerte.\nArbeit: '+a.options[a.selectedIndex].text+'\nFläche: ca. '+m+' m²\nRichtpreis laut Website: '+t+'\nOrt: '+B.ort+'\nFotos schicke ich gleich nach.';
    s.href='https://wa.me/'+B.wa+'?text='+encodeURIComponent(msg);
  }
  a.addEventListener('change',upd);q.addEventListener('input',upd);
  document.getElementById('rechner').addEventListener('submit',function(e){e.preventDefault();});
  upd();
})();
