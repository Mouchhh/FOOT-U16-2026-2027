// Parcours de présentation uniquement : les formulaires et leurs écouteurs sont déplacés, jamais copiés.
document.addEventListener('DOMContentLoaded',()=>{
 const main=document.querySelector('main');
 const beforeIds=[...main.querySelectorAll('[id]')].map(e=>e.id);
 const workflows=[];let terrainMeasure=()=>{};
 function pager(root,key,labels,options={}){
  root.classList.add('flow-root');root.dataset.flow=key;
  const nav=el('nav','flow-progress');nav.setAttribute('aria-label','Étapes · '+key);
  const pages=labels.map((label,i)=>{const page=el('section','flow-page');page.id=key+'-page-'+i;const button=el('button','');button.type='button';button.id=key+'-step-link-'+i;button.setAttribute('aria-controls',page.id);button.append(el('span','flow-number',String(i+1)),el('span','',label));button.onclick=()=>go(i);nav.append(button);return page;});
  const footer=el('div','flow-footer'),prev=el('button','export','← Précédent'),count=el('span',''),next=el('button','primary','Suivant →');prev.type=next.type='button';prev.id=key+'-previous';next.id=key+'-next';footer.append(prev,count,next);
  let index=0;
  function go(i){index=Math.max(0,Math.min(pages.length-1,i));root.dataset.step=String(index);pages.forEach((p,n)=>p.hidden=n!==index);[...nav.children].forEach((b,n)=>{b.classList.toggle('active',n===index);if(n===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});prev.disabled=index===0;next.textContent=index===pages.length-1?(options.lastLabel||'Retour à l’accueil'):'Suivant →';count.textContent='Étape '+(index+1)+' / '+pages.length;pages[index].scrollTop=0;options.change?.(index);measure();}
  prev.onclick=()=>go(index-1);next.onclick=()=>{if(index<pages.length-1)go(index+1);else if(options.finish)options.finish();else $('view-home').click();};
  const workflow={root,pages,nav,footer,go,index:()=>index};workflows.push(workflow);go(0);return workflow;
 }
 let measureFrame=0;
 function measure(){cancelAnimationFrame(measureFrame);measureFrame=requestAnimationFrame(()=>{for(const root of [...workflows.map(f=>f.root),$('after-match')]){if(!root.getClientRects().length)continue;let top=0;for(let node=root;node;node=node.offsetParent)top+=node.offsetTop;root.style.setProperty('--flow-top',Math.ceil(top)+'px');}terrainMeasure();});}
 function mount(flow,after){if(after)after.after(flow.nav);else flow.root.prepend(flow.nav);flow.root.append(...flow.pages,flow.footer);}
 function disclosure(label,node,id){const details=el('details','flow-disclosure');if(id)details.id=id;details.append(el('summary','',label),node);return details;}
 // Terrain et tactique : même document, trois pages, trois vues indépendantes conservées.
 const terrain=el('section','terrain-flow');terrain.id='terrain-flow';const modeSwitch=document.querySelector('.mode-switch');modeSwitch.after(terrain);
 const terrainFlow=pager(terrain,'terrain',['Le tableau','Consignes & réglages','Enregistrer & exporter'],{lastLabel:'Enregistrer',finish:()=>{if(document.body.classList.contains('simple-mode'))$('simple-sequence-save').click();else $('save').click();}});mount(terrainFlow);
 const workspace=document.querySelector('.workspace'),right=workspace.querySelector('.right-column'),settings=right.querySelector('.settings'),banner=document.querySelector('.tactics-banner'),focus=$('game-plan-context');
 const team0=el('div','terrain-team-section'),team1=el('div','terrain-team-section'),team2=el('div','terrain-team-section');team0.append(workspace);team1.append(settings,disclosure('Le carnet du coach · formations et plans de jeu',banner,'terrain-tactics-drawer'));team1.append(disclosure('À propos du tableau',document.querySelector('.intro'),'terrain-intro-drawer'));team2.append(right);
 terrainFlow.pages[0].append(team0);terrainFlow.pages[1].append(team1);terrainFlow.pages[2].append(team2);team1.append(disclosure('Impacteurs / Finisseurs · gérer le banc',$('bench'),'terrain-bench-drawer'));terrainFlow.nav.after(focus);
 const simple=$('simple-board'),simple0=el('div','terrain-simple-section'),simple1=el('div','terrain-simple-section'),simple2=el('div','terrain-simple-section'),simpleLibrary=simple.querySelector('.simple-library-panel'),media=simple.querySelector('.media-export'),instructions=simple.querySelector('.simple-instructions'),edit=instructions.querySelector('.simple-edit');
 simple2.append(simpleLibrary,media);simple1.append(instructions);simple.querySelector('.simple-layout').before(edit);simple0.append(simple);terrainFlow.pages[0].append(simple0);terrainFlow.pages[1].append(simple1);terrainFlow.pages[2].append(simple2);
 const roster=workspace.querySelector('aside.panel');roster.id='terrain-roster-drawer';const rosterToggle=el('button','export flow-roster-toggle','Replier l’effectif');rosterToggle.id='terrain-roster-toggle';rosterToggle.type='button';rosterToggle.setAttribute('aria-controls',roster.id);rosterToggle.setAttribute('aria-expanded','true');terrainFlow.nav.after(rosterToggle);rosterToggle.onclick=()=>{const hide=!workspace.classList.contains('roster-folded');workspace.classList.toggle('roster-folded',hide);rosterToggle.setAttribute('aria-expanded',String(!hide));rosterToggle.textContent=hide?'Afficher l’effectif':'Replier l’effectif';};
 const terrainGo=terrainFlow.go;terrainFlow.go=i=>{terrainGo(i);rosterToggle.hidden=i!==0;};for(const id of ['mode-team','mode-focus','mode-simple'])$(id).addEventListener('click',()=>terrainFlow.go(0));
 let previousBoard;$('saved').addEventListener('click',()=>previousBoard=state,true);$('saved').addEventListener('click',()=>{if(state!==previousBoard)terrainFlow.go(0);});let previousSequence;$('simple-sequence-open').addEventListener('click',()=>previousSequence=simpleState,true);$('simple-sequence-open').addEventListener('click',()=>{if(simpleState!==previousSequence)terrainFlow.go(0);});
 terrainMeasure=()=>{const desktop=matchMedia('(min-width:1000px) and (min-height:650px)').matches,page=terrainFlow.pages[0];terrain.style.setProperty('--terrain-pane-height',page.clientHeight+'px');for(const [pitch,container]of [[$('pitch'),workspace.querySelector('.board')],[$('simple-pitch'),simple]]){if(!desktop){pitch.style.removeProperty('width');continue;}if(!pitch.getClientRects().length||terrainFlow.index()!==0)continue;
  // Measure controls themselves, never scrollHeight minus the current pitch size:
  // grid columns can make that value grow each time the pitch is resized.
  const team=pitch.id==='pitch',footer=team?container.querySelector('.board-footer'):null;
  const chrome=team?(footer?.offsetHeight||0)+24:28;
  const ratio=document.body.classList.contains('landscape-mode')?840/680:680/840,available=Math.max(380,page.clientHeight-chrome),column=Math.max(280,container.clientWidth-(team?210:280));
  const width=Math.floor(Math.min(column,Math.max(380,available*ratio)));if(pitch.style.width!==width+'px')pitch.style.width=width+'px';
 }};
 const boardResize=new ResizeObserver(measure);boardResize.observe(workspace.querySelector('.board'));boardResize.observe(simple);
 countsPlaceholder: {}
 // Rapports : les six rubriques existantes deviennent un parcours avec navigation en bas.
 const reports=$('after-match'),reportLibrary=reports.querySelector('.report-library'),reportHint=$('report-save-status').nextElementSibling;
 const reportSaved=disclosure('Mes rapports · ouvrir, renommer, copier ou supprimer',reportLibrary,'report-library-drawer');reports.querySelector('.reports-heading').after(reportSaved);reportSaved.append(reportHint);
 const reportFooter=el('div','flow-footer'),reportPrevious=el('button','export','← Précédent'),reportCounter=el('span',''),reportNext=el('button','primary','Suivant →');reportPrevious.type=reportNext.type='button';reportPrevious.id='report-previous';reportNext.id='report-next';reportFooter.append(reportPrevious,reportCounter,reportNext);reports.append(reportFooter);reports.classList.add('report-flow');
 const reportKeys=Object.keys(reportTabNames);
 function updateReportFlow(){const i=reportKeys.indexOf(reportTab);reportPrevious.disabled=i<=0;reportCounter.textContent='Étape '+(i+1)+' / '+reportKeys.length;reportNext.textContent=i===reportKeys.length-1?'Enregistrer le rapport ✓':'Suivant →';[...$('report-tabs').children].forEach((b,n)=>{if(n===i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});$('report-content').scrollTop=0;measure();}
 function reportGo(i){reportTab=reportKeys[Math.max(0,Math.min(reportKeys.length-1,i))];renderReportTabs();renderReportContent();}
 const renderTabs=renderReportTabs;renderReportTabs=function(){renderTabs();updateReportFlow();};const renderContent=renderReportContent;renderReportContent=function(){renderContent();updateReportFlow();};reportPrevious.onclick=()=>reportGo(reportKeys.indexOf(reportTab)-1);reportNext.onclick=()=>{if(reportTab===reportKeys.at(-1))$('report-save').click();else reportGo(reportKeys.indexOf(reportTab)+1);};updateReportFlow();
 // Agenda : vue d’ensemble, puis calendrier et séances enregistrées.
 const agenda=$('coach-agenda'),counts=$('coach-agenda-counts'),filters=agenda.querySelector('.coach-agenda-filters'),agendaList=$('coach-agenda-list');const agendaFlow=pager(agenda,'agenda',['Vue d’ensemble','Mon calendrier']);mount(agendaFlow,agenda.querySelector('.reports-heading'));agendaFlow.pages[0].append(counts);agendaFlow.pages[1].append(filters,agendaList);counts.addEventListener('click',event=>{const text=event.target.closest('button')?.textContent||'';if(text==='Voir mes compositions')terrainFlow.go(2);else if(text==='Voir mes rapports')reportSaved.open=true;else if(text==='Voir mes séances')$('training-library-tab').click();});
 // Club : éducateurs, documents, puis outils personnels de partage.
 const club=$('club-network-dialog'),connected=$('club-network-connected'),own=connected.querySelector('.report-panel'),cards=$('club-network-coach-cards'),clubFilters=connected.querySelector('.club-network-filters'),clubList=$('club-network-list'),more=$('club-network-more'),hint=more.nextElementSibling;const clubFlow=pager(connected,'club',['Les éducateurs','Documents partagés','Mon partage']);mount(clubFlow);clubFlow.pages[0].append(cards);clubFlow.pages[1].append(clubFilters,clubList,more,hint);clubFlow.pages[2].append(own);
 // Un clic sur un éducateur ouvre directement ses documents, sans perdre le filtre.
 cards.addEventListener('click',event=>{if(event.target.closest('button'))clubFlow.go(1);});
 // Accueil : le tableau de bord puis le répertoire des éducateurs.
 const home=$('club-home'),homeLayout=home.querySelector('.home-layout'),educators=$('home-educators'),hero=home.querySelector('.home-hero'),slides=$('home-slideshow-controls');const homeFlow=pager(home,'home',['Mon tableau de bord','Les éducateurs'],{lastLabel:'Tableau de bord',finish:()=>homeFlow.go(0)});mount(homeFlow);homeFlow.pages[0].append(hero,slides,homeLayout);const originalFooter=main.querySelector(':scope>footer');if(originalFooter)homeFlow.pages[0].append(originalFooter);homeFlow.pages[1].append(educators);const educatorHint=el('p','hint','Connectez-vous à l’espace privé pour retrouver les éducateurs du club, leurs présences et leurs dernières connexions.');educatorHint.id='home-educators-local-help';educators.prepend(educatorHint);educatorHint.hidden=clubNetworkBound();
 // Tous les éléments préexistants restent attachés au document, avec leur identifiant unique.
 const missing=beforeIds.filter(id=>!document.getElementById(id));if(missing.length)throw Error('Éléments de travail manquants : '+missing.join(', '));
 const resize=new ResizeObserver(measure);for(const node of [document.querySelector('header'),document.querySelector('.app-navigation'),$('club-profile')])resize.observe(node);
 new MutationObserver(()=>{const isTerrain=!['home-mode','training-mode','reports-mode','coach-agenda-mode','club-network-mode'].some(mode=>document.body.classList.contains(mode));if(document.body.classList.contains('terrain-workflow-active')!==isTerrain)document.body.classList.toggle('terrain-workflow-active',isTerrain);educatorHint.hidden=clubNetworkBound();rosterToggle.hidden=terrainFlow.index()!==0||document.body.classList.contains('simple-mode')||document.body.classList.contains('focus-mode');measure();}).observe(document.body,{attributes:true,attributeFilter:['class']});
 // L’observateur ne réécrit pas une classe inchangée.
 window.addEventListener('resize',measure);
 const routes={terrain:terrainFlow,agenda:agendaFlow,club:clubFlow,home:homeFlow};window.workspaceFlows=routes;
 document.body.classList.toggle('terrain-workflow-active',!['home-mode','training-mode','reports-mode','coach-agenda-mode','club-network-mode'].some(mode=>document.body.classList.contains(mode)));measure();
});
