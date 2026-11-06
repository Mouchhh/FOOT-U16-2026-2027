// Public-source snapshots only. Never infer a whole league table from this club's partial results.
const homeFFFKey='vestiaire-fff-standings';coachTeamWorkspaceKeys.add(homeFFFKey);
function homeFFFSource(value) {
  try{const u=new URL(value);return u.protocol==='https:'&&(u.hostname==='fff.fr'||u.hostname.endsWith('.fff.fr'))&&!u.username&&!u.password?u.href:'';}catch{return '';}
}
function homeFFFDefaultURL(){return activeCoachTeam.fffProfile?(typeof coachFFFSource==='function'?coachFFFSource():''):agendaFFFRead().url||'';}
function homeFFFCompetition(){return activeCoachTeam.fffProfile?activeCoachTeam.label+' · '+activeCoachTeam.fffProfile.level:activeCoachTeam.category||'FFF';}
function homeFFFNormalize(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function homeFFFValidate(data){
  return data?.version===1&&Number.isFinite(Date.parse(data.importedAt))&&homeFFFSource(data.sourceURL)&&typeof data.competition==='string'&&data.competition.length<=200&&typeof data.teamName==='string'&&data.teamName.length<=150&&Array.isArray(data.rows)&&data.rows.length>0&&data.rows.length<=80&&new Set(data.rows.map(r=>r.rank)).size===data.rows.length&&data.rows.every(r=>r&&Number.isInteger(r.rank)&&r.rank>0&&r.rank<=100&&typeof r.name==='string'&&r.name.trim()&&r.name.length<=150&&['points','played','wins','draws','losses','goalsFor','goalsAgainst','goalDifference'].every(k=>r[k]===null||Number.isInteger(r[k])&&Math.abs(r[k])<=10000)&&(!r.logo||homeFFFSource(r.logo))&&['played','wins','draws','losses','goalsFor','goalsAgainst'].every(k=>r[k]===null||r[k]>=0))&&Array.isArray(data.matches)&&data.matches.length<=1000&&data.matches.every(m=>trainingDateValid(m.date)&&typeof m.home==='string'&&m.home.length<=150&&typeof m.away==='string'&&m.away.length<=150&&Number.isInteger(m.goalsHome)&&m.goalsHome>=0&&m.goalsHome<100&&Number.isInteger(m.goalsAway)&&m.goalsAway>=0&&m.goalsAway<100);
}
function homeFFFRead(){try{const data=JSON.parse(coachStorageGet(homeFFFKey)||'null');const source=typeof coachFFFSource==='function'?coachFFFSource():'';return homeFFFValidate(data)&&(!activeCoachTeam.fffProfile||source&&data.sourceURL===source)?data:null;}catch{return null;}}
function homeFFFParse(text,{sourceURL,teamName,competition}) {
  if(text.length>4000000)throw Error('Page trop volumineuse (4 Mo maximum).');
  if(!homeFFFSource(sourceURL))throw Error('Indiquez le lien officiel FFF de cette équipe ou de son championnat.');
  const number=value=>/^[-+]?\d+$/.test(String(value??'').trim())?Number(value):null;
  let rows=[],matches=[];
  if(text.trim().startsWith('{')) {
    const parsed=JSON.parse(text);rows=parsed.rows;matches=parsed.matches||[];
    if(!Array.isArray(rows))throw Error('Le fichier doit contenir le classement dans « rows ».');
  } else {
    const document=new DOMParser().parseFromString(text,'text/html');
    const table=[...document.querySelectorAll('table')].find(t=>/pts|points/i.test(t.textContent)&&/quipe|club/i.test(t.textContent));
    const lines=table?[...table.rows].map(row=>[...row.cells]):text.trim().split(/\r?\n/).map(line=>line.split(line.includes('\t')?'\t':';').map(textContent=>({textContent})));
    const headerIndex=lines.findIndex(line=>line.some(cell=>['pts','points'].includes(homeFFFNormalize(cell.textContent))));
    if(headerIndex<0)throw Error('Classement non reconnu. Importez la page HTML FFF enregistrée ou collez son tableau avec les en-têtes.');
    const headers=lines[headerIndex].map(c=>homeFFFNormalize(c.textContent));
    const aliases={rank:['rg','rang','rangclassement','pl','place','position','classement'],name:['equipe','equipes','club','clubs'],points:['pts','points'],played:['j','joues','joue','mj','matchsjoues'],wins:['g','victoires','gagnes'],draws:['n','nuls'],losses:['p','perdus','defaites'],goalsFor:['bp','butsmarques','butspour'],goalsAgainst:['bc','butsencaisses','butscontre'],goalDifference:['diff','dif','difference','diffbuts','db']};
    const position=Object.fromEntries(Object.entries(aliases).map(([key,values])=>[key,headers.findIndex(v=>values.includes(v))]));
    if(position.name<0||position.points<0)throw Error('Colonnes Équipe et Points introuvables.');
    rows=lines.slice(headerIndex+1).filter(line=>line.length>=headers.length).map(line=>{
      const cell=key=>line[position[key]],value=key=>cell(key)?.textContent.trim().replace(/\s+/g,' ')||'';
      const team=cell('name'),image=team?.querySelector?.('img');let logo='';
      try{logo=homeFFFSource(new URL(image?.getAttribute('src')||image?.getAttribute('data-src')||'',sourceURL).href);}catch{}
      return {rank:number(value('rank')||line[0]?.textContent),name:value('name'),logo:image?logo:'',...Object.fromEntries(Object.keys(aliases).filter(k=>!['rank','name'].includes(k)).map(k=>[k,number(value(k))]))};
    }).filter(row=>row.rank&&row.name);
  }
  rows=rows.map(row=>({...row,logo:homeFFFSource(row.logo)||'',...Object.fromEntries(['points','played','wins','draws','losses','goalsFor','goalsAgainst','goalDifference'].map(k=>[k,number(row[k])]))}));
  for(const row of rows)if(row.goalDifference===null&&row.goalsFor!==null&&row.goalsAgainst!==null)row.goalDifference=row.goalsFor-row.goalsAgainst;
  const data={version:1,sourceURL:homeFFFSource(sourceURL),teamName:teamName.trim(),competition:competition.trim(),importedAt:new Date().toISOString(),rows:rows.sort((a,b)=>a.rank-b.rank),matches};
  if(!homeFFFValidate(data))throw Error('Le classement contient des lignes invalides. Aucune donnée remplacée.');
  return data;
}
function homeFFFOpponent(event){
  const fixture=event?.fff;if(fixture?.opponent)return fixture.opponent;
  if(fixture?.home&&fixture?.away){
    const own=[activeCoachTeam.team,state.team,agendaClubSchedule()?.team].filter(Boolean).map(homeFFFNormalize);
    if(own.includes(homeFFFNormalize(fixture.home)))return fixture.away;
    if(own.includes(homeFFFNormalize(fixture.away)))return fixture.home;
  }
  return event?.title?.split(' · ')[0]||'';
}
function homeFFFHistory(opponent,snapshot) {
  if(!opponent)return [];
  const key=homeFFFNormalize(opponent),own=homeFFFNormalize(snapshot?.teamName||activeCoachTeam.team||state.team),now=trainingAgendaNow().day;
  const same=value=>homeFFFNormalize(value)===key;
  const official=(snapshot?.matches||[]).filter(m=>m.date<=now&&(same(m.home)&&homeFFFNormalize(m.away)===own||same(m.away)&&homeFFFNormalize(m.home)===own)).map(m=>({...m,source:'FFF · import'}));
  const recorded=reportLibrary.filter(r=>reportValid(r)&&playerStatsOwns(r)&&documentCompletionIsCompleted('report',r)&&r.eventType!=='training'&&r.info.date<=now&&same(r.info.opponent)&&/^\d+$/.test(String(r.info.goalsFor))&&/^\d+$/.test(String(r.info.goalsAgainst))).map(r=>({date:r.info.date,home:r.info.team,away:r.info.opponent,goalsHome:Number(r.info.goalsFor),goalsAway:Number(r.info.goalsAgainst),source:'Bilan du coach'}));
  const seen=new Set();return [...official,...recorded].sort((a,b)=>b.date.localeCompare(a.date)).filter(m=>{if(seen.has(m.date))return false;seen.add(m.date);return true;}).slice(0,5);
}
function homeFFFImporter(card) {
  card.querySelector('#home-fff-import')?.remove();
  const current=homeFFFRead(),owner=trainingAgendaIdentity(),form=el('form');form.id='home-fff-import';
  const field=(title,type,value='')=>{const label=el('label','',title),input=el(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.value=value;input.setAttribute('aria-label',title);label.append(input);form.append(label);return input;};
  const source=field('Lien officiel FFF','url',current?.sourceURL||homeFFFDefaultURL());
  const team=field('Notre équipe dans le classement','text',activeCoachTeam.fffProfile?.officialName||current?.teamName||agendaClubSchedule()?.team||activeCoachTeam.team||'');
  const competition=field('Championnat','text',current?.competition||homeFFFCompetition());
  const paste=field('Classement FFF copié avec ses en-têtes','textarea');paste.rows=5;
  const file=field('Page FFF enregistrée ou fichier de classement','file');file.accept='.html,.htm,.csv,.txt,.json';
  const status=el('p','home-live-caption'),save=el('button','home-live-open','Importer le classement'),cancel=el('button','home-live-open','Annuler');cancel.type='button';cancel.onclick=()=>{form.remove();renderHomeWidgets();};
  form.append(status,save,cancel);form.onsubmit=async event=>{
    event.preventDefault();save.disabled=true;
    try{const text=file.files[0]?await file.files[0].text():paste.value;if(owner!==trainingAgendaIdentity())throw Error('L’équipe a changé. Rouvrez l’import.');const data=homeFFFParse(text,{sourceURL:source.value,teamName:team.value,competition:competition.value});coachStorageSet(homeFFFKey,JSON.stringify(data));renderHomeWidgets();}
    catch(error){status.textContent=error.message;save.disabled=false;}
  };card.append(form);source.focus();
}
function renderHomeFFF(snapshot) {
  const root=$('home-live-widgets');if(!root)return;
  const group=root.querySelector('.home-live-group');if(group){group.classList.add('home-live-group-strip');root.append(group);}
  const data=homeFFFRead(),card=el('article','home-live-card home-fff-ranking');card.append(el('h2','','Classement · '+(data?.competition||homeFFFCompetition())));if(activeCoachTeam.fffProfile)card.append(el('p','home-live-caption home-fff-team-context',activeCoachTeam.label+' · '+(activeCoachTeam.fffProfile.officialName||'liaison FFF à compléter')));
  const actions=el('div','home-fff-actions'),source=el('a','home-live-open','Ouvrir la FFF ↗');source.href=data?.sourceURL||homeFFFDefaultURL();source.hidden=!homeFFFDefaultURL()&&!data;source.target='_blank';source.rel='noopener noreferrer';
  const importButton=el('button','home-live-open',data?'Mettre à jour le classement':'Importer le classement FFF');importButton.type='button';importButton.hidden=!!activeCoachTeam.fffProfile&&!homeFFFDefaultURL();importButton.onclick=()=>homeFFFImporter(card);actions.append(source,importButton);if(typeof coachFFFOpen==='function'&&clubNetworkBound()){const setup=el('button','home-live-open','Mon équipe FFF');setup.type='button';setup.onclick=()=>coachFFFOpen();actions.append(setup);}
  if(data){
    const own=homeFFFNormalize(data.teamName),row=data.rows.find(r=>homeFFFNormalize(r.name)===own);
    if(row)card.append(el('strong','home-live-value',row.rank+'e · '+row.points+' pts'));
    else card.append(el('p','home-live-caption','Équipe à identifier dans le classement importé.'));
    const scroll=el('div','home-fff-table-wrap');scroll.tabIndex=0;scroll.setAttribute('aria-label','Classement FFF complet');
    const table=el('table'),head=el('thead'),header=el('tr');
    for(const label of ['Rg','Équipe','Pts','J','G','N','P','BP','BC','Diff.']){const th=el('th','',label);th.scope='col';header.append(th);}head.append(header);table.append(head);const body=el('tbody');
    for(const item of data.rows){const tr=el('tr');if(homeFFFNormalize(item.name)===own)tr.classList.add('home-fff-own');tr.append(el('td','',item.rank));const name=el('td','home-fff-club'),fallback=el('span','home-fff-logo',item.name.split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase());
      if(item.logo||homeFFFNormalize(item.name)===own){const image=el('img');image.src=item.logo||'assets/causerie-logo.jpeg';image.alt='Écusson de '+item.name;image.loading='lazy';image.referrerPolicy='no-referrer';image.onerror=()=>{image.remove();fallback.hidden=false;};fallback.hidden=true;name.append(image);}name.append(fallback,document.createTextNode(item.name));tr.append(name);
      for(const key of ['points','played','wins','draws','losses','goalsFor','goalsAgainst','goalDifference'])tr.append(el('td','',item[key]===null?'—':key==='goalDifference'&&item[key]>0?'+'+item[key]:item[key]));body.append(tr);
    }table.append(body);scroll.append(table);card.append(scroll,el('p','home-live-caption',(data.acquisition==='automatic'?'FFF vérifiée le ':'Données FFF importées le ')+new Date(data.importedAt).toLocaleString('fr-FR')+' · les points officiels sont conservés.'));
  }else card.append(el('p','home-live-caption',activeCoachTeam.fffProfile&&!homeFFFDefaultURL()?'Équipe enregistrée. Associez son lien officiel depuis « Mon équipe FFF » pour afficher le classement.':'Classement officiel à importer. Aucune position ni différence de buts estimée à partir de résultats incomplets.'));
  const refreshStatus=homeFFFRefreshStatus.get(trainingAgendaIdentity());if(refreshStatus){const message=el('p','home-live-caption',refreshStatus);message.setAttribute('role','status');card.append(message);}card.append(actions);root.prepend(card);
  const opponent=homeFFFOpponent(snapshot?.match),form=root.querySelector('.home-live-form');
  if(form){form.append(el('h3','','Face à '+(opponent||'l’adversaire à venir')));const history=homeFFFHistory(opponent,data);
    if(history.length)for(const match of history)form.append(el('p','home-live-caption',match.date.split('-').reverse().join('/')+' · '+match.home+' '+match.goalsHome+'–'+match.goalsAway+' '+match.away+' · '+match.source));
    else form.append(el('p','home-live-caption',opponent?'Aucune confrontation connue dans les données FFF importées et les bilans du coach.':'Le prochain adversaire apparaîtra depuis l’agenda.'));
  }
}
document.addEventListener('DOMContentLoaded',()=>{
  const render=renderHomeWidgets;renderHomeWidgets=function(){const snapshot=render();renderHomeFFF(snapshot);return snapshot;};
  if(document.body.classList.contains('home-mode'))renderHomeWidgets();
});

// One request per login/context; refreshes never overwrite another coach/team.
const homeFFFRefreshes=new Map(),homeFFFRefreshStatus=new Map();
function homeFFFErrorMessage(error){
 const messages={fff_timeout:'La récupération FFF a dépassé le délai autorisé.',fff_network_error:'Connexion impossible entre Supabase et la FFF.',fff_redirect_not_allowed:'La FFF redirige vers une page non prise en charge.',fff_too_many_redirects:'La page FFF renvoie trop de redirections.',fff_empty_response:'La FFF a renvoyé une page vide.',fff_page_too_large:'La page FFF dépasse la taille autorisée.',configuration_missing:'Configuration du relais Supabase incomplète.',fff_markup_unrecognized:'Page FFF reçue, mais aucun classement HTML exploitable : les données peuvent être chargées séparément.',fff_relay_missing:'Le relais Supabase fff-standings est introuvable.',auth_service_unavailable:'La connexion au compte doit être vérifiée.'};
 const message=messages[error?.code]||(['fff_http_error','fff_upstream_error'].includes(error?.code)?'La FFF a renvoyé HTTP '+(Number.isInteger(error.upstreamStatus)?error.upstreamStatus:'en erreur')+'.':error?.status===404?'Le relais Supabase fff-standings est introuvable.':'Actualisation FFF indisponible');
 return message+(error?.reference?' Réf. '+error.reference:'');
}
async function homeFFFRefresh(){
 if(typeof clubNetworkBound!=='function'||!clubNetworkBound())return;
 const owner=trainingAgendaIdentity(),current=homeFFFRead(),sourceURL=current?.sourceURL||homeFFFDefaultURL();
 if(!sourceURL)return;
 if(homeFFFRefreshes.has(owner))return homeFFFRefreshes.get(owner);
 const initial=coachStorageGet(homeFFFKey);
 const task=(async()=>{
  homeFFFRefreshStatus.set(owner,'Actualisation FFF en cours…');renderHomeWidgets();
  try{
   const response=await clubNetworkRequest('/functions/v1/fff-standings',{method:'POST',body:{sourceURL}});
   if(owner!==trainingAgendaIdentity()||!clubNetworkBound())return;
   if(response?.sourceURL!==sourceURL||typeof response.html!=='string'||!Number.isFinite(Date.parse(response.fetchedAt)))throw Error('Invalid response');
   let data;try{data=homeFFFParse(response.html,{sourceURL,teamName:activeCoachTeam.fffProfile?.officialName||current?.teamName||agendaClubSchedule()?.team||activeCoachTeam.team||'',competition:activeCoachTeam.fffProfile?homeFFFCompetition():current?.competition||homeFFFCompetition()});}catch{const error=new Error('FFF markup');error.code='fff_markup_unrecognized';throw error;}
   // A manual import made while the request was pending takes precedence.
   if(coachStorageGet(homeFFFKey)!==initial)return;
   data.fetchedAt=response.fetchedAt;data.importedAt=response.fetchedAt;data.acquisition='automatic';
   coachStorageSet(homeFFFKey,JSON.stringify(data));homeFFFRefreshStatus.set(owner,'Classement FFF actualisé.');
  }catch(error){if(owner===trainingAgendaIdentity())homeFFFRefreshStatus.set(owner,homeFFFErrorMessage(error)+(homeFFFRead()?' · dernier classement conservé.':' · aucun classement récupéré pour cette équipe.'));}
  finally{homeFFFRefreshes.delete(owner);if(owner===trainingAgendaIdentity())renderHomeWidgets();}
 })();
 homeFFFRefreshes.set(owner,task);return task;
}
document.addEventListener('club-session-ready',async()=>{if(typeof coachFFFEnsure!=='function'||await coachFFFEnsure())homeFFFRefresh();});
