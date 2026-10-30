// Grands axes de l’image fournie par le coach ; aucune sous-catégorie dans le menu.
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
function bmfExerciseCategory(exercise){return Object.keys(bmfExerciseGroups).find(key=>bmfExerciseGroups[key].includes(exercise.id))||'ludic';}
function bmfCategoryLabel(key){return bmfCategories[bmfCanonicalCategory(key)]?.label||'';}
function bmfCategorySelect(select,allLabel){select.replaceChildren(new Option(allLabel,''));for(const [key,category]of Object.entries(bmfCategories))select.append(new Option(category.label,key));}
document.addEventListener('DOMContentLoaded',()=>{const select=$('training-bmf-category');if(select){bmfCategorySelect(select,'Toutes les intentions');select.value=bmfCanonicalCategory(currentTraining.bmfCategory||'');}});
