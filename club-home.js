// Accueil après authentification ; les raccourcis utilisent les outils existants.
const homeSections=[
 {id:'pitch',button:'view-pitch',title:'Terrain & tactique',intro:'Composer, expliquer et faire vivre vos idées de jeu.'},
 {id:'training',button:'view-training',title:'Séances de la semaine',intro:'Planifier et adapter les séances à votre groupe.'},
 {id:'agenda',button:'view-coach-agenda',title:'Mon espace · agenda',intro:'Retrouver votre calendrier et vos documents.'},
 {id:'reports',button:'view-reports',title:'Après-match · rapports',intro:'Analyser le match et préparer la suite.'},
 {id:'club',button:'view-club-network',title:'Travail du club',intro:'Consulter les profils et les réalisations des éducateurs.'}
];
function hideClubHome(){document.body.classList.remove('home-mode');$('club-home').hidden=true;$('view-home').classList.remove('active');$('view-home').setAttribute('aria-pressed','false');}
function showClubHome(){
 if(clubNetworkPrivateRequested&&!clubNetworkBound())return;
 setTrainingView(false);setReportView(false);setCoachAgenda(false);clubNetworkShowView(false);stopAnimation();
 document.body.classList.add('home-mode');$('club-home').hidden=false;$('view-home').classList.add('active');$('view-home').setAttribute('aria-pressed','true');
 for(const section of homeSections){$(section.button).classList.remove('active');$(section.button).setAttribute('aria-pressed','false');}
 renderClubHomeStats();clubNetworkRenderPresence();window.scrollTo({top:0,behavior:'smooth'});
}
function renderClubHomeStats(){
 $('home-greeting').textContent='Bonjour '+(clubNetworkMember?.display_name||activeCoach.name)+'.';
 $('home-greeting').title=$('home-greeting').textContent;
 $('home-date').textContent=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/Paris'}).format(new Date());
 $('home-training-count').textContent=trainingLibrary.length;$('home-report-count').textContent=reportLibrary.length;$('home-composition-count').textContent=saves.filter(s=>valid(s.state)&&!s.state.squadDirectory).length;
}
const clubShowBeforeHome=clubNetworkShowView;
clubNetworkShowView=function(on=true){if(on)hideClubHome();return clubShowBeforeHome(on);};
$('view-home').onclick=showClubHome;
document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();showClubHome();});
for(const section of homeSections){
 $(section.button).addEventListener('click',hideClubHome);
 const card=el('button','home-section-card');card.type='button';
 const text=el('span','home-card-copy');text.append(el('strong','',section.title),el('span','',section.intro));
 const arrow=el('span','home-card-arrow','→');arrow.setAttribute('aria-hidden','true');card.append(text,arrow);card.onclick=()=>$(section.button).click();$('home-sections').append(card);
}
// Le répertoire reste dans l'accueil, sans multiplier les présences affichées.
$('home-educators').append($('club-connected'));$('coach-profile').after($('club-home'));
if(clubNetworkBound())showClubHome();
