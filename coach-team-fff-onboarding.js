// Initial team setup is stored in the authenticated coach's Supabase metadata.
const coachFFFMetadataKey='stade_team_profiles_v1';
let coachFFFEnsurePending=null;
function coachFFFProfileValid(profile){
 return profile&&coachTeamValid(profile)&&profile.id!=='unassigned'&&profile.fffProfile?.version===1&&['Masculin','Féminin','Mixte'].includes(profile.fffProfile.gender)&&['Football à 11','Football à 8','Futsal'].includes(profile.fffProfile.format)&&Number.isInteger(profile.fffProfile.number)&&profile.fffProfile.number>=1&&profile.fffProfile.number<=20&&/^\d{4}-\d{4}$/.test(profile.fffProfile.season)&&typeof profile.fffProfile.level==='string'&&profile.fffProfile.level.length<=80&&(profile.fffProfile.sourceURL===''||agendaFFFURL(profile.fffProfile.sourceURL))&&typeof profile.fffProfile.officialName==='string'&&(!profile.fffProfile.sourceURL||profile.fffProfile.officialName.trim().length>0)&&profile.fffProfile.officialName.length<=150;
}
function coachFFFIdentity(team){const p=team.fffProfile;return JSON.stringify([coachTeamNormalize(team.category),p.gender,p.number,p.format,p.season]);}
function coachFFFSource(){return coachFFFProfileValid(activeCoachTeam)?activeCoachTeam.fffProfile.sourceURL:'';}
function coachFFFCandidates(html,sourceURL,category){
 if(typeof html!=='string'||html.length>4000000)throw Error('Page FFF invalide.');
 const page=new DOMParser().parseFromString(html,'text/html'),seen=new Map(),result=[];
 for(const link of page.querySelectorAll('a[href]')){
  let url;try{url=agendaFFFURL(new URL(link.getAttribute('href'),sourceURL).href);}catch{continue;}
  if(!url)continue;
  const label=(link.textContent||link.getAttribute('aria-label')||link.getAttribute('title')||'').replace(/\s+/g,' ').trim().slice(0,150);
  if(!label)continue;
  const key=coachTeamNormalize(label+' '+decodeURIComponent(url)),wanted=coachTeamNormalize(category);
  const matches=/^u\d+$/.test(wanted)?new RegExp('(?:^|[^a-z0-9])'+wanted+'(?:[^0-9]|$)').test(key):key.includes(wanted);
  if(!matches)continue;
  const teamURL=url.replace(/\/(saison|classement)$/,'');
  if(seen.has(teamURL)){if(url.endsWith('/classement'))result[seen.get(teamURL)]={url,label};continue;}
  seen.set(teamURL,result.length);result.push({url,label});
 }
 return result.slice(0,80);
}
function coachFFFApplyProfiles(profiles){
 const valid=profiles.filter(coachFFFProfileValid),merged=new Map(coachTeams.map(t=>[t.id,t]));
 for(const profile of valid)merged.set(profile.id,profile);
 if(merged.size>100)throw Error('100 équipes maximum.');
 coachTeams=[...merged.values()];localStorage.setItem(coachTeamManifestKey,JSON.stringify(coachTeams));coachTeamsRefreshSelector();
}
async function coachFFFEnsure(){
 if(!clubNetworkBound())return false;
 if(coachFFFProfileValid(activeCoachTeam))return true;
 if(coachFFFEnsurePending)return coachFFFEnsurePending;
 coachFFFEnsurePending=(async()=>{
  const userId=clubNetworkSession.user.id,owner=trainingAgendaIdentity();
  try{
   const user=await clubNetworkRequest('/auth/v1/user');
   if(!clubNetworkBound()||clubNetworkSession.user.id!==userId||trainingAgendaIdentity()!==owner)return false;
   const profiles=Array.isArray(user.user_metadata?.[coachFFFMetadataKey])?user.user_metadata[coachFFFMetadataKey].filter(coachFFFProfileValid):[];
   if(profiles.length){
    const hadConfiguredTeam=coachTeams.some(coachFFFProfileValid);
    coachFFFApplyProfiles(profiles);
    const matched=profiles.find(p=>p.id===activeCoachTeam.id);
    const remembered=profiles.find(p=>p.id===user.user_metadata?.stade_active_team_v1)||profiles[0];
    // A fresh device restores the saved team; historical team data is never relabelled.
    if(matched||activeCoachTeam.id==='unassigned'||!hadConfiguredTeam){sessionStorage.setItem(coachTeamSelectionKey,(matched||remembered).id);location.reload();return false;}
   }
   coachFFFOpen();return false;
  }catch{coachFFFOpen();return false;}
 })();
 try{return await coachFFFEnsurePending;}finally{coachFFFEnsurePending=null;}
}
function coachFFFOpen({add=false}={}){
 if(document.getElementById('coach-fff-setup')||!clubNetworkBound())return;
 const owner=trainingAgendaIdentity(),userId=clubNetworkSession.user.id;
 const panel=el('section','coach-fff-setup');panel.id='coach-fff-setup';panel.setAttribute('aria-labelledby','coach-fff-title');
 const form=el('form');form.noValidate=true;const head=el('div','coach-fff-heading'),title=el('h1','',add?'Ajouter mes équipes':'Bienvenue · choisissons vos équipes');title.id='coach-fff-title';
 const later=el('button','export','Plus tard');later.type='button';later.onclick=()=>panel.remove();head.append(title,later);form.append(head,el('p','','Ajoutez une ou plusieurs équipes, confirmez leur lien FFF puis choisissez celle à ouvrir. Chaque équipe conserve ses propres données et son classement.'));
 const grid=el('div','coach-fff-fields');form.append(grid);
 function field(label,type,value,options){const wrap=el('label','',label),input=el(options?'select':'input');if(options)input.append(...options.map(v=>new Option(v,v)));else input.type=type;input.value=value;input.required=true;input.setAttribute('aria-label',label);if(!options)input.maxLength=80;wrap.append(input);grid.append(wrap);return input;}
 const previous=!add&&coachFFFProfileValid(activeCoachTeam)?activeCoachTeam.fffProfile:null;
 const now=new Date(),year=now.getMonth()>=6?now.getFullYear():now.getFullYear()-1;
 const club=field('Club','text','Club démo');club.readOnly=true;
 const category=field('Catégorie','text',add?'':activeCoachTeam.category||'', ['U6','U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19','U20','Seniors','Vétérans']);category.prepend(new Option('Choisir…',''));if(add||!activeCoachTeam.category)category.value='';
 const gender=field('Groupe','text',previous?.gender||'Masculin',['Masculin','Féminin','Mixte']);
 const number=field('Numéro de l’équipe','number',String(previous?.number||1));number.min='1';number.max='20';
 const format=field('Pratique','text',previous?.format||'Football à 11',['Football à 11','Football à 8','Futsal']);
 const level=field('Championnat / niveau','text',previous?.level||'');level.placeholder='Ex. Départementale 1';
 const season=field('Saison','text',previous?.season||year+'-'+(year+1));season.pattern='[0-9]{4}-[0-9]{4}';
 const search=el('button','primary','Rechercher mon équipe sur la FFF');search.type='button';
 const status=el('p','coach-fff-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');const results=el('div','coach-fff-results');
 const fallback=el('details'),summary=el('summary','','Associer un lien FFF (facultatif)');fallback.append(summary);
 const urlLabel=el('label','','Lien de l’équipe FFF'),url=el('input');url.type='url';url.value=previous?.sourceURL||'';url.setAttribute('aria-label','Lien de l’équipe FFF');url.placeholder='https://epreuves.fff.fr/competition/club/…/equipe/…/classement';urlLabel.append(url);
 const nameLabel=el('label','','Nom exact de l’équipe sur la FFF'),officialName=el('input');officialName.maxLength=150;officialName.value=previous?.officialName||'';officialName.setAttribute('aria-label','Nom exact de l’équipe sur la FFF');nameLabel.append(officialName);
 fallback.append(el('p','hint','La liaison FFF est facultative pour enregistrer votre équipe. Vous pourrez l’ajouter ensuite depuis « Mon équipe FFF ».'),urlLabel,nameLabel);
 const save=el('button','primary','Confirmer et ouvrir mon équipe');save.type='submit';save.id='coach-fff-save';
 const queue=el('section','coach-fff-queue');queue.setAttribute('aria-label','Équipes à enregistrer');
 const another=el('button','export','+ Ajouter une autre équipe');another.type='button';
 const footer=el('div','coach-fff-footer');footer.append(another,save);
 form.append(queue,search,results,fallback,status,footer);panel.append(form);document.body.append(panel);window.workspaceSheets?.prioritize(panel);category.focus();
 let chosen=null,run=0,pending=[],selectedId='',canEditActive=!add,draftId='team-'+crypto.randomUUID();
 const context=()=>JSON.stringify([category.value,gender.value,number.value,format.value,level.value,season.value]);
 const isOwner=()=>clubNetworkBound()&&clubNetworkSession.user.id===userId&&trainingAgendaIdentity()===owner;
 const checkOwner=()=>{if(isOwner())return true;status.textContent='La connexion ou l’équipe active a changé. Fermez ce panneau puis reconnectez-vous.';return false;};
 function checkFields(){const invalid=[...grid.querySelectorAll('input,select')].find(control=>!control.checkValidity());if(invalid){status.textContent='Vérifiez le champ « '+invalid.getAttribute('aria-label')+' » : '+invalid.validationMessage;invalid.setAttribute('aria-invalid','true');panel.querySelector('.coach-fff-field-error')?.remove();const detail=el('small','coach-fff-field-error',invalid.validationMessage);detail.id='coach-fff-field-error';invalid.parentElement.append(detail);invalid.setAttribute('aria-describedby',detail.id);invalid.focus();return false;}return true;}
 form.addEventListener('input',event=>{event.target.removeAttribute('aria-invalid');event.target.removeAttribute('aria-describedby');event.target.parentElement?.querySelector('.coach-fff-field-error')?.remove();});
 form.addEventListener('invalid',event=>{status.textContent='Vérifiez le champ « '+(event.target.getAttribute('aria-label')||'à compléter')+' » : '+event.target.validationMessage;},true);
 for(const input of [category,gender,number,format,level,season])input.addEventListener('input',()=>{run++;chosen=null;url.value='';officialName.value='';results.replaceChildren();});
 url.oninput=()=>{chosen=null;};officialName.oninput=()=>{chosen=null;};
 search.onclick=async()=>{
  if(!checkOwner()||!checkFields())return;
  const currentRun=++run,signature=context();chosen=null;results.replaceChildren();search.disabled=true;status.textContent='Recherche dans les équipes officielles du Club démo…';
  const clubURL=(url.value.trim()||agendaFFFDefault).split('/equipe/')[0];
  if(!clubURL){status.textContent='Renseignez le lien FFF de votre club dans les options ci-dessous.';fallback.open=true;search.disabled=false;return;}
  try{
   const response=await clubNetworkRequest('/functions/v1/fff-standings',{method:'POST',body:{sourceURL:clubURL}});
   if(!isOwner()||currentRun!==run||signature!==context())return;
   const candidates=coachFFFCandidates(response?.html,clubURL,category.value);
   if(!candidates.length)throw Error('Aucune équipe lisible dans la page FFF.');
   const label=el('label','','Équipe officielle trouvée'),select=el('select');select.setAttribute('aria-label','Équipe officielle trouvée');select.append(new Option('Confirmer l’équipe exacte…',''),...candidates.map(c=>new Option(c.label,c.url)));label.append(select);results.append(label);
   select.onchange=()=>{chosen=candidates.find(c=>c.url===select.value)||null;if(chosen){url.value=chosen.url;officialName.value=chosen.label;}};
   status.textContent=candidates.length+' équipe(s) trouvée(s). Vérifiez la catégorie, le numéro et le championnat avant de confirmer.';
  }catch(error){if(isOwner()&&currentRun===run){status.textContent=homeFFFErrorMessage(error)+' Ouvrez la page officielle puis collez le lien de votre équipe ci-dessous.';fallback.open=true;const link=el('a','home-live-open','Ouvrir les équipes du club sur la FFF ↗');link.href=clubURL;link.target='_blank';link.rel='noopener noreferrer';results.append(link);}}
  finally{search.disabled=false;}
 };
 function entryFromForm(){
  if(!checkFields())return null;
  const rawURL=chosen?.url||url.value.trim(),sourceURL=rawURL?agendaFFFURL(rawURL):'',name=(chosen?.label||officialName.value).trim();
  if(rawURL&&!sourceURL){status.textContent='Le lien FFF n’est pas un lien d’équipe valide. Corrigez-le ou effacez-le pour enregistrer l’équipe sans liaison FFF.';fallback.open=true;url.focus();return null;}
  if(sourceURL&&!name){status.textContent='Indiquez le nom exact de l’équipe sur la FFF, ou effacez le lien pour l’associer plus tard.';fallback.open=true;officialName.focus();return null;}
  const [start,end]=season.value.split('-').map(Number);if(end!==start+1){status.textContent='La saison doit couvrir deux années consécutives.';return null;}
  const sameIdentity=!previous||(previous.number===Number(number.value)&&previous.gender===gender.value&&previous.format===format.value);
  const existing=canEditActive&&sameIdentity&&activeCoachTeam.id!=='unassigned'&&coachTeamNormalize(category.value)===coachTeamNormalize(activeCoachTeam.category)?activeCoachTeam:null;
  const entry={id:existing?.id||draftId,label:(category.value+(gender.value==='Féminin'?' Féminines':gender.value==='Mixte'?' Mixte':'')+(format.value==='Futsal'?' Futsal':'')+(Number(number.value)>1?' · Équipe '+number.value:'')).slice(0,60),category:category.value,team:club.value,fffProfile:{version:1,gender:gender.value,number:Number(number.value),format:format.value,level:level.value.trim(),season:season.value,officialName:name,sourceURL}};
  if(!coachFFFProfileValid(entry)){status.textContent='Vérifiez les informations de cette équipe.';return null;}
  if(pending.some(p=>p.id===entry.id||coachFFFIdentity(p)===coachFFFIdentity(entry)||sourceURL&&p.fffProfile.sourceURL===sourceURL&&p.fffProfile.season===season.value)){status.textContent='Cette équipe figure déjà dans votre sélection.';return null;}
  return entry;
 }
 function renderQueue(){
  queue.replaceChildren();queue.hidden=!pending.length;
  if(!pending.length){save.textContent='Confirmer et ouvrir mon équipe';return;}
  queue.append(el('h2','','Mes équipes · '+pending.length),el('p','hint','Choisissez l’équipe à ouvrir après l’enregistrement.'));
  for(const entry of pending){
   const row=el('div','coach-fff-queued-team'),label=el('label'),radio=el('input');radio.type='radio';radio.name='coach-fff-primary';radio.value=entry.id;radio.checked=entry.id===selectedId;radio.onchange=()=>{selectedId=entry.id;};
   label.append(radio,el('strong','',entry.label),el('span','',entry.fffProfile.level+' · '+(entry.fffProfile.officialName||'Liaison FFF à compléter')));
   const remove=el('button','export','Retirer');remove.type='button';remove.setAttribute('aria-label','Retirer '+entry.label+' de la sélection');remove.onclick=()=>{pending=pending.filter(p=>p.id!==entry.id);if(selectedId===entry.id)selectedId=pending[0]?.id||'';renderQueue();};row.append(label,remove);queue.append(row);
  }
  save.textContent='Enregistrer mes équipes et continuer';
 }
 function clearEntry(){
  run++;chosen=null;canEditActive=false;draftId='team-'+crypto.randomUUID();category.value='';number.value='1';level.value='';url.value='';officialName.value='';results.replaceChildren();fallback.open=false;category.focus();
 }
 another.onclick=()=>{
  if(!checkOwner())return;
  const entry=entryFromForm();if(!entry)return;
  pending.push(entry);if(!selectedId)selectedId=entry.id;renderQueue();clearEntry();status.textContent='Équipe ajoutée à votre sélection. Renseignez la suivante ou enregistrez vos équipes.';
 };
 renderQueue();
 const submit=async event=>{
  event.preventDefault();if(!checkOwner())return;
  let entries=[...pending];
  // The blank form after adding an entry does not block completing the batch.
  if(category.value||level.value||url.value||officialName.value||!entries.length){const entry=entryFromForm();if(!entry)return;entries.push(entry);}
  try{if(!flushCoachWorkspace()){status.textContent='La sauvegarde du travail ouvert bloque le changement d’équipe. Fermez ce panneau et vérifiez les champs de la séance ou du bilan.';return;}}catch{status.textContent='Le travail ouvert n’a pas pu être sauvegardé. Vérifiez le stockage et réessayez.';return;}
  const activeId=selectedId||entries[0].id;
  for(const control of form.querySelectorAll('input,select,button'))control.disabled=true;
  status.textContent='Enregistrement de vos équipes dans votre compte…';
  try{
   const user=await clubNetworkRequest('/auth/v1/user');if(!checkOwner()){for(const control of form.querySelectorAll('input,select,button'))control.disabled=false;return;}
   const saved=Array.isArray(user.user_metadata?.[coachFFFMetadataKey])?user.user_metadata[coachFFFMetadataKey].filter(coachFFFProfileValid):[];
   for(const entry of entries)if(saved.some(p=>p.id!==entry.id&&(coachFFFIdentity(p)===coachFFFIdentity(entry)||entry.fffProfile.sourceURL&&p.fffProfile.sourceURL===entry.fffProfile.sourceURL&&p.fffProfile.season===entry.fffProfile.season)))throw Error('Cette équipe FFF est déjà enregistrée dans votre compte.');
   const ids=new Set(entries.map(p=>p.id)),profiles=[...saved.filter(p=>!ids.has(p.id)),...entries];if(profiles.length>100)throw Error('100 équipes maximum.');
   await clubNetworkRequest('/auth/v1/user',{method:'PUT',body:{data:{[coachFFFMetadataKey]:profiles,stade_active_team_v1:activeId}}});
   if(!checkOwner()){for(const control of form.querySelectorAll('input,select,button'))control.disabled=false;return;}
   coachFFFApplyProfiles(profiles);sessionStorage.setItem(coachTeamSelectionKey,activeId);location.reload();
  }catch(error){status.textContent=error.message?.startsWith('Cette équipe')?error.message:error.status?'Équipes non enregistrées · HTTP '+error.status+(error.code?' · '+error.code:'')+' : '+clubNetworkMessage(error):['QuotaExceededError','SecurityError'].includes(error.name)?'Équipes sauvegardées dans le compte, mais stockage de cet appareil indisponible. Libérez de l’espace puis rechargez.':'Équipes non enregistrées. Vérifiez la connexion puis réessayez.';for(const control of form.querySelectorAll('input,select,button'))control.disabled=false;}
 };
 save.onclick=submit;form.onsubmit=submit;
}
document.addEventListener('DOMContentLoaded',()=>{
 const clear=clubNetworkClear;clubNetworkClear=function(...args){document.getElementById('coach-fff-setup')?.remove();return clear.apply(this,args);};
 const oldAdd=coachTeamAddDialog;coachTeamAddDialog=function(edit=false,targetTeam=activeCoachTeam){if(clubNetworkBound())return coachFFFOpen({add:!edit});return oldAdd(edit,targetTeam);};
});
