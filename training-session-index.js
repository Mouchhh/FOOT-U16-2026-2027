// Use the same declared intentions and zone objectives as the exercise library.
// Classification is derived for display only; saved sessions are never rewritten.
const trainingSessionObjectives=Object.entries(bmfSubcategories).map(([id,entry])=>[id,entry.label,[]]);
function trainingSessionIndex(session){
 const themes=(session.themes||[]).filter(t=>trainingThemes.includes(t)),allBlocks=session.blocks||[],axes=new Set(),objectives=new Set(),declared=bmfCanonicalCategory(session.bmfCategory||'');
 if(declared)axes.add(declared);
 if(session.bmfObjective&&bmfSubcategories[session.bmfObjective]?.axis===declared)objectives.add(session.bmfObjective);
 const indexedBlocks=allBlocks.some(b=>!['warm','cool','freegame'].includes(b.exerciseId))?allBlocks.filter(b=>!['warm','cool','freegame'].includes(b.exerciseId)):allBlocks;
 for(const block of indexedBlocks){let axis='',objective='';
  if(block.exerciseId==='custom'){
   const imported=typeof suppliedExerciseEngine!=='undefined'?suppliedExerciseEngine.getExercise(block.custom?.importedExerciseId,block.custom?.importedExerciseView||0):null;
   if(imported){const c=typeof clubExerciseClassification==='function'?clubExerciseClassification(imported):{axis:suppliedMomentAxes[imported.moment],objective:suppliedObjective(imported)};axis=c.axis;objective=c.objective;}
  }else{const exercise=trainingExercises.find(e=>e.id===block.exerciseId);if(exercise){axis=bmfExerciseCategory(exercise);objective=bmfExerciseObjective(exercise);}}
  if(!declared&&axis)axes.add(axis);
  if(!session.bmfObjective&&objective&&(!declared||axis===declared))objectives.add(objective);
 }
 // Only unambiguous legacy themes can supply an intention when nothing was declared.
 if(!axes.size)for(const theme of themes){const objective={Relance:'ball-build',Conservation:'ball-control',Finition:'ball-finish',Largeur:'ball-control',Démarquage:'ball-control'}[theme];if(objective){axes.add('ball');objectives.add(objective);}}
 const mainBlocks=allBlocks.filter(b=>!['warm','cool'].includes(b.exerciseId)),goals=(mainBlocks.length?mainBlocks:allBlocks).map(b=>b.exerciseId==='custom'?b.custom?.goal:trainingExercises.find(e=>e.id===b.exerciseId)?.goal).filter(Boolean),objective=session.notes?.trim()||[...new Set(goals)].slice(0,2).join(' · ')||'Objectif à préciser';
 const blockNames=allBlocks.map(b=>b.bibleVariant?.title||b.custom?.title||trainingExercises.find(e=>e.id===b.exerciseId)?.title||''),axisList=[...axes],objectiveList=[...objectives];
 const text=[...blockNames,session.title,session.team,session.category,session.coach,session.date,session.notes,...themes,...goals,...axisList.map(bmfCategoryLabel),...objectiveList.map(bmfObjectiveLabel)].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 return {themes,axes:axisList,objectives:objectiveList,objective,text,sector:axisList.length===1?bmfCategoryLabel(axisList[0]):axisList.length?'Plusieurs intentions de jeu':'Intention de jeu à préciser'};
}
