// Accueil après authentification ; les raccourcis utilisent les outils existants.
const homeSections=[
 {id:'pitch',button:'view-pitch',title:'Terrain & tactique',intro:'Composer, expliquer et faire vivre vos idées de jeu.',items:[
  ['Composition & plans de jeu',()=> $('mode-team').click()],['Vue épurée · mes joueurs',()=> $('mode-focus').click()],['Explication · pions & séquences',()=> $('mode-simple').click()],['Formations & carnet tactique',()=> $('open-tactics').click()],['Flèches & déplacements',()=>{$('mode-team').click();$('arrow').click();homeScroll('pitch');}],['Adversaires',()=>{$('mode-team').click();$('tactic-opponents-tab').click();}],['Couloirs & impacteurs / finisseurs',()=>{$('mode-team').click();homeScroll('lanes-toggle');}],['Mes compositions',()=>{$('mode-team').click();homeScroll('saved');}],['Image / PDF pour Canva',()=> $('composition-export').click()],['Équipe, catégorie & joueurs',()=>{$('mode-team').click();$('club-profile').open=true;homeScroll('club-profile');}]]},
 {id:'training',button:'view-training',title:'Séances de la semaine',intro:'Planifier et adapter les séances à votre groupe.',items:[
  ['Préparer ma séance',()=>homeScroll('training-title')],['Jour, horaire, effectif & niveau',()=>homeScroll('training-date')],['Thèmes de travail',()=>homeScroll('training-themes')],['Exercices & schémas',()=>homeScroll('training-catalogue')],['Assistant de séance',()=>homeScroll('local-coach-propose')],['Mes séances enregistrées',()=>homeScroll('training-library')],['PDF & sauvegarde de séance',()=>homeScroll('training-pdf')]]},
 {id:'agenda',button:'view-coach-agenda',title:'Mon espace · agenda',intro:'Retrouver votre calendrier et vos documents.',items:[
  ['Calendrier de mes séances',()=>homeScroll('coach-agenda-month')],['Toutes mes dates',()=> $('coach-agenda-all').click()],['Mes séances, compositions & rapports',()=>homeScroll('coach-agenda-counts')],['Sauvegarder mon espace',()=> $('coach-backup').click()]]},
 {id:'reports',button:'view-reports',title:'Après-match · rapports',intro:'Analyser le match et préparer la suite.',items:[
  ...Object.entries(reportTabNames).map(([tab,label])=>[label.replace(/^\d · /,''),()=>{reportTab=tab;renderReportTabs();renderReportContent();homeScroll('report-content');}]),['Mes rapports',()=>homeScroll('report-library-select')],['PDF & sauvegarde du rapport',()=>homeScroll('report-pdf')]]},
 {id:'club',button:'view-club-network',title:'Travail du club',intro:'Consulter les profils et les réalisations des éducateurs.',items:[
  ['Profils des éducateurs',()=>homeScroll('club-network-coach-cards')],['Séances partagées',()=>homeClubKind('training')],['Compositions partagées',()=>homeClubKind('composition')],['Rapports partagés',()=>homeClubKind('report')],['Mon compte & mot de passe',()=>{document.querySelector('.club-network-password').open=true;homeScroll('club-network-password-form');}]]}
];
function homeScroll(id){requestAnimationFrame(()=>{const target=$(id);if(target){target.scrollIntoView({behavior:'smooth',block:'center'});if(target.matches('input,select,button,textarea'))target.focus({preventScroll:true});}});}
function homeClubKind(kind){$('club-network-kind').value=kind;$('club-network-author').value='';clubNetworkRenderRows();homeScroll('club-network-list');}
function hideClubHome(){document.body.classList.remove('home-mode');$('club-home').hidden=true;$('view-home').classList.remove('active');$('view-home').setAttribute('aria-pressed','false');}
function homeSubnav(section){const root=$('section-subnav');root.replaceChildren();root.hidden=!section;if(!section)return;for(const [label,action] of section.items){const button=el('button','',label);button.onclick=action;root.append(button);}}
function showClubHome(){
 if(clubNetworkPrivateRequested&&!clubNetworkBound())return;
 setTrainingView(false);setReportView(false);setCoachAgenda(false);clubNetworkShowView(false);stopAnimation();
 document.body.classList.add('home-mode');$('club-home').hidden=false;$('view-home').classList.add('active');$('view-home').setAttribute('aria-pressed','true');
 for(const section of homeSections){$(section.button).classList.remove('active');$(section.button).setAttribute('aria-pressed','false');}
 homeSubnav(null);renderClubHomeStats();clubNetworkRenderPresence();window.scrollTo({top:0,behavior:'smooth'});
}
function renderClubHomeStats(){
 $('home-greeting').textContent='Bonjour '+(clubNetworkMember?.display_name||activeCoach.name)+'.';
 $('home-date').textContent=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
 $('home-training-count').textContent=trainingLibrary.length;$('home-report-count').textContent=reportLibrary.length;$('home-composition-count').textContent=saves.length;
}
const clubShowBeforeHome=clubNetworkShowView;
clubNetworkShowView=function(on=true){if(on){hideClubHome();homeSubnav(homeSections.find(s=>s.id==='club'));}return clubShowBeforeHome(on);};
$('view-home').onclick=showClubHome;
document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();showClubHome();});
for(const section of homeSections){
 $(section.button).addEventListener('click',()=>{hideClubHome();homeSubnav(section);});
 const card=el('button','home-section-card');card.type='button';
 const text=el('span','home-card-copy');text.append(el('strong','',section.title),el('span','',section.intro));
 const arrow=el('span','home-card-arrow','→');arrow.setAttribute('aria-hidden','true');card.append(text,arrow);card.onclick=()=>$(section.button).click();$('home-sections').append(card);
}
// Le répertoire reste dans l'accueil, sans multiplier les présences affichées.
$('home-educators').append($('club-connected'));$('coach-profile').after($('club-home'));
if(clubNetworkBound())showClubHome();
