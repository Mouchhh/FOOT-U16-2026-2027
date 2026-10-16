// Préparation du match inspirée du tableau fourni ; stockée avec chaque composition.
const matchPlanFields={date:'Date du match',title:'Type de rencontre',match:'Préparation du match',context:'Contexte du match',opponent:'Adversaire',defensive:'Animation défensive / système',offensive:'Animation offensive / système',specific:'Spécificités / compléments du plan de jeu'};
const matchPlanLimits={date:10,title:100,match:120,context:3000,opponent:3000,defensive:4000,offensive:4000,specific:4000};
function newMatchPreparation(){return {date:'',title:'',match:'',context:'',opponent:'',objectives:['','','',''],defensive:'',offensive:'',specific:''};}
function validMatchPreparation(plan){
 if(plan===undefined)return true;
 if(!plan||typeof plan!=='object'||Array.isArray(plan)||!Object.entries(matchPlanLimits).every(([key,limit])=>typeof plan[key]==='string'&&plan[key].length<=limit))return false;
 if(plan.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(plan.date)||!Number.isFinite(Date.parse(plan.date+'T12:00:00Z'))||new Date(plan.date+'T12:00:00Z').toISOString().slice(0,10)!==plan.date))return false;
 return Array.isArray(plan.objectives)&&plan.objectives.length===4&&plan.objectives.every(value=>typeof value==='string'&&value.length<=300);
}
function matchPreparationFilled(plan){return !!plan&&(Object.keys(matchPlanFields).some(key=>plan[key]?.trim())||plan.objectives.some(value=>value.trim()));}
function matchPreparationDocument(plan){
 const section=el('section','match-preparation-document');section.append(el('h3','','Préparation du match'));
 for(const [key,label] of Object.entries(matchPlanFields))if(plan[key]?.trim()){section.append(el('h4','',label),el('p','',plan[key]));}
 if(plan.objectives.some(value=>value.trim())){section.append(el('h4','','Objectif du jour / idées fortes'));const list=el('ol');plan.objectives.forEach((value,index)=>{if(value.trim()){const item=el('li','',value);item.value=index+1;list.append(item);}});section.append(list);}
 return section;
}
function renderMatchPreparation(){
 const plan=state.matchPreparation||newMatchPreparation();
 for(const key of Object.keys(matchPlanFields))if($('match-plan-'+key).value!==plan[key])$('match-plan-'+key).value=plan[key];
 plan.objectives.forEach((value,index)=>{if($('match-plan-objective-'+index).value!==value)$('match-plan-objective-'+index).value=value;});
 $('match-plan-summary').textContent=[plan.date,plan.title,plan.match].filter(Boolean).join(' · ')||'Préparez votre causerie et vos priorités de jeu.';
 const root=$('match-plan-priorities');root.replaceChildren();plan.objectives.forEach((value,index)=>{if(value.trim()){const item=el('li','',value);item.value=index+1;root.append(item);}});root.hidden=!root.childElementCount;
 $('legacy-tactical-notes').hidden=!state.notes.trim();
}
function updateMatchPreparation(key,value,index){
 const next=structuredClone(state.matchPreparation||newMatchPreparation());if(key==='objectives')next.objectives[index]=value;else next[key]=value;
 if(!validMatchPreparation(next))return;
 state.matchPreparation=next;const stored=persist();renderMatchPreparation();$('match-plan-status').textContent=stored===false?'Brouillon non enregistré sur cet appareil : vérifiez le stockage.':'Brouillon conservé. Enregistrez la composition pour conserver cette version dans votre bibliothèque.';
}
document.addEventListener('DOMContentLoaded',()=>{
 const renderBeforePreparation=render;render=function(){renderBeforePreparation();renderMatchPreparation();};
 for(const key of Object.keys(matchPlanFields))$('match-plan-'+key).addEventListener('input',event=>updateMatchPreparation(key,event.target.value));
 for(let index=0;index<4;index++)$('match-plan-objective-'+index).addEventListener('input',event=>updateMatchPreparation('objectives',event.target.value,index));
 $('match-plan-open').onclick=()=>{renderMatchPreparation();$('match-plan-status').textContent='Cette préparation est liée à la composition affichée.';$('match-plan-dialog').showModal();};
 $('match-plan-close').onclick=()=>$('match-plan-dialog').close();
 $('match-plan-form').onsubmit=event=>{event.preventDefault();if(!valid(state))return notify('Vérifiez les champs de la composition.');$('save').click();$('match-plan-dialog').close();};
 renderMatchPreparation();
});
