// Axes de travail de la fiche BMF fournie ; classement éditorial du club.
// Les transitions et CPA gardent leur thème précis sous l'intention dominante.
const bmfCategories={
 progress:{possession:'On a le ballon',label:'Conserver / Progresser'},
 finish:{possession:'On a le ballon',label:'Déséquilibrer / Finir'},
 oppose:{possession:'On n’a pas le ballon',label:'S’opposer à la progression'},
 protect:{possession:'On n’a pas le ballon',label:'S’opposer pour protéger son but'},
 complementary:{possession:'Compléments',label:'Activation, bilan & réinvestissement'}
};
const bmfExerciseGroups={
 progress:['passes','rondo','triangle','build','support','keeper-feet','touch','scan-receive','wall-pass','receive-back','escape-turn','rondo-direction','possession-neutral','possession-endzones','break-lines','attract-release','build-three','build-pivot','build-switch','recovery-firstpass','secure-regain','throw-progression','freekick-restart','keeper-distribute','rondo-expand','possession-quadrants'],
 finish:['counter','switch','overlap','finish','cutback','duel','cpa-attack','thirdman-depth','forward-runs','wide-isolate','underlap','box-combine','finish-opposition','far-post','finish-rebound','counter-wide','corner-secondball','duel-renforts','video-bounce-2v2','video-coordination-shot'],
 oppose:['press','trap','cover','block','transition','press-goalkick','press-cover-three','block-two-lines','counterpress-escape'],
 protect:['cpa-defence','keeper-duel','defend-depth','defend-cross','defend-outnumbered','rest-defence','retreat-delay'],
 complementary:['warm','cool','freegame']
};
function bmfExerciseCategory(exercise){return Object.keys(bmfExerciseGroups).find(key=>bmfExerciseGroups[key].includes(exercise.id))||'complementary';}
function bmfCategoryLabel(key){const c=bmfCategories[key];return c?c.possession+' · '+c.label:'';}
function bmfCategorySelect(select,allLabel){
 select.replaceChildren(new Option(allLabel,''));
 for(const possession of ['On a le ballon','On n’a pas le ballon','Compléments']){const group=document.createElement('optgroup');group.label=possession;for(const [key,c]of Object.entries(bmfCategories))if(c.possession===possession)group.append(new Option(c.label,key));select.append(group);}
}
