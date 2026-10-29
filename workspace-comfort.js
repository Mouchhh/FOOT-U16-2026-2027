// Même matériel et mêmes écouteurs ; les commandes se replient sur petit écran.
document.addEventListener('DOMContentLoaded',()=>{
 const board=document.querySelector('.workspace .board'),tools=el('details','comfort-board-controls');tools.id='comfort-match-tools';tools.append(el('summary','','Formation & outils du terrain'));
 const controls=[...board.children].filter(n=>n.matches('.board-toolbar,.tactic-tabs,.tactic-tool-panel'));controls[0].before(tools);tools.append(...controls);
 const context=$('game-plan-context'),intro=context.querySelector(':scope>div:first-child'),help=el('details','comfort-plan-help');help.append(el('summary','','Repères tactiques'),intro);context.prepend(help);
 let wide;
 function layout(){const next=matchMedia('(min-width:1000px) and (min-height:650px)').matches;if(next===wide)return;wide=next;if(!wide&&tools.contains(document.activeElement))tools.querySelector('summary').focus();tools.open=wide;}
 layout();window.addEventListener('resize',layout);
});
