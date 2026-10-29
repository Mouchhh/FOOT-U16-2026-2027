// Menus navigate through existing handlers; no forms, drafts or controls are copied.
document.addEventListener('DOMContentLoaded',()=>{
 const nav=document.querySelector('.app-navigation');if(!nav||!window.workspaceFlows||!window.trainingWizard)return;
 const menus=new Map();let opened=null,routing=false,positionFrame=0;
 const go=(parent,action,targetFor)=>()=>{close();routing=true;try{if(window.workspaceNavigation){if(!workspaceNavigation.run(parent,action))return;}else{$(parent).click();action?.();}}finally{routing=false;}requestAnimationFrame(()=>{if(opened)return;if(document.querySelector('dialog[open]'))return;const destination=targetFor?.();if(destination?.getClientRects().length){destination.scrollIntoView({block:'nearest',behavior:'instant'});const focus=destination.querySelector('summary')||destination;focus.tabIndex=focus.matches('summary,input,button,select,textarea')?focus.tabIndex:-1;focus.focus({preventScroll:true});return;}window.scrollTo({top:0,behavior:'instant'});const search=parent==='view-training'?(!$('training-library-page').hidden?$('training-library-search'):!$('training-catalogue-drawer').hidden&&trainingWizard.step()===3?$('training-search'):null):parent==='view-club-network'&&workspaceFlows.club.index()===1?$('club-document-title'):null;const target=search||[...document.querySelectorAll('.training-step:not([hidden]) h2,#report-content h2,.flow-page:not([hidden]) h1,.flow-page:not([hidden]) h2,.flow-page:not([hidden]) h3')].find(e=>e.getClientRects().length);if(target){if(!target.matches('input,select,textarea'))target.tabIndex=-1;target.focus({preventScroll:true});}});};
 const at=(name,index)=>()=>workspaceFlows[name].go(index);
 const training=index=>()=>{$('training-prepare-tab').click();trainingWizard.go(index);};
 const report=id=>()=>{reportTab=id;renderReportTabs();renderReportContent();};
 const mode=(id,index=0)=>()=>{$(id).click();workspaceFlows.terrain.go(index);};
 const active=cls=>document.body.classList.contains(cls);
 const item=(label,run,current,target)=>({label,run,current,target});
 const definitions=[
  ['view-home','Accueil',[
   item('Mon tableau de bord',at('home',0),()=>active('home-mode')&&workspaceFlows.home.index()===0),
   item('Les éducateurs · connexion et activité',at('home',1),()=>active('home-mode')&&workspaceFlows.home.index()===1)
  ]],
  ['view-pitch','Match',[
   item('Compositions & plans de jeu',mode('mode-team'),()=>active('terrain-workflow-active')&&terrainBoardKind==='composition'&&!active('simple-mode')&&workspaceFlows.terrain.index()===0),
   item('Vue épurée des joueurs',mode('mode-focus'),()=>active('terrain-workflow-active')&&active('focus-mode')&&workspaceFlows.terrain.index()===0),
   item('Explications · pions et animations',mode('mode-simple'),()=>active('terrain-workflow-active')&&active('simple-mode')&&workspaceFlows.terrain.index()===0),
   item('Préparation du match & réglages',()=>window.taskWorkspace?.settings(),()=>active('terrain-workflow-active')&&workspaceFlows.terrain.index()===1),
   item('Impacteurs / Finisseurs',()=>{mode('mode-team',1)();if(state.benchVisible===false)$('bench-toggle').click();$('terrain-bench-drawer').open=true;},null,()=>$('terrain-bench-drawer')),
   item('Enregistrer, ouvrir & exporter',at('terrain',2),()=>active('terrain-workflow-active')&&workspaceFlows.terrain.index()===2),
   item('Mes joueurs enregistrés',()=>openCoachSquad())
  ]],
  ['view-training','Séances',[
   ...['Mon équipe · catégorie et niveau','Thèmes & objectifs','Groupe, date & rendez-vous','Déroulé de ma séance'].map((label,index)=>item(label,training(index),()=>active('training-mode')&&trainingWizard.step()===index&&$('training-library-page').hidden&&$('training-catalogue-drawer').hidden)),
   item('La Bible de l’éduc',()=>trainingWizard.openCatalogue(),()=>active('training-mode')&&!$('training-catalogue-drawer').hidden&&!$('training-step-3').hidden),
   item('Mes séances enregistrées',()=>$('training-library-tab').click(),()=>active('training-mode')&&!$('training-library-page').hidden),
   item('Créer mon exercice',()=>{training(3)();openCustomTrainingExercise();})
  ]],
  ['view-coach-agenda','Agenda',[
   item('Vue d’ensemble de mon espace',at('agenda',0),()=>active('coach-agenda-mode')&&workspaceFlows.agenda.index()===0),
   item('Mon calendrier et mes séances',at('agenda',1),()=>active('coach-agenda-mode')&&workspaceFlows.agenda.index()===1),
   item('Mes joueurs enregistrés',()=>openCoachSquad()),
   item('Préparer une autre semaine',()=>planningNextWeek()),
   item('Brouillons & récupération',()=>workspaceOpenRecovery())
  ]],
  ['view-reports','Bilans',[
   ...Object.entries(reportTabNames).map(([id,label])=>item(label.replace(/^\d+\s*·\s*/,''),report(id),()=>active('reports-mode')&&reportTab===id)),
   item('Mes rapports enregistrés',()=>{$('report-library-drawer').open=true;},null,()=>$('report-library-drawer'))
  ]],
  ['view-club-network','Club',[
   item('Les éducateurs du club',at('club',0),()=>active('club-network-mode')&&workspaceFlows.club.index()===0),
   item('Documents partagés',at('club',1),()=>active('club-network-mode')&&workspaceFlows.club.index()===1),
   item('Mon compte & mon partage',at('club',2),()=>active('club-network-mode')&&workspaceFlows.club.index()===2)
  ]]
 ];
 function close(focus=false){if(!opened)return;const old=opened;old.panel.hidden=true;old.trigger.setAttribute('aria-expanded','false');opened=null;if(focus||old.panel.contains(document.activeElement))old.trigger.focus({preventScroll:true});}
 function position(){if(!opened)return;const r=opened.trigger.getBoundingClientRect(),width=Math.min(340,innerWidth-24),left=Math.max(12,Math.min(innerWidth-width-12,r.left));if(r.bottom<=0||r.top>=innerHeight){close();return;}opened.panel.style.width=width+'px';const below=innerHeight-r.bottom-20,above=r.top-20,up=below<180&&above>below,space=Math.max(60,up?above:below),height=Math.min(opened.panel.scrollHeight+2,space);Object.assign(opened.panel.style,{left:left+'px',top:Math.max(8,up?r.top-8-height:r.bottom+8)+'px',maxHeight:space+'px'});}
 function open(menu,focus=false,last=false){if(document.querySelector('dialog[open]'))return;close();opened=menu;menu.panel.hidden=false;menu.trigger.setAttribute('aria-expanded','true');for(const [entry,button]of menu.entries){if(entry.current?.())button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}position();if(focus){const items=menu.panel.querySelectorAll('[role=menuitem]');items[last?items.length-1:0]?.focus({preventScroll:true});}}
 for(const [parent,title,entries]of definitions){
  const primary=$(parent);if(!primary)continue;
  const trigger=el('button','workspace-menu-trigger workspace-tools-trigger','Autres outils');trigger.id=parent+'-tools';trigger.type='button';
  const panel=el('div','workspace-submenu');panel.id=parent+'-submenu';panel.hidden=true;panel.setAttribute('role','menu');panel.setAttribute('aria-labelledby',trigger.id);panel.append(el('div','workspace-submenu-heading',title));
  const menu={trigger,panel,entries:[]};menus.set(parent,menu);
  primary.removeAttribute('aria-haspopup');primary.removeAttribute('aria-expanded');primary.removeAttribute('aria-controls');
  trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',panel.id);const arrow=el('span','workspace-menu-chevron');arrow.setAttribute('aria-hidden','true');trigger.append(arrow);
  for(const entry of entries){const button=el('button','workspace-submenu-item',entry.label);button.type='button';button.setAttribute('role','menuitem');button.tabIndex=-1;button.onclick=()=>go(parent,()=>{if(parent==='view-club-network'&&!clubNetworkBound())return;entry.run();const dialog=document.querySelector('dialog[open]');if(dialog)dialog.addEventListener('close',()=>primary.focus({preventScroll:true}),{once:true});},entry.target)();panel.append(button);menu.entries.push([entry,button]);}
  // Main navigation goes straight to work. Only the explicit tools button opens a menu.
  primary.addEventListener('click',event=>{if(routing||!event.isTrusted){close();return;}event.preventDefault();event.stopImmediatePropagation();go(parent,()=>window.taskWorkspace?.enter(parent))();},true);
  primary.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const all=[...nav.querySelectorAll(':scope>button')],i=all.indexOf(primary);all[event.key==='Home'?0:event.key==='End'?all.length-1:(i+(event.key==='ArrowRight'?1:all.length-1))%all.length]?.focus();});
  trigger.onclick=()=>opened===menu?close():open(menu);
  trigger.onkeydown=event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();open(menu,true,event.key==='ArrowUp');}else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}};
  panel.addEventListener('keydown',event=>{const items=[...panel.querySelectorAll('[role=menuitem]')],i=items.indexOf(document.activeElement);let next;if(event.key==='Tab'){close(true);return;}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);return;}if(event.key==='ArrowDown')next=(i+1)%items.length;else if(event.key==='ArrowUp')next=(i+items.length-1)%items.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=items.length-1;else return;event.preventDefault();items[next].focus({preventScroll:true});});
  document.body.append(panel);
 }
 window.workspaceMenus={button:parent=>menus.get(parent)?.trigger,close,open(parent){const menu=menus.get(parent);if(menu)open(menu,true);}};
 document.addEventListener('pointerdown',event=>{if(opened&&!opened.panel.contains(event.target)&&!opened.trigger.contains(event.target))close();},true);
 document.addEventListener('focusin',event=>{if(opened&&!opened.panel.contains(event.target)&&!opened.trigger.contains(event.target))close();});
 window.addEventListener('resize',()=>close());window.addEventListener('scroll',()=>{cancelAnimationFrame(positionFrame);positionFrame=requestAnimationFrame(position);},true);document.addEventListener('visibilitychange',()=>{if(document.hidden)close();});
 document.body.classList.add('dropdown-navigation');
});
