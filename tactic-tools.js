// Trois onglets d'outils distincts pour le terrain avec les joueurs du coach.
const tacticToolTabs=[{id:'move',name:'move'},{id:'arrow',name:'arrow'},{id:'tactic-opponents-tab',name:'opponents'}];
function showTacticTool(name){
 for(const tab of tacticToolTabs){const selected=tab.name===name;$(tab.id).setAttribute('aria-selected',String(selected));$(tab.id).tabIndex=selected?0:-1;$(tab.id).classList.toggle('active',selected);$('tactic-panel-'+tab.name).hidden=!selected;}
}
$('move').addEventListener('click',()=>showTacticTool('move'));
$('arrow').addEventListener('click',()=>showTacticTool('arrow'));
$('tactic-opponents-tab').onclick=()=>{$('move').click();showTacticTool('opponents');if(!state.opponents?.visible)$('opponents-toggle').click();};
for(let i=0;i<tacticToolTabs.length;i++)$(tacticToolTabs[i].id).addEventListener('keydown',event=>{
 let target;if(event.key==='ArrowRight')target=(i+1)%3;else if(event.key==='ArrowLeft')target=(i+2)%3;else if(event.key==='Home')target=0;else if(event.key==='End')target=2;else return;
 event.preventDefault();const button=$(tacticToolTabs[target].id);button.click();button.focus();
});
showTacticTool('move');
