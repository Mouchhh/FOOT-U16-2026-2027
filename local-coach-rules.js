// Assistant à règles : aucun modèle, API, dépendance ou appel réseau.
const localCoachProgressions={
 'Technique':['passes','duel','support'],Conservation:['passes','rondo','transition'],Relance:['passes','triangle','build'],Pressing:['cover','press','trap'],'Défense':['cover','block','transition'],Transitions:['rondo','transition','counter'],Largeur:['passes','overlap','switch'],Finition:['passes','finish','cutback'],Duels:['passes','duel','cover'],'Démarquage':['passes','support','triangle'],CPA:['touch','cpa-defence','cpa-attack'],Gardiens:['passes','keeper-feet','keeper-duel'],'Jeu global':['rondo','support','switch']
};
const localCoachSectionIds={Technique:['philosophie','collectif'],Conservation:['avec-ballon','recuperation'],Relance:['avec-ballon','gardien','base'],Pressing:['perte','collectif'],'Défense':['perte','defenseurs','sentinelle'],Transitions:['perte','recuperation'],Largeur:['avec-ballon','lateraux','ailiers'],Finition:['avec-ballon','attaquant'],Duels:['defenseurs','ailiers'],'Démarquage':['milieux','attaquant'],CPA:['cpa','progression-cpa','touche-mediane'],Gardiens:['gardien'],'Jeu global':['collectif','philosophie']};
function localCoachPlan(session,settings={},reference=null,variant=0){
 if(!trainingValid(session))throw Error('Les paramètres de séance sont invalides.');
 const themes=settings.goal&&Object.hasOwn(localCoachProgressions,settings.goal)?[settings.goal]:session.themes;
 let days=null;if(settings.matchDate){if(!trainingDateValid(settings.matchDate))throw Error('Date du match invalide.');days=Math.round((new Date(settings.matchDate+'T12:00:00')-new Date(session.date+'T12:00:00'))/86400000);if(days<0)throw Error('La date du match doit être égale ou postérieure à la séance.');}
 const light=days!==null&&days<=2;
 const count=session.duration>=60?4:3;
 const picks=[],used=new Set();const reasons=[];
 for(let i=0;i<count-1;i++){
  const theme=themes[i%themes.length],progression=localCoachProgressions[theme]||localCoachProgressions.Technique;
  const start=(themes.length===1?i:1)+variant;
  const candidates=progression.map((_,offset)=>progression[(start+offset)%progression.length]);
  let id=candidates.find(id=>!used.has(id))||progression[i%progression.length];
  if(session.keepers===0&&id==='keeper-duel'){id='build';reasons.push('Aucun gardien : le travail de sortie est remplacé par une relance au pied avec portes.');}
  if(session.players<8&&['cpa-attack','cpa-defence'].includes(id)){id='touch';reasons.push('Effectif réduit : travailler les responsabilités sur une touche plutôt qu’une organisation complète de corner.');}
  if(light&&['transition','counter','duel'].includes(id)){id=theme==='Finition'?'finish':'passes';reasons.push('Match proche : privilégier qualité technique, repères et récupération entre les séries.');}
  if(used.has(id)){const alternatives=['passes','support','rondo','cover','build','touch'];id=alternatives.find(x=>!used.has(x))||id;}
  used.add(id);const exercise=trainingExercises.find(e=>e.id===id);picks.push({id,theme,reason:(i===0?'Préparer les repères et la qualité d’exécution. ':i===1?'Mettre le principe sous opposition progressive. ':'Réinvestir avec une décision à prendre. ')+exercise.goal});
 }
 picks.push({id:'freegame',theme:themes.join(' / '),reason:'Observer le transfert en jeu : un seul bonus lié au thème, puis retirer l’aide.'});
 const warm=Math.max(6,Math.round(session.duration*.14)),cool=5,remaining=session.duration-warm-cool,base=Math.floor(remaining/count),rest=remaining%count;
 const references=[];
 if(reference&&Array.isArray(reference.sections)){
  const wanted=new Set(['collectif','philosophie',...themes.flatMap(t=>localCoachSectionIds[t]||[])]);
  for(const section of reference.sections)if(wanted.has(section.id))references.push({id:section.id,title:section.title,page:section.page});
 }
 const summary=[session.players+' joueurs dont '+session.keepers+' gardien(s), '+session.age+' ans, '+trainingLevels[session.level]+'.','Priorités : '+themes.join(', ')+'.',session.level==='discovery'||session.age<15?'Commencer avec peu de contraintes puis ajouter l’opposition selon les réussites.':'Faire évoluer les contraintes à partir des réponses observées, sans confondre classement et compétences.',light?'Match à J-'+days+' : proposition technique et tactique, pauses à conserver ; charge réelle à ajuster par le coach.':'Progression de l’activation vers une situation puis le jeu et le bilan.',...new Set(reasons),references.length?'Référentiel importé : '+references.map(r=>r.title+' (p. '+r.page+')').join(' ; ')+'.':'Bibliothèque du club : importer le référentiel sportif pour afficher ses renvois de pages.'].join('\n');
 const blocks=[{exerciseId:'warm',duration:warm,notes:'Activation progressive, coopération et prise d’informations. Pas de contrainte de résultat dès le départ.'},...picks.map((p,i)=>({exerciseId:p.id,duration:base+(i<rest?1:0),notes:p.reason+(light?' Match proche : séquences courtes, priorité à la qualité, récupération et feedback.':'')})),{exerciseId:'cool',duration:cool,notes:'Bilan collectif : chaque joueur formule un repère appris et un élément à reprendre.'}];
 return {title:(themes.join(' / ')+' · '+session.category+' · '+session.date).replace(/ ·  · /g,' · ').slice(0,100),themes,load:light?'light':'normal',summary,references,blocks};
}
