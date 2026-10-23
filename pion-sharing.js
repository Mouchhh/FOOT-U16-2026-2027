// Standalone explanations travel through the existing versioned tactical documents.
// They contain no team composition, player photos or report/session data.
function simpleExplanationPreview(payload){
 const entry=payload.pionExplanation,root=el('article','report-document');root.append(el('h2','',entry.title),el('p','hint','Explication · pions et flèches · lecture seule. Créez une copie pour la modifier ou lire son animation.'));
 const select=el('select'),label=el('label','','Étape à consulter'),canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;canvas.style='width:100%;height:auto';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Pions et flèches de '+entry.title);
 const count=entry.state.scenario==='custom'?entry.state.customSteps.length:simpleScenario(entry.state).steps.length;
 for(let i=0;i<count;i++){const option=el('option','','Étape '+(i+1));option.value=String(i);select.append(option);}
 function draw(){const n=Number(select.value);let snapshot=structuredClone(entry.state);if(snapshot.scenario==='custom')snapshot=customRestoreSnapshot(snapshot,n);else for(let i=0;i<n;i++){snapshot.step=i;for(const action of simpleActions(snapshot)){if(action.id==='ball')Object.assign(snapshot.ball,{x:action.x,y:action.y});else{const token=snapshot.tokens.find(t=>t.id===action.id);if(token)Object.assign(token,{x:action.x,y:action.y});}}}snapshot.step=n;renderMedia(canvas,snapshot,false,payload.category);}
 select.onchange=draw;label.append(select);root.append(label,canvas);draw();return root;
}
function simpleExplanationOpen(entry){
 stopAnimation(true);
 if(!workspaceReplaceDraft('explanation',entry.state))return false;
 if(typeof clubNetworkBound==='function'&&clubNetworkBound()&&!clubNetworkPending('composition',entry.id)){const cached=clubNetworkCachedVersions.get('composition:'+entry.id),saved=saves.find(s=>s.state.documentId===entry.id)?.state.pionExplanation;if(cached&&JSON.stringify(saved)===JSON.stringify(entry))clubNetworkRememberVersion('composition',entry.id,cached.revision,cached.id);}
 $('animation-speed').value=entry.speed;$('animation-choice').value=entry.choice;
 $('view-pitch').click();$('mode-simple').click();workspaceFlows.terrain.go(0);renderSimple();return true;
}
function simpleExplanationImport(row,forceCopy=false){
 const own=row.owner_id===clubNetworkSession.user.id&&!forceCopy,payload=structuredClone(row.payload),entry=payload.pionExplanation;
 if(own&&clubNetworkPending('composition',row.source_id))return notify('Votre version locale a un envoi en attente ou un conflit. Terminez le partage ou consultez la version distante puis créez une copie.');
 if(!confirm(own?'Ouvrir cette explication ? Le tableau courant restera récupérable dans Brouillons & récupération.':'Créer votre copie de cette explication ? Les pions, flèches et étapes seront conservés ; l’original du collègue restera intact.'))return;
 if(!own){if(simpleLibrary.length>=200)return notify('200 explications maximum. Supprimez une ancienne explication avant de créer cette copie.');entry.id=crypto.randomUUID();entry.title=('Copie · '+entry.title).slice(0,100);entry.updatedAt=new Date().toISOString();entry.state.sequenceId=entry.id;entry.state.sequenceTitle=entry.title;simpleCommitLibrary([entry,...simpleLibrary]);}
 else{clubNetworkSetLibrary('composition',[payload,...clubNetworkLibrary('composition').filter(p=>p.documentId!==row.source_id)]);clubNetworkCachedVersions.set('composition:'+row.source_id,{id:row.id,revision:row.revision});clubNetworkRememberVersion('composition',row.source_id,row.revision,row.id);}
 if(simpleExplanationOpen(entry)){notify(own?'Explication ouverte.':'Copie créée dans vos explications · partage en attente de confirmation.');$('club-network-preview').close();}
 clubNetworkRenderSources();
}
function clubNetworkKindMatches(row,kind){if(!kind)return true;if(kind==='explanation')return row.kind==='composition'&&row.title.startsWith('Explication · ');return row.kind===kind&&(kind!=='composition'||!row.title.startsWith('Explication · '));}
document.addEventListener('DOMContentLoaded',()=>{
 const option=el('option','','Explications · pions');option.value='explanation';$('club-network-kind').append(option);
 const button=$('simple-sequence-save');button.textContent='Enregistrer l’explication';
 const club=el('button','export','Voir les explications du club');club.id='simple-sequence-club';club.type='button';club.onclick=()=>{if(!clubNetworkBound())return clubNetworkRequestPrivate();$('view-club-network').click();workspaceFlows.club.go(1);$('club-network-kind').value='explanation';$('club-network-kind').dispatchEvent(new Event('change'));};button.parentElement.append(club);
});
