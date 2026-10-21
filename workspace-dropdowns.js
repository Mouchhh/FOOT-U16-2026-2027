// Menus navigate through existing handlers; no forms, drafts or controls are copied.
document.addEventListener('DOMContentLoaded',()=>{
 const nav=document.querySelector('.app-navigation');if(!nav||!window.workspaceFlows||!window.trainingWizard)return;
 const menus=new Map();let opened=null,routing=false,positionFrame=0,leaveTimer=0;
 const go=(parent,action)=>()=>{close();routing=true;try{$(parent).click();action?.();}finally{routing=false;}requestAnimationFrame(()=>{if(opened)return;window.scrollTo({top:0,behavior:'instant'});if(document.querySelector('dialog[open]'))return;const target=[...document.querySelectorAll('.training-step:not([hidden]) h2,#report-content h2,.flow-page:not([hidden]) h1,.flow-page:not([hidden]) h2,.flow-page:not([hidden]) h3')].find(e=>e.getClientRects().length);if(target){target.tabIndex=-1;target.focus({preventScroll:true});}});};
 const at=(name,index)=>()=>workspaceFlows[name].go(index);
 const training=index=>()=>{$('training-prepare-tab').click();trainingWizard.go(index);};
 const report=id=>()=>{reportTab=id;renderReportTabs();renderReportContent();};
 const mode=(id,index=0)=>()=>{$(id).click();workspaceFlows.terrain.go(index);};
 const active=cls=>document.body.classList.contains(cls);
 const item=(label,run,current)=>({label,run,current});
 const definitions=[
  ['view-home','Accueil',[
   item('Mon tableau de bord',at('home',0),()=>active('home-mode')&&workspaceFlows.home.index()===0),
   item('Les éducateurs · connexion et activité',at('home',1),()=>active('home-mode')&&workspaceFlows.home.index()===1)
  ]],
  ['view-pitch','Terrain & tactique',[
   item('Compositions & plans de jeu',mode('mode-team'),()=>active('terrain-workflow-active')&&terrainBoardKind==='composition'&&!active('simple-mode')&&workspaceFlows.terrain.index()===0),
   item('Vue épurée des joueurs',mode('mode-focus'),()=>active('terrain-workflow-active')&&active('focus-mode')&&workspaceFlows.terrain.index()===0),
   item('Explications · pions et animations',mode('mode-simple'),()=>active('terrain-workflow-active')&&active('simple-mode')&&workspaceFlows.terrain.index()===0),
   item('Préparation du match & réglages',mode('mode-team',1),()=>active('terrain-workflow-active')&&workspaceFlows.terrain.index()===1),
   item('Impacteurs / Finisseurs',()=>{mode('mode-team',1)();if(state.benchVisible===false)$('bench-toggle').click();$('terrain-bench-drawer').open=true;$('terrain-bench-drawer').scrollIntoView({block:'nearest',behavior:'instant'});}),
   item('Enregistrer, ouvrir & exporter',at('terrain',2),()=>active('terrain-workflow-active')&&workspaceFlows.terrain.index()===2),
   item('Mes joueurs enregistrés',()=>openCoachSquad())
  ]],
  ['view-training','Séances de la semaine',[
   ...['Mon équipe · catégorie et niveau','Thèmes & objectifs','Groupe, date & rendez-vous','Déroulé de ma séance'].map((label,index)=>item(label,training(index),()=>active('training-mode')&&trainingWizard.step()===index&&$('training-library-page').hidden&&$('training-catalogue-drawer').hidden)),
   item('La Bible de l’éduc',()=>trainingWizard.openCatalogue(),()=>active('training-mode')&&!$('training-catalogue-drawer').hidden&&!$('training-step-3').hidden),
   item('Mes séances enregistrées',()=>$('training-library-tab').click(),()=>active('training-mode')&&!$('training-library-page').hidden),
   item('Créer mon exercice',()=>{training(3)();openCustomTrainingExercise();})
  ]],
  ['view-coach-agenda','Mon espace · agenda',[
   item('Vue d’ensemble de mon espace',at('agenda',0),()=>active('coach-agenda-mode')&&workspaceFlows.agenda.index()===0),
   item('Mon calendrier et mes séances',at('agenda',1),()=>active('coach-agenda-mode')&&workspaceFlows.agenda.index()===1),
   item('Mes joueurs enregistrés',()=>openCoachSquad()),
   item('Préparer une autre semaine',()=>planningNextWeek()),
   item('Brouillons & récupération',()=>workspaceOpenRecovery())
  ]],
  ['view-reports','Après-match · rapports',[
   ...Object.entries(reportTabNames).map(([id,label])=>item(label.replace(/^\d+\s*·\s*/,''),report(id),()=>active('reports-mode')&&reportTab===id)),
   item('Mes rapports enregistrés',()=>{$('report-library-drawer').open=true;$('report-library-drawer').scrollIntoView({block:'nearest',behavior:'instant'});})
  ]],
  ['view-club-network','Travail du club',[
   item('Les éducateurs du club',at('club',0),()=>active('club-network-mode')&&workspaceFlows.club.index()===0),
   item('Documents partagés',at('club',1),()=>active('club-network-mode')&&workspaceFlows.club.index()===1),
   item('Mon compte & mon partage',at('club',2),()=>active('club-network-mode')&&workspaceFlows.club.index()===2)
  ]]
 ];
 function cancelLeave(){clearTimeout(leaveTimer);leaveTimer=0;}
 function hoverMouse(event){return event.pointerType==='mouse'&&matchMedia('(hover:hover) and (pointer:fine)').matches;}
 function leave(menu){cancelLeave();leaveTimer=setTimeout(()=>{if(opened===menu&&!menu.trigger.matches(':hover')&&!menu.panel.matches(':hover'))close();},250);}
 function close(focus=false){cancelLeave();if(!opened)return;const old=opened;old.panel.hidden=true;old.trigger.setAttribute('aria-expanded','false');opened=null;if(focus)old.trigger.focus({preventScroll:true});}
 function position(){if(!opened)return;const r=opened.trigger.getBoundingClientRect(),width=Math.min(340,innerWidth-24),left=Math.max(12,Math.min(innerWidth-width-12,r.left));if(r.bottom<=0||r.top>=innerHeight){close();return;}Object.assign(opened.panel.style,{left:left+'px',top:Math.min(r.bottom+8,innerHeight-80)+'px',width:width+'px',maxHeight:Math.max(60,innerHeight-r.bottom-20)+'px'});}
 function open(menu,focus=false,last=false){close();opened=menu;menu.panel.hidden=false;menu.trigger.setAttribute('aria-expanded','true');for(const [entry,button]of menu.entries){if(entry.current?.())button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}position();if(focus){const items=menu.panel.querySelectorAll('[role=menuitem]');items[last?items.length-1:0]?.focus({preventScroll:true});}}
 for(const [parent,title,entries]of definitions){
  const trigger=$(parent);if(!trigger)continue;const panel=el('div','workspace-submenu');panel.id=parent+'-submenu';panel.hidden=true;panel.setAttribute('role','menu');panel.setAttribute('aria-labelledby',parent);const heading=el('div','workspace-submenu-heading',title);heading.setAttribute('aria-hidden','true');panel.append(heading);const menu={trigger,panel,entries:[]};menus.set(parent,menu);
  trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',panel.id);trigger.classList.add('workspace-menu-trigger');const arrow=el('span','workspace-menu-chevron');arrow.setAttribute('aria-hidden','true');trigger.append(arrow);
  for(const entry of entries){const button=el('button','workspace-submenu-item',entry.label);button.type='button';button.setAttribute('role','menuitem');button.onclick=()=>{const isClub=parent==='view-club-network';go(parent,()=>{if(isClub&&!clubNetworkBound())return;entry.run();})();};panel.append(button);menu.entries.push([entry,button]);}
  // A real click opens the menu. Programmatic clicks remain the routing API used
  // by home shortcuts and existing workflows, so their original handlers run.
  trigger.addEventListener('pointerenter',event=>{if(hoverMouse(event))open(menu);});
  trigger.addEventListener('pointerleave',event=>{if(hoverMouse(event))leave(menu);});
  panel.addEventListener('pointerenter',event=>{if(hoverMouse(event))cancelLeave();});
  panel.addEventListener('pointerleave',event=>{if(hoverMouse(event))leave(menu);});
  trigger.addEventListener('click',event=>{if(routing)return;if(!event.isTrusted){close();return;}event.preventDefault();event.stopImmediatePropagation();if(opened===menu){if(event.detail===0||event.pointerType==='touch'||!matchMedia('(hover:hover) and (pointer:fine)').matches)close();}else open(menu,event.detail===0);},true);
  trigger.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();open(menu,true,event.key==='ArrowUp');}else if(event.key==='Escape'&&opened){event.preventDefault();event.stopPropagation();close(true);}});
  panel.addEventListener('keydown',event=>{const items=[...panel.querySelectorAll('[role=menuitem]')],index=items.indexOf(document.activeElement);let next;if(event.key==='ArrowDown')next=(index+1)%items.length;else if(event.key==='ArrowUp')next=(index+items.length-1)%items.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=items.length-1;else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);return;}else return;event.preventDefault();items[next].focus({preventScroll:true});});
  document.body.append(panel);
 }
 document.addEventListener('pointerdown',event=>{if(opened&&!opened.panel.contains(event.target)&&!opened.trigger.contains(event.target))close();},true);
 document.addEventListener('focusin',event=>{if(opened&&!opened.panel.contains(event.target)&&!opened.trigger.contains(event.target))close();});
 window.addEventListener('resize',()=>close());window.addEventListener('scroll',()=>{cancelAnimationFrame(positionFrame);positionFrame=requestAnimationFrame(position);},true);document.addEventListener('visibilitychange',()=>{if(document.hidden)close();});
 document.body.classList.add('dropdown-navigation');
});
