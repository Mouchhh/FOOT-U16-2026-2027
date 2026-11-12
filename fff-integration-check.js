'use strict';
const fffProbeURL='';
const probe={source:fffProbeURL,lecture:'non testée',tableauHTML:false,cadre:'non vérifié',evenementCadre:'non démarré'};
const byId=id=>document.getElementById(id);
function renderProbe(){byId('report').value=JSON.stringify(probe,null,2);}
byId('official').href=fffProbeURL;renderProbe();
byId('fff-frame').addEventListener('load',()=>{probe.evenementCadre='load reçu (ne prouve pas que le classement est visible)';renderProbe();});
byId('fff-frame').addEventListener('error',()=>{probe.evenementCadre='erreur signalée par le navigateur';renderProbe();});
for(const radio of document.querySelectorAll('input[name=visible]'))radio.addEventListener('change',()=>{
 probe.cadre=radio.value==='yes'?'tableau visible, confirmé par l’utilisateur':'tableau non visible, confirmé par l’utilisateur';
 byId('frame-status').textContent=radio.value==='yes'?'L’affichage intégré fonctionne dans ce navigateur. La lecture des données par le site est un test distinct.':'L’affichage intégré n’est pas confirmé. Une capture du cadre permettra de distinguer un refus d’encadrement d’une autre erreur.';
 renderProbe();
});
byId('start').onclick=async()=>{
 byId('start').disabled=true;byId('frame-section').hidden=false;
 for(const radio of document.querySelectorAll('input[name=visible]'))radio.checked=false;
 probe.cadre='non vérifié';probe.evenementCadre='chargement demandé';probe.lecture='en cours';probe.tableauHTML=false;delete probe.http;
 byId('fff-frame').src=fffProbeURL;byId('reading-status').textContent='Lecture directe de la page FFF en cours…';renderProbe();
 try{
  const response=await fetch(fffProbeURL,{mode:'cors',credentials:'omit',cache:'no-store',referrerPolicy:'strict-origin-when-cross-origin',signal:AbortSignal.timeout(12000)});
  probe.http=response.status;
  if(!response.ok){probe.lecture='réponse HTTP '+response.status;byId('reading-status').textContent='La lecture directe a reçu HTTP '+response.status+'.';await response.body?.cancel();return;}
  const reader=response.body?.getReader();if(!reader)throw Error('empty_body');
  const chunks=[];let length=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>4000000){await reader.cancel();throw Error('page_too_large');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const doc=new DOMParser().parseFromString(new TextDecoder().decode(bytes),'text/html');
  probe.tableauHTML=[...doc.querySelectorAll('table')].some(t=>(/pts|points/i.test(t.textContent)||t.querySelector('.cdk-column-points'))&&/quipe|club/i.test(t.textContent));
  probe.lecture=probe.tableauHTML?'lecture autorisée et tableau HTML détecté':'lecture autorisée, aucun tableau HTML reconnu';
  byId('reading-status').textContent=probe.tableauHTML?'La lecture directe fonctionne : le navigateur a reçu une page contenant un tableau de classement.':'La page est lisible, mais le test n’a pas identifié de tableau de classement.';
 }catch(error){
  probe.lecture=error.name==='TimeoutError'||error.name==='AbortError'?'délai dépassé':error.message==='page_too_large'?'page trop volumineuse':'lecture impossible (réseau ou politique interdomaines)';
  byId('reading-status').textContent='Lecture directe : '+probe.lecture+'. Le cadre ci-dessous est testé séparément.';
 }finally{renderProbe();byId('start').disabled=false;}
};
