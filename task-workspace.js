// Navigation par tâches : réutilise les mêmes documents, contrôles et sauvegardes.
document.addEventListener('DOMContentLoaded',()=>{
 const nav=document.querySelector('.app-navigation'),labels={'view-home':'Accueil','view-pitch':'Match','view-training':'Séances','view-coach-agenda':'Agenda','view-reports':'Bilans','view-club-network':'Club','workspace-squad-entry':'Votre effectif'};
 const before=[...document.querySelectorAll('[id]')].map(e=>e.id);
 for(const [id,label]of Object.entries(labels))if($(id))$(id).textContent=label;
 for(const section of homeSections){section.title=labels[section.button];}
 document.querySelectorAll('#home-sections .home-section-card strong').forEach((node,i)=>{node.textContent=homeSections[i].title;});
 const assistant=$('club-assistant-open');assistant.textContent='Assistant';assistant.title='El crakito du club';
 const strip=el('div','task-section-navigation');strip.id='task-section-navigation';strip.setAttribute('role','group');nav.append(strip);
 const terrain=workspaceFlows.terrain,causerie=document.querySelector('#terrain-page-1 .terrain-team-section'),form=$('match-plan-form'),summary=document.querySelector('.match-plan-card'),settings=document.querySelector('.settings');
 const settingsDrawer=el('details','flow-disclosure task-match-settings');settingsDrawer.id='task-match-settings';settingsDrawer.append(el('summary','','Réglages du match · équipe, terrain et maillots'));
 settings.before(settingsDrawer);settingsDrawer.append(settings);
 const brief=el('section','task-causerie');brief.id='task-causerie';const summaryDrawer=el('details','task-causerie-summary');summaryDrawer.append(el('summary','','Repères du match & notes existantes'),summary);brief.append(summaryDrawer,form);causerie.prepend(brief);
 if($('personal-canva'))brief.append($('personal-canva'));
 if($('personal-canva-download'))brief.append($('personal-canva-download'));
 $('match-plan-heading').textContent='Repères du match';$('match-plan-dialog-title').textContent='Ma causerie';form.querySelector('.eyebrow').textContent='MATCH · CAUSERIE';
 $('match-plan-close').textContent='Retour au tableau';$('match-plan-close').className='export';$('match-plan-close').setAttribute('aria-label','Retour au tableau du match');$('match-plan-close').onclick=()=>terrain.go(0);
 const go=(parent,action)=>workspaceNavigation.run(parent,action);
 const composition=()=>{if(activateTerrainBoard('composition'))terrain.go(0);};
 const tactical=()=>{if(document.body.classList.contains('simple-mode'))terrain.go(0);else if(activateTerrainBoard('plan'))terrain.go(0);};
 const talk=()=>{if(activateTerrainBoard('composition')){terrain.go(1);renderMatchPreparation();}};
 $('match-plan-open').textContent='Reprendre la rédaction';$('match-plan-open').onclick=()=>go('view-pitch',()=>{if(document.body.classList.contains('simple-mode'))activateTerrainBoard('composition');terrain.go(1);renderMatchPreparation();$('match-plan-context').focus({preventScroll:false});});
 const prepare=()=>{$('training-prepare-tab').click();trainingWizard.go(trainingWizard.step());};
 const report=key=>{reportTab=key;renderReportTabs();renderReportContent();};
 let last='',frame=0;
 const section=()=>document.body.classList.contains('squad-mode')?'workspace-squad-entry':document.body.classList.contains('home-mode')?'view-home':document.body.classList.contains('training-mode')?'view-training':document.body.classList.contains('reports-mode')?'view-reports':document.body.classList.contains('coach-agenda-mode')?'view-coach-agenda':document.body.classList.contains('club-network-mode')?'view-club-network':'view-pitch';
 function refresh(){
  frame=0;const parent=section(),simple=document.body.classList.contains('simple-mode'),kind=terrainBoardKind,index=terrain.index(),trainingPanel=!$('training-library-page').hidden?'library':!$('training-catalogue-drawer').hidden?'bible':'prepare';
  const counter=document.querySelector('#terrain-flow>.flow-footer>span');if(counter)counter.textContent=index===2?'Enregistrer / exporter':index===1&&!simple?'Causerie':simple?'Tactique · animation':kind==='plan'?'Tactique':'Composition';
  $('terrain-next').textContent=index===0?(simple?'Consignes de l’animation →':'Ouvrir la causerie →'):index===1?'Enregistrer / exporter →':'Enregistrer';
  $('terrain-previous').textContent=index===2?(simple?'← Consignes de l’animation':'← Causerie'):'← Retour au tableau';
  const focusId=strip.contains(document.activeElement)?document.activeElement.id:null;
  const key=JSON.stringify([parent,index,simple,kind,trainingPanel,trainingWizard.step(),reportTab,workspaceFlows.home.index(),workspaceFlows.agenda.index(),workspaceFlows.club.index()]);if(key===last)return;last=key;strip.replaceChildren();strip.setAttribute('aria-label','Rubriques · '+labels[parent]);
  const items=[];const add=(id,label,action,selected)=>items.push({id,label,action,selected});
  if(parent==='view-pitch'){
   add('task-match-composition','Composition',composition,index!==1&&!simple&&kind==='composition');
   add('task-match-tactics','Tactique',tactical,simple||index!==1&&kind==='plan');
   add('task-match-causerie','Causerie',talk,index===1&&!simple);
  }else if(parent==='view-training'){
   add('task-training-prepare','Préparer ma séance',prepare,trainingPanel==='prepare');add('task-training-bible','Bible des exercices',()=>trainingWizard.openCatalogue(),trainingPanel==='bible');add('task-training-library','Mes séances',()=>$('training-library-tab').click(),trainingPanel==='library');add('task-training-create','Créer un exercice',()=>{prepare();trainingWizard.go(3);openCustomTrainingExercise();},false);
  }else if(parent==='view-home'){
   add('task-home-dashboard','Tableau de bord',()=>workspaceFlows.home.go(0),workspaceFlows.home.index()===0);add('task-home-coaches','Éducateurs',()=>workspaceFlows.home.go(1),workspaceFlows.home.index()===1);
  }else if(parent==='view-coach-agenda'){
   add('task-agenda-calendar','Calendrier',()=>workspaceFlows.agenda.go(1),workspaceFlows.agenda.index()===1);add('task-agenda-overview','Vue d’ensemble',()=>workspaceFlows.agenda.go(0),workspaceFlows.agenda.index()===0);
  }else if(parent==='view-reports'){
   for(const [id,label]of Object.entries({general:'Le match',sport:'Analyse',players:'Joueurs',plan:'Plan d’action',preview:'Synthèse'}))add('task-report-'+id,label,()=>report(id),reportTab===id||id==='sport'&&reportTab==='human');
  }else if(parent==='view-club-network'){
   for(const [i,label]of ['Éducateurs','Documents partagés','Mon compte'].entries())add('task-club-'+i,label,()=>{if(clubNetworkBound())workspaceFlows.club.go(i);},workspaceFlows.club.index()===i);
  }
  const tabs=el('div','task-section-tabs');for(const item of items){const button=el('button','task-section-tab',item.label);button.id=item.id;button.type='button';button.setAttribute('aria-pressed',String(item.selected));button.onclick=()=>go(parent,item.action);tabs.append(button);}strip.append(tabs);
  strip.append(assistant);
  if(parent==='view-pitch'&&simple||index!==1&&kind==='plan'){const modes=el('div','task-tactical-modes');modes.setAttribute('role','group');modes.setAttribute('aria-label','Outils tactiques');for(const [id,label,on]of [['mode-focus','Placement tactique',!simple],['mode-simple','Pions & animations',simple]]){const button=el('button','',label);button.type='button';button.setAttribute('aria-pressed',String(on));button.onclick=()=>go(parent,()=>{$(id).click();terrain.go(0);});modes.append(button);}strip.append(modes);}
  if(parent==='view-pitch')$('match-plan-dialog-title').textContent=kind==='plan'?'Causerie · vue tactique':'Ma causerie';
  if(focusId&&$(focusId))$(focusId).focus({preventScroll:true});
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(refresh);}
 window.taskWorkspace={enter(parent){workspaceMenus.close();if(parent==='view-home')workspaceFlows.home.go(0);else if(parent==='view-pitch'&&terrain.index()===2)terrain.go(0);else if(parent==='view-coach-agenda')workspaceFlows.agenda.go(1);else if(parent==='view-club-network'&&clubNetworkBound())workspaceFlows.club.go(1);schedule();},settings(){go('view-pitch',()=>{if(!activateTerrainBoard('composition'))return;terrain.go(1);settingsDrawer.open=true;settingsDrawer.scrollIntoView({block:'start'});});}};
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
 for(const flow of Object.values(workspaceFlows))new MutationObserver(schedule).observe(flow.root,{attributes:true,attributeFilter:['data-step']});
 new MutationObserver(schedule).observe($('training-space'),{subtree:true,attributes:true,attributeFilter:['hidden']});
 document.addEventListener('click',schedule);document.addEventListener('change',schedule);document.body.classList.add('task-navigation');refresh();
 const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);if(new Set(ids).size!==ids.length||before.some(id=>!$(id)))throw Error('Contrôles de navigation manquants ou dupliqués.');
});
