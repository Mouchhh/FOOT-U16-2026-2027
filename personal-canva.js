// The main Canva card creates the current causerie; the saved personal URL is a separate shortcut.
(() => {
 const key='vestiaire-personal-canva';
 function validate(value){
  const raw=String(value||'').trim();if(raw.length>2048)throw Error('Ce lien est trop long.');
  let url;try{url=new URL(raw);}catch{throw Error('Collez le lien complet de votre page Canva, commençant par https://.');}
  if(url.protocol!=='https:'||!['canva.com','www.canva.com'].includes(url.hostname)||url.username||url.password||url.port||/^\/(?:api|login|signup)(?:\/|$)/i.test(url.pathname))throw Error('Utilisez le lien de votre espace ou de votre présentation sur https://www.canva.com/.');
  return url.href;
 }
 document.addEventListener('DOMContentLoaded',()=>{
  const target=document.querySelector('#terrain-page-2 .terrain-team-section');if(!target)return;
  let saved='';try{const value=coachStorageGet(key);if(value)saved=validate(value);}catch{}
  const card=el('section','personal-canva');card.id='personal-canva';card.setAttribute('aria-labelledby','personal-canva-title');
  const head=el('div','personal-canva-heading'),badge=el('span','personal-canva-badge','C');badge.setAttribute('aria-hidden','true');
  const heading=el('h2','','Mon Canva');heading.id='personal-canva-title';head.append(badge,heading);
  const open=el('a','personal-canva-open','Mon espace Canva ↗');open.id='personal-canva-open';open.target='_blank';open.rel='noopener noreferrer';head.append(open);card.append(head);
  const description=el('p','','Votre causerie terminée, créez une présentation complète et ouvrez-la directement dans votre Canva.');card.append(description);
  const create=el('button','primary personal-canva-create','Créer et ouvrir ma causerie dans Canva');create.type='button';create.id='personal-canva-create';
  create.onclick=()=>{if(window.causerieExport?.createAndOpen)window.causerieExport.createAndOpen();else status.textContent='L’export de causerie est indisponible. Rechargez la page et réessayez.';};
  card.append(create);
  const last=el('a','personal-canva-last','Reprendre ma dernière causerie Canva ↗');last.id='personal-canva-last';last.target='_blank';last.rel='noopener noreferrer';last.hidden=true;card.append(last);
  function renderLast(value){
   try{last.href=validate(value.url);last.hidden=false;last.title=value.title||'Dernière causerie';}catch{last.hidden=true;last.removeAttribute('href');}
  }
  try{const value=JSON.parse(coachStorageGet('vestiaire-last-canva-presentation')||'null');if(value)renderLast(value);}catch{}
  window.addEventListener('causerie:created',event=>renderLast(event.detail));
  const details=el('details'),summary=el('summary'),form=el('form'),label=el('label','','Lien de ma page Canva'),input=el('input');
  input.type='url';input.id='personal-canva-url';input.required=true;input.maxLength=2048;input.placeholder='https://www.canva.com/…';input.autocomplete='off';label.htmlFor=input.id;label.append(input);
  const actions=el('div','personal-canva-actions'),save=el('button','primary','Enregistrer mon lien'),remove=el('button','export','Retirer le lien');
  save.type='submit';remove.type='button';remove.id='personal-canva-remove';actions.append(save,remove);form.append(label,actions);details.append(summary,form);card.append(details);
  const status=el('p','hint');status.id='personal-canva-status';status.setAttribute('role','status');card.append(status);
  function render(){
   open.hidden=!saved;if(saved)open.href=saved;else open.removeAttribute('href');
   input.value=saved;summary.textContent=saved?'Modifier mon lien personnel':'Enregistrer mon espace Canva · facultatif';details.open=false;remove.hidden=!saved;
  }
  form.onsubmit=event=>{
   event.preventDefault();input.setCustomValidity('');
   try{const next=validate(input.value);coachStorageSet(key,next);saved=next;render();status.textContent='Lien enregistré pour '+activeCoach.name+' sur cet appareil.';}
   catch(error){status.textContent=error.name==='QuotaExceededError'?'Stockage indisponible : le lien n’a pas été enregistré.':error.message;}
  };
  remove.onclick=()=>{
   try{coachStorageSet(key,'');saved='';render();status.textContent='Lien retiré de cet espace coach.';}
   catch{status.textContent='Impossible de retirer le lien : vérifiez le stockage de cet appareil.';}
  };
  render();target.prepend(card);
  const manual=target.querySelector('.causerie-export-panel');
  if(manual){
   const options=el('details','personal-canva-download'),summary=el('summary','','Vérifier ou télécharger une copie de ma causerie');
   options.id='personal-canva-download';manual.before(options);options.append(summary,manual);
  }
 });
})();
