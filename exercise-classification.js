// Grands axes et sous-parties de l’image fournie par le coach.
const bmfCategories={
 ball:{label:'Mon équipe possède le ballon'},
 loss:{label:'Mon équipe perd le ballon'},
 win:{label:'Mon équipe récupère le ballon'},
 off:{label:'Mon équipe ne possède pas le ballon'},
 ludic:{label:'Ludique'}
};
const bmfLegacyCategories={progress:'ball',finish:'ball',oppose:'off',protect:'off',complementary:'ludic'};
function bmfCanonicalCategory(key){return Object.hasOwn(bmfCategories,key)?key:(Object.hasOwn(bmfLegacyCategories,key)?bmfLegacyCategories[key]:'');}
const bmfExerciseGroups={
 ball:["passes","rondo","triangle","build","support","keeper-feet","touch","scan-receive","wall-pass","receive-back","escape-turn","rondo-direction","possession-neutral","possession-endzones","break-lines","attract-release","build-three","build-pivot","build-switch","throw-progression","freekick-restart","rondo-expand","possession-quadrants","switch","overlap","finish","cutback","duel","cpa-attack","thirdman-depth","forward-runs","wide-isolate","underlap","box-combine","finish-opposition","far-post","finish-rebound","corner-secondball","video-bounce-2v2","video-coordination-shot"],
 loss:["transition","counterpress-escape","rest-defence","retreat-delay"],
 win:["counter","recovery-firstpass","counter-wide","secure-regain","keeper-distribute","duel-renforts"],
 off:["press","trap","cover","block","press-goalkick","press-cover-three","block-two-lines","cpa-defence","keeper-duel","defend-depth","defend-cross","defend-outnumbered"],
 ludic:["warm","cool","freegame"]
};
const bmfSubcategories={
 'ball-build':{axis:'ball',label:'Zone 1 · Construire le jeu',ids:['passes','build','keeper-feet','touch','scan-receive','wall-pass','receive-back','escape-turn','build-three','build-pivot','build-switch','throw-progression','freekick-restart']},
 'ball-control':{axis:'ball',label:'Zone 2 · Maîtriser et déstabiliser',ids:['rondo','triangle','support','rondo-direction','possession-neutral','possession-endzones','break-lines','attract-release','rondo-expand','possession-quadrants','switch','overlap','thirdman-depth','forward-runs','wide-isolate','underlap','video-bounce-2v2']},
 'ball-finish':{axis:'ball',label:'Zone 3 / Box · Finition',ids:['finish','cutback','duel','cpa-attack','box-combine','finish-opposition','far-post','finish-rebound','corner-secondball','video-coordination-shot']},
 'loss-goal':{axis:'loss',label:'Zone 1 / Box · Défendre le but',ids:['rest-defence']},
 'loss-slow':{axis:'loss',label:'Zone 2 · Freiner l’attaque',ids:['retreat-delay']},
 'loss-press':{axis:'loss',label:'Zone 3 · Pressing',ids:['transition','counterpress-escape']},
 'win-forward':{axis:'win',label:'Zone 1 · Jouer vers l’avant',ids:['recovery-firstpass','secure-regain','keeper-distribute']},
 'win-zone3':{axis:'win',label:'Zone 2 · Chercher la zone 3',ids:['counter-wide']},
 'win-score':{axis:'win',label:'Zone 3 / Box · Marquer le but',ids:['counter','duel-renforts']},
 'off-low':{axis:'off',label:'Zone 1 / Box · Défendre bas',ids:['cpa-defence','keeper-duel','defend-depth','defend-cross','defend-outnumbered']},
 'off-control':{axis:'off',label:'Zone 2 · Contrôler l’adversaire',ids:['cover','block','block-two-lines']},
 'off-high':{axis:'off',label:'Zone 3 · Défendre haut',ids:['press','trap','press-goalkick','press-cover-three']}
};
function bmfTrainingThemes(axis,objective=''){
 const themes={'ball-build':['Relance'],'ball-control':['Conservation','Démarquage'],'ball-finish':['Finition'],'loss-goal':['Défense'],'loss-slow':['Transitions','Défense'],'loss-press':['Transitions','Pressing'],'win-forward':['Transitions','Relance'],'win-zone3':['Transitions','Démarquage'],'win-score':['Transitions','Finition'],'off-low':['Défense'],'off-control':['Défense'],'off-high':['Pressing']};
 const defaults={ball:['Conservation'],loss:['Transitions','Défense'],win:['Transitions'],off:['Défense'],ludic:['Technique']};
 return (Object.hasOwn(themes,objective)?themes[objective]:defaults[bmfCanonicalCategory(axis)]||[]).slice();
}
function bmfExerciseObjective(exercise){return Object.keys(bmfSubcategories).find(key=>bmfSubcategories[key].ids.includes(exercise.id))||'';}
function bmfObjectiveLabel(key){return bmfSubcategories[key]?.label||'';}
function bmfSubcategorySelect(select,axis='',value=''){
 if(!select)return;select.replaceChildren(new Option('Toutes les sous-parties',''));
 for(const [key,category]of Object.entries(bmfCategories)){if(axis&&key!==axis)continue;const entries=Object.entries(bmfSubcategories).filter(([,sub])=>sub.axis===key);if(!entries.length)continue;const parent=axis?select:document.createElement('optgroup');if(!axis)parent.label=category.label;for(const [id,sub]of entries)parent.append(new Option(sub.label,id));if(!axis)select.append(parent);}
 select.value=Object.hasOwn(bmfSubcategories,value)&&(!axis||bmfSubcategories[value].axis===axis)?value:'';
}
function bmfExerciseCategory(exercise){return Object.keys(bmfExerciseGroups).find(key=>bmfExerciseGroups[key].includes(exercise.id))||'ludic';}
function bmfCategoryLabel(key){return bmfCategories[bmfCanonicalCategory(key)]?.label||'';}
function bmfCategorySelect(select,allLabel){select.replaceChildren(new Option(allLabel,''));for(const [key,category]of Object.entries(bmfCategories))select.append(new Option(category.label,key));}
document.addEventListener('DOMContentLoaded',()=>{const select=$('training-bmf-category');if(select){bmfCategorySelect(select,'Toutes les intentions');select.value=bmfCanonicalCategory(currentTraining.bmfCategory||'');}});
