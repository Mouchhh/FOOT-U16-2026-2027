// Initial team setup is stored in the authenticated coach's Supabase metadata.
const coachFFFMetadataKey='stade_team_profiles_v1';
let coachFFFEnsurePending=null;
function coachFFFProfileValid(profile){
 return profile&&coachTeamValid(profile)&&profile.id!=='unassigned'&&profile.fffProfile?.version===1&&['Masculin','Féminin','Mixte'].includes(profile.fffProfile.gender)&&['Football à 11','Football à 8','Futsal'].includes(profile.fffProfile.format)&&Number.isInteger(profile.fffProfile.number)&&profile.fffProfile.number>=1&&profile.fffProfile.number<=20&&/^\d{4}-\d{4}$/.test(profile.fffProfile.season)&&typeof profile.fffProfile.level==='string'&&profile.fffProfile.level.length<=80&&agendaFFFURL(profile.fffProfile.sourceURL)&&typeof profile.fffProfile.officialName==='string'&&profile.fffProfile.officialName.trim().length>0&&profile.fffProfile.officialName.length<=150;
}
function coachFFFSource(){return coachFFFProfileValid(activeCoachTeam)?activeCoachTeam.fffProfile.sourceURL:'';}
function coachFFFCandidates(html,sourceURL,category){
 if(typeof html!=='string'||html.length>4000000)throw Error('Page FFF invalide.');
 const page=new DOMParser().parseFromString(html,'text/html'),seen=new Set(),result=[];
 for(const link of page.querySelectorAll('a[href]')){
  let url;try{url=agendaFFFURL(new URL(link.getAttribute('href'),sourceURL).href);}catch{continue;}
  if(!url||seen.has(url))continue;
  const label=(link.textContent||link.getAttribute('aria-label')||link.getAttribute('title')||'').replace(/\s+/g,' ').trim().slice(0,150);
  if(!label)continue;
  const key=coachTeamNormalize(label+' '+decodeURIComponent(url)),wanted=coachTeamNormalize(category);
  const matches=/^u\d+$/.test(wanted)?new RegExp('(?:^|[^a-z0-9])'+wanted+'(?:[^0-9]|$)').test(key):key.includes(wanted);
  if(!matches)continue;
  seen.add(url);result.push({url,label});
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
 const form=el('form'),head=el('div','coach-fff-heading'),title=el('h1','',add?'Ajouter mon équipe':'Bienvenue · choisissons votre équipe');title.id='coach-fff-title';
 const later=el('button','export','Plus tard');later.type='button';later.onclick=()=>panel.remove();head.append(title,later);form.append(head,el('p','','Précisez votre groupe, puis confirmez son équipe officielle FFF. Vos autres équipes et leurs données restent séparées.'));
 const grid=el('div','coach-fff-fields');form.append(grid);
 function field(label,type,value,options){const wrap=el('label','',label),input=el(options?'select':'input');if(options)input.append(...options.map(v=>new Option(v,v)));else input.type=type;input.value=value;input.required=true;input.setAttribute('aria-label',label);if(!options)input.maxLength=80;wrap.append(input);grid.append(wrap);return input;}
 const previous=!add&&coachFFFProfileValid(activeCoachTeam)?activeCoachTeam.fffProfile:null;
 const now=new Date(),year=now.getMonth()>=6?now.getFullYear():now.getFullYear()-1;
 const club=field('Club','text','Stade Mayennais');club.readOnly=true;
 const category=field('Catégorie','text',add?'':activeCoachTeam.category||'', ['U6','U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19','U20','Seniors','Vétérans']);category.prepend(new Option('Choisir…',''));if(add||!activeCoachTeam.category)category.value='';
 const gender=field('Groupe','text',previous?.gender||'Masculin',['Masculin','Féminin','Mixte']);
 const number=field('Numéro de l’équipe','number',String(previous?.number||1));number.min='1';number.max='20';
 const format=field('Pratique','text',previous?.format||'Football à 11',['Football à 11','Football à 8','Futsal']);
 const level=field('Championnat / niveau','text',previous?.level||'');level.placeholder='Ex. Départementale 1';
 const season=field('Saison','text',previous?.season||year+'-'+(year+1));season.pattern='[0-9]{4}-[0-9]{4}';
 const search=el('button','primary','Rechercher mon équipe sur la FFF');search.type='button';
 const status=el('p','hint');status.setAttribute('role','status');const results=el('div','coach-fff-results');
 const fallback=el('details'),summary=el('summary','','J’ai le lien officiel de mon équipe');fallback.append(summary);
 const urlLabel=el('label','','Lien de l’équipe FFF'),url=el('input');url.type='url';url.value=previous?.sourceURL||'';url.setAttribute('aria-label','Lien de l’équipe FFF');url.placeholder='https://epreuves.fff.fr/competition/club/…/equipe/…/saison';urlLabel.append(url);
 const nameLabel=el('label','','Nom exact de l’équipe sur la FFF'),officialName=el('input');officialName.maxLength=150;officialName.value=previous?.officialName||'';officialName.setAttribute('aria-label','Nom exact de l’équipe sur la FFF');nameLabel.append(officialName);
 fallback.append(urlLabel,nameLabel);
 const save=el('button','primary','Confirmer et ouvrir mon équipe');save.type='submit';
 form.append(search,status,results,fallback,save);panel.append(form);document.body.append(panel);category.focus();
 let chosen=null,run=0;
 const context=()=>JSON.stringify([category.value,gender.value,number.value,format.value,level.value,season.value]);
 const isOwner=()=>clubNetworkBound()&&clubNetworkSession.user.id===userId&&trainingAgendaIdentity()===owner;
 for(const input of [category,gender,number,format,level,season])input.addEventListener('input',()=>{run++;chosen=null;url.value='';officialName.value='';results.replaceChildren();});
 url.oninput=()=>{chosen=null;};officialName.oninput=()=>{chosen=null;};
 search.onclick=async()=>{
  if(!form.reportValidity())return;
  const currentRun=++run,signature=context();chosen=null;results.replaceChildren();search.disabled=true;status.textContent='Recherche dans les équipes officielles du Stade Mayennais…';
  const clubURL=agendaFFFDefault.split('/equipe/')[0];
  try{
   const response=await clubNetworkRequest('/functions/v1/fff-standings',{method:'POST',body:{sourceURL:clubURL}});
   if(!isOwner()||currentRun!==run||signature!==context())return;
   const candidates=coachFFFCandidates(response?.html,clubURL,category.value);
   if(!candidates.length)throw Error('Aucune équipe lisible dans la page FFF.');
   const label=el('label','','Équipe officielle trouvée'),select=el('select');select.setAttribute('aria-label','Équipe officielle trouvée');select.append(new Option('Confirmer l’équipe exacte…',''),...candidates.map(c=>new Option(c.label,c.url)));label.append(select);results.append(label);
   select.onchange=()=>{chosen=candidates.find(c=>c.url===select.value)||null;if(chosen){url.value=chosen.url;officialName.value=chosen.label;}};
   status.textContent=candidates.length+' équipe(s) trouvée(s). Vérifiez la catégorie, le numéro et le championnat avant de confirmer.';
  }catch{if(isOwner()&&currentRun===run){status.textContent='La FFF ne permet pas la recherche pour le moment. Ouvrez sa page officielle puis collez le lien de votre équipe ci-dessous.';fallback.open=true;const link=el('a','home-live-open','Ouvrir les équipes du club sur la FFF ↗');link.href=clubURL;link.target='_blank';link.rel='noopener noreferrer';results.append(link);}}
  finally{search.disabled=false;}
 };
 form.onsubmit=async event=>{
  event.preventDefault();if(!form.reportValidity()||!isOwner())return;
  const sourceURL=agendaFFFURL(chosen?.url||url.value),name=(chosen?.label||officialName.value).trim();
  if(!sourceURL||!name){status.textContent='Sélectionnez votre équipe trouvée sur la FFF ou renseignez son lien officiel et son nom exact.';fallback.open=true;return;}
  const [start,end]=season.value.split('-').map(Number);if(end!==start+1){status.textContent='La saison doit couvrir deux années consécutives.';return;}
  if(!flushCoachWorkspace()){status.textContent='Enregistrez votre travail actuel avant de changer d’équipe.';return;}
  save.disabled=true;search.disabled=true;status.textContent='Enregistrement de votre équipe dans votre compte…';
  try{
   const sameIdentity=!previous||(previous.number===Number(number.value)&&previous.gender===gender.value&&previous.format===format.value);
   const existing=!add&&sameIdentity&&activeCoachTeam.id!=='unassigned'&&coachTeamNormalize(category.value)===coachTeamNormalize(activeCoachTeam.category)?activeCoachTeam:null;
   const entry={id:existing?.id||'team-'+crypto.randomUUID(),label:(category.value+(gender.value==='Féminin'?' Féminines':gender.value==='Mixte'?' Mixte':'')+(format.value==='Futsal'?' Futsal':'')+(Number(number.value)>1?' · Équipe '+number.value:'')).slice(0,60),category:category.value,team:club.value,fffProfile:{version:1,gender:gender.value,number:Number(number.value),format:format.value,level:level.value.trim(),season:season.value,officialName:name,sourceURL}};
   if(!coachFFFProfileValid(entry))throw Error('Invalid team');
   const user=await clubNetworkRequest('/auth/v1/user');if(!isOwner())return;
   const saved=Array.isArray(user.user_metadata?.[coachFFFMetadataKey])?user.user_metadata[coachFFFMetadataKey].filter(coachFFFProfileValid):[];
   if(saved.some(p=>p.id!==entry.id&&p.fffProfile.sourceURL===sourceURL&&p.fffProfile.season===season.value))throw Error('Cette équipe FFF est déjà enregistrée dans votre compte.');
   const profiles=[...saved.filter(p=>p.id!==entry.id),entry];if(profiles.length>100)throw Error('100 équipes maximum.');
   await clubNetworkRequest('/auth/v1/user',{method:'PUT',body:{data:{[coachFFFMetadataKey]:profiles,stade_active_team_v1:entry.id}}});
   if(!isOwner())return;
   coachFFFApplyProfiles(profiles);sessionStorage.setItem(coachTeamSelectionKey,entry.id);location.reload();
  }catch(error){status.textContent=error.message?.startsWith('Cette équipe')?error.message:'Équipe non enregistrée. Vérifiez la connexion puis réessayez.';save.disabled=false;search.disabled=false;}
 };
}
document.addEventListener('DOMContentLoaded',()=>{
 const clear=clubNetworkClear;clubNetworkClear=function(...args){document.getElementById('coach-fff-setup')?.remove();return clear.apply(this,args);};
 const oldAdd=coachTeamAddDialog;coachTeamAddDialog=function(edit=false,targetTeam=activeCoachTeam){if(clubNetworkBound())return coachFFFOpen({add:!edit});return oldAdd(edit,targetTeam);};
});
