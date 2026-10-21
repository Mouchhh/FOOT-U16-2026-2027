// Classification from the coach's declared themes, without changing saved sessions.
const trainingSessionObjectives=[
 ['keep','Conserver le ballon',['Conservation']],['progress','Progresser / relancer',['Relance','Démarquage']],['create','Créer un décalage',['Largeur','Démarquage']],['finish','Conclure / marquer',['Finition']],['defend','Défendre / récupérer',['Pressing','Défense','Duels']],['transition','Changer de statut',['Transitions']],['technique','Maîtriser les gestes',['Technique']],['restart','Organiser les CPA',['CPA']],['keeper','Travail des gardiens',['Gardiens']],['global','Réinvestir en match',['Jeu global']]
];
function trainingSessionIndex(session){
 const themes=(session.themes||[]).filter(t=>trainingThemes.includes(t)),objectives=trainingSessionObjectives.filter(([,label,related])=>related.some(t=>themes.includes(t))).map(([id])=>id),allBlocks=session.blocks||[],mainBlocks=allBlocks.filter(b=>!['warm','cool'].includes(b.exerciseId)),goals=(mainBlocks.length?mainBlocks:allBlocks).map(b=>b.exerciseId==='custom'?b.custom?.goal:trainingExercises.find(e=>e.id===b.exerciseId)?.goal).filter(Boolean);
 const objective=session.notes?.trim()||[...new Set(goals)].slice(0,2).join(' · ')||'Objectif à préciser';
 const blockNames=allBlocks.map(b=>b.bibleVariant?.title||b.custom?.title||trainingExercises.find(e=>e.id===b.exerciseId)?.title||'');
 const text=[...blockNames,session.title,session.team,session.category,session.coach,session.date,session.notes,...themes,...goals,...objectives.map(id=>trainingSessionObjectives.find(o=>o[0]===id)[1])].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 return {themes,objectives,objective,text,sector:themes[0]||'Autres séances'};
}
