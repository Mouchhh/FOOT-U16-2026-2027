// Les flèches illustrent les intentions : elles ne constituent pas une simulation.
let beforeTactic=null;
const patterns={
 press:[[22,30,22,16],[50,30,50,14],[78,30,78,16]],
 compact:[[16,50,27,55],[84,50,73,55]],low:[[25,55,30,70],[75,55,70,70]],
 right:[[50,45,78,40],[80,65,86,45],[65,50,80,43]],shift:[[15,50,30,50],[38,50,53,50],[60,50,75,50]],cover:[[38,65,38,57],[62,65,53,74]],
 build:[[50,88,25,70],[25,70,50,50],[50,50,18,42]],six:[[50,47,50,74],[16,67,16,45],[84,67,84,45]],
 triangle:[[25,55,50,43],[50,43,55,63],[55,63,25,55]],switch:[[18,45,40,60],[40,60,80,40],[80,40,85,22]],
 overlap:[[78,30,67,30],[84,67,90,30],[67,30,90,24]],underlap:[[80,35,87,23],[84,69,68,28]],
 five:[[16,35,16,22],[33,35,33,22],[50,32,50,17],[67,35,67,22],[84,35,84,22]],
 cross:[[35,25,60,14],[65,25,40,38]],false9:[[50,15,50,35],[22,20,40,12],[78,20,60,12]],
 cutback:[[84,38,87,13],[87,13,55,28],[50,40,55,28]],counter:[[50,65,30,45],[30,45,40,15],[75,60,75,20]],
 retreat:[[22,25,30,55],[50,35,50,65],[78,25,70,55]],
 corner:[[94,6,59,15],[50,30,59,15],[30,30,38,14]],shortcorner:[[94,6,88,22],[88,22,78,12],[78,12,50,18]],
 defcorner:[[94,94,60,84],[50,70,60,84],[32,78,40,85]],freekick:[[77,38,45,15],[30,28,45,15],[62,30,65,14]],
 wall:[[50,72,50,67],[40,80,35,75]],throw:[[94,50,78,46],[78,46,88,32],[88,32,68,37]]
};
function normalizeSearch(text){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function showTactics(){
 const query=normalizeSearch($('tactics-search').value.trim());const category=$('tactics-category').value;
 const results=tacticsCatalogue.filter(t=>(!category||t.category===category)&&normalizeSearch([t.title,t.goal,...t.steps,t.formation].join(' ')).includes(query));
 $('tactics-count').textContent=results.length+' plan'+(results.length>1?'s':'')+' de jeu';$('tactics-results').replaceChildren();
 if(!results.length)$('tactics-results').append(el('p','hint','Aucune tactique trouvée. Essayez un autre mot ou une autre catégorie.'));
 results.forEach(t=>{
  const card=el('article','tactic-card');const head=el('div','section-heading');head.append(el('span','tactic-category',t.category),el('span','tactic-formation',t.formation));
  card.append(head,el('h3','',t.title),el('p','tactic-goal',t.goal));
  const list=el('ol');t.steps.forEach(step=>list.append(el('li','',step)));card.append(list);
  const risk=el('p','tactic-attention');risk.append(el('strong','','Vigilance : '),document.createTextNode(t.attention));card.append(risk);
  const apply=el('button','primary','Appliquer le schéma');apply.onclick=()=>applyTactic(t);card.append(apply);$('tactics-results').append(card);
 });
}
$('open-tactics').onclick=()=>{showTactics();$('tactics-dialog').showModal();};$('close-tactics').onclick=()=>$('tactics-dialog').close();
$('tactics-search').oninput=showTactics;$('tactics-category').onchange=showTactics;
function applyTactic(t){
 const starters=state.players.filter(p=>p.role!=='sub');
 if(starters.length!==11){notify('Ce schéma nécessite 11 titulaires. Ajustez votre effectif avant de l’appliquer.');return;}
 if(!confirm('Appliquer « '+t.title+' » ? La formation, les positions, les flèches et les consignes actuelles seront remplacées. Les joueurs, photos et remplaçants seront conservés.'))return;
 beforeTactic=structuredClone(state);
 // Conserver le gardien en dernier quand il est identifiable par son numéro.
 const keeper=starters.find(p=>p.number===1)||starters.at(-1);
 const ordered=[...starters.filter(p=>p!==keeper),keeper];
 state.formation=t.formation;
 ordered.forEach((p,i)=>{[p.x,p.y]=layouts[t.formation][i];});
 // Ajuster la hauteur du bloc pour rendre le principe visible.
 if(t.pattern==='press')ordered.filter(p=>p!==keeper).forEach(p=>p.y=Math.max(12,p.y-12));
 if(t.pattern==='low'||t.pattern==='defcorner')ordered.filter(p=>p!==keeper).forEach(p=>p.y=48+(p.y-18)*.65);
 if(t.pattern==='compact')ordered.filter(p=>p!==keeper).forEach(p=>p.y=35+(p.y-18)*.6);
 if(t.pattern==='shift')ordered.filter(p=>p!==keeper).forEach(p=>p.x=Math.min(92,p.x+10));
 state.arrows=structuredClone(patterns[t.pattern]||[]);
 state.notes=t.title+' — '+t.formation+'\nObjectif : '+t.goal+'\n\n'+t.steps.map((step,i)=>(i+1)+'. '+step).join('\n')+'\n\nVigilance : '+t.attention+'\n\nRepère : attaque vers le haut ; schéma pédagogique à adapter.';
 render();persist();$('undo-tactic').hidden=false;$('tactics-dialog').close();notify('Plan de jeu appliqué : '+t.title+'.');
}
$('undo-tactic').onclick=()=>{
 if(!beforeTactic)return;
 if(!confirm('Restaurer la composition avant la dernière tactique ? Vos modifications effectuées depuis seront remplacées.'))return;
 state=beforeTactic;beforeTactic=null;render();persist();$('undo-tactic').hidden=true;notify('Composition précédente restaurée.');
};
