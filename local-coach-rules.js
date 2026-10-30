// Assistant à règles : aucun modèle, API, dépendance ou appel réseau.
const localCoachProgressions={
 'Technique':['passes','duel','support'],Conservation:['passes','rondo','transition'],Relance:['passes','triangle','build'],Pressing:['cover','press','trap'],'Défense':['cover','block','transition'],Transitions:['rondo','transition','counter'],Largeur:['passes','overlap','switch'],Finition:['passes','finish','cutback'],Duels:['passes','duel','cover'],'Démarquage':['passes','support','triangle'],CPA:['touch','cpa-defence','cpa-attack'],Gardiens:['passes','keeper-feet','keeper-duel'],'Jeu global':['rondo','support','switch']
};
const localCoachSectionIds={Technique:['philosophie','collectif'],Conservation:['avec-ballon','recuperation'],Relance:['avec-ballon','gardien','base'],Pressing:['perte','collectif'],'Défense':['perte','defenseurs','sentinelle'],Transitions:['perte','recuperation'],Largeur:['avec-ballon','lateraux','ailiers'],Finition:['avec-ballon','attaquant'],Duels:['defenseurs','ailiers'],'Démarquage':['milieux','attaquant'],CPA:['cpa','progression-cpa','touche-mediane'],Gardiens:['gardien'],'Jeu global':['collectif','philosophie']};
const localCoachLearningProgressions={
 discovery:{Technique:['passes','scan-receive','wall-pass'],Conservation:['passes','rondo','possession-neutral'],Relance:['passes','support','build'],Pressing:['cover','press','press-cover-three'],'Défense':['duel','cover','block'],Transitions:['rondo','secure-regain','recovery-firstpass'],Largeur:['passes','overlap','switch'],Finition:['passes','finish','finish-opposition'],Duels:['passes','duel','cover'],'Démarquage':['scan-receive','support','receive-back'],CPA:['touch','cpa-defence','cpa-attack'],Gardiens:['passes','keeper-feet','keeper-duel'],'Jeu global':['rondo','possession-neutral','freegame']},
 advanced:{Technique:['scan-receive','wall-pass','receive-back'],Conservation:['rondo-direction','possession-neutral','attract-release'],Relance:['build-three','build-pivot','thirdman-depth','build-switch'],Pressing:['press-cover-three','press-goalkick','counterpress-escape','trap'],'Défense':['block-two-lines','defend-depth','defend-cross'],Transitions:['recovery-firstpass','counter-wide','rest-defence'],Largeur:['wide-isolate','underlap','build-switch'],Finition:['box-combine','finish-opposition','far-post'],Duels:['receive-back','defend-outnumbered','retreat-delay'],'Démarquage':['receive-back','thirdman-depth','forward-runs'],CPA:['throw-progression','corner-secondball','cpa-defence'],Gardiens:['keeper-feet','keeper-distribute','keeper-duel'],'Jeu global':['attract-release','rest-defence','freegame']}
};
function localCoachGoalThemes(goal){const text=String(goal||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const rules=[['Relance',/relanc|ressort|sortir le ballon|construire/],['Pressing',/pressing|presser/],['Conservation',/conserv|possession/],['Transitions',/transition|perte|recuperation/],['Finition',/finition|finir|marquer/],['Défense',/defendr|defens|proteger/],['Largeur',/largeur|couloir|deborder/],['Démarquage',/demarqu|appel/],['CPA',/corner|coup franc|cpa/],['Gardiens',/gardien/],['Duels',/duel/],['Technique',/techni|passe/]];return rules.filter(([,test])=>test.test(text)).map(([theme])=>theme).slice(0,3);}
function localCoachPlan(session,settings={},reference=null,variant=0){
 if(typeof trainingAvailableExercises==='function'&&!trainingAvailableExercises().length)throw new Error('Choisissez les nouvelles fiches dans Exercices, puis « Voir et ajouter à ma séance ». Les anciennes propositions automatiques ont été retirées.');
 if(!trainingValid(session))throw Error('Les paramètres de séance sont invalides.');
 const inferred=localCoachGoalThemes(settings.goal);const themes=settings.goal&&Object.hasOwn(localCoachProgressions,settings.goal)?[settings.goal]:inferred.length?inferred:session.themes;
 let days=null;if(settings.matchDate){if(!trainingDateValid(settings.matchDate))throw Error('Date du match invalide.');days=Math.round((new Date(settings.matchDate+'T12:00:00')-new Date(session.date+'T12:00:00'))/86400000);if(days<0)throw Error('La date du match doit être égale ou postérieure à la séance.');}
 const light=session.coachingLoad==='light'||days!==null&&days<=2;
 const profile=bibleTrainingProfile({...session,coachingLoad:light?'light':'normal'});
 const count=session.duration>=60?4:3;
 const picks=[],used=new Set();const reasons=[];
 for(let i=0;i<count-1;i++){
  const theme=themes[i%themes.length],ageProgression=profile.band==='young'?(profile.level==='advanced'?localCoachProgressions[theme]:localCoachLearningProgressions.discovery[theme]):null,progression=ageProgression||localCoachLearningProgressions[profile.level]?.[theme]||localCoachProgressions[theme]||localCoachProgressions.Technique;
  const start=(themes.length===1?i:1)+variant;
  const preferred=progression.map((_,offset)=>progression[(start+offset)%progression.length]);
  const themed=trainingExercises.filter(e=>e.theme===theme&&!['warm','cool','freegame'].includes(e.id)).map(e=>e.id);
  const expanded=[...new Set([...preferred,...themed])];
  // Ne pas recommander silencieusement une installation qui ne tient pas.
  const compatible=typeof biblePlan==='function'?expanded.filter(id=>biblePlan(trainingExercises.find(e=>e.id===id),session).fits):expanded;
  const candidates=compatible.length?compatible:expanded;
  let id=candidates.find(id=>!used.has(id))||candidates[0]||'passes';
  if(!compatible.length&&typeof biblePlan==='function'){
   const compact=trainingExercises.filter(e=>!['warm','cool','freegame'].includes(e.id)&&!used.has(e.id)&&biblePlan(e,session).fits);
   const replacement=compact.find(e=>e.theme==='Technique')||compact[0];
   if(replacement){id=replacement.id;reasons.push('Le thème '+theme+' ne tient pas dans les contraintes saisies : proposition technique compacte à la place. Modifier l’espace ou l’organisation pour retrouver le thème.');}
   else reasons.push('Aucune installation simultanée ne convient à ces contraintes. Revoir l’espace, l’effectif actif ou le format avant d’utiliser cette proposition.');
  }
  if(session.keepers===0&&id==='keeper-duel'){id='build';reasons.push('Aucun gardien : le travail de sortie est remplacé par une relance au pied avec portes.');}
  if(light&&['transition','counter','duel'].includes(id)){id=theme==='Finition'?'finish':'passes';reasons.push('Match proche : privilégier qualité technique, repères et récupération entre les séries.');}
  if(used.has(id)){const alternatives=['passes','support','rondo','cover','build','touch'];id=alternatives.find(x=>!used.has(x)&&(typeof biblePlan!=='function'||biblePlan(trainingExercises.find(e=>e.id===x),session).fits))||id;}
  used.add(id);const exercise=trainingExercises.find(e=>e.id===id),learning=bibleExerciseLearning(exercise,session);picks.push({id,theme,reason:(i===0?'Préparer les repères et la qualité d’exécution. ':i===1?'Mettre le principe sous opposition progressive. ':'Réinvestir avec une décision à prendre. ')+exercise.goal+' '+learning.constraint});
 }
 const reinvest=typeof biblePlan==='function'&&!biblePlan(trainingExercises.find(e=>e.id==='freegame'),session).fits?(trainingExercises.find(e=>e.id==='rondo'&&biblePlan(e,session).fits)?.id||trainingExercises.find(e=>e.id==='passes'&&biblePlan(e,session).fits)?.id||'freegame'):'freegame';
 picks.push({id:reinvest,theme:themes.join(' / '),reason:reinvest==='freegame'?'Observer le transfert en jeu : un seul bonus lié au thème, puis retirer l’aide.':'Effectif ou surface limités : réinvestissement dans un format plus compact ; ajuster le score au principe travaillé.'});
 const warm=Math.max(6,Math.round(session.duration*.14)),cool=5,remaining=session.duration-warm-cool,base=Math.floor(remaining/count),rest=remaining%count;
 const references=[];
 if(reference&&Array.isArray(reference.sections)){
  const wanted=new Set(['collectif','philosophie',...themes.flatMap(t=>localCoachSectionIds[t]||[])]);
  for(const section of reference.sections)if(wanted.has(section.id))references.push({id:section.id,title:section.title,page:section.page});
 }
 const summary=[settings.goal?'Objectif saisi : '+settings.goal:'',settings.goal&&!inferred.length&&!Object.hasOwn(localCoachProgressions,settings.goal)?'Aucun thème reconnu automatiquement : les thèmes déjà choisis dans votre séance sont conservés.':'',session.players+' joueurs dont '+session.keepers+' gardien(s) · '+profile.category+' · '+profile.label+'.','Priorités : '+themes.join(', ')+'.',profile.focus,'Repère de séries : '+profile.workSeconds+' s de jeu / '+profile.restSeconds+' s de récupération ; ajustement exact selon la durée de chaque bloc. Le classement '+profile.context+' ne remplace pas le niveau de compétences renseigné.',light?'Match à J-'+days+' : proposition technique et tactique, pauses à conserver ; charge réelle à ajuster par le coach.':'Progression de l’activation vers une situation puis le jeu et le bilan.',...new Set(reasons),references.length?'Renvois à relire dans le référentiel importé (pas une validation automatique de la proposition) : '+references.map(r=>r.title+' (p. '+r.page+')').join(' ; ')+'.':'Bibliothèque du club : importer le référentiel sportif pour afficher ses renvois de pages.'].join('\n');
 const blocks=[{exerciseId:'warm',duration:warm,notes:'Activation progressive, coopération et prise d’informations. Pas de contrainte de résultat dès le départ.'},...picks.map((p,i)=>({exerciseId:p.id,duration:base+(i<rest?1:0),notes:p.reason+(light?' Match proche : séquences courtes, priorité à la qualité, récupération et feedback.':'')})),{exerciseId:'cool',duration:cool,notes:'Bilan collectif : chaque joueur formule un repère appris et un élément à reprendre.'}];
 return {title:(themes.join(' / ')+' · '+session.category+' · '+session.date).replace(/ ·  · /g,' · ').slice(0,100),themes,load:light?'light':'normal',summary,references,blocks};
}
