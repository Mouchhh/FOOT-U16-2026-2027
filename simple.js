// Schémas pédagogiques maison, distincts des compositions du coach.
const simpleScenarios={
 press:{title:'Presser ensemble',goal:'Un joueur sort ; les autres ferment les solutions.',tokens:[['B1',40,40,'own'],['B2',65,45,'own'],['B3',45,61,'own'],['A1',35,25,'away'],['A2',70,27,'away'],['A3',50,48,'away']],ball:[35,29],steps:[
 ['Orienter','B1 approche le porteur en fermant la passe vers l’axe. Ne pas se jeter.',[[0,32,30,'move']]],
 ['Fermer les relais','B2 et B3 avancent pour fermer les solutions proches. Le pressing reste collectif.',[[0,32,30,'move'],[1,67,34,'move'],[2,50,54,'move']]],
 ['Récupérer ou se replier','Sur contrôle manqué : intervenir ensemble. Si la première ligne est éliminée : revenir protéger l’axe.',[[0,35,27,'move'],[2,50,68,'move']]]]},
 trap:{title:'Enfermer sur un côté',goal:'Utiliser la ligne de touche pour réduire les solutions.',tokens:[['B1',68,42,'own'],['B2',80,63,'own'],['B3',55,53,'own'],['A1',85,30,'away'],['A2',60,32,'away'],['A3',84,53,'away']],ball:[86,34],steps:[
 ['Orienter vers la ligne','B1 approche de l’intérieur pour rendre la passe axiale difficile.',[[0,80,35,'move']]],
 ['Fermer devant et dedans','B2 contrôle la sortie le long de la ligne. B3 réduit l’espace intérieur.',[[1,83,57,'move'],[2,66,45,'move']]],
 ['Coulisser ensemble','Les partenaires du côté opposé se resserrent. Si l’adversaire renverse, le bloc se déplace.',[[2,72,45,'move']]]]},
 build:{title:'Ressortir le ballon',goal:'Créer des angles de passe autour du porteur.',tokens:[['GB',50,86,'own'],['DC1',25,70,'own'],['DC2',75,70,'own'],['6',50,53,'own'],['A1',42,65,'away'],['A2',65,53,'away']],ball:[50,81],steps:[
 ['S’écarter','Les défenseurs donnent deux solutions au gardien. Le 6 cherche une ligne de passe visible.',[[1,20,69,'move'],[2,80,69,'move']]],
 ['Attirer puis trouver le libre','Le gardien joue vers DC1 si la ligne est libre. DC2 et le 6 gardent leurs angles.',[[0,25,70,'pass']]],
 ['Progresser ou revenir','DC1 cherche le 6. Si la passe est fermée, revenir au gardien et changer de côté.',[[1,50,53,'pass'],[1,50,86,'pass']]]]},
 third:{title:'Trouver le troisième homme',goal:'Passer par un appui pour libérer un partenaire face au jeu.',tokens:[['B1',30,70,'own'],['B2',40,45,'own'],['B3',70,62,'own'],['A1',55,50,'away'],['A2',40,33,'away']],ball:[30,66],steps:[
 ['Trouver l’appui','B1 joue sur B2. B2 regarde avant de recevoir et protège sa remise.',[[0,40,45,'pass']]],
 ['Préparer la remise','B3 se démarque en diagonale. B2 évite de garder le ballon sous pression.',[[2,67,48,'move']]],
 ['Jouer face au jeu','B2 remet vers B3. B3 reçoit ouvert et choisit la suite selon l’adversaire.',[[1,67,48,'pass']]]]}
};
// Tableau libre : deux équipes à onze, avec leur gardien n° 1, indépendantes de la composition.
const simpleElevenPositions=[[1,50,90],[2,84,78],[3,16,78],[4,38,81],[5,62,81],[6,50,69],[8,28,65],[10,72,65],[7,83,54],[9,50,53],[11,17,54]];
simpleScenarios.eleven={title:'11 contre 11',goal:'Deux équipes numérotées de 1 à 11 pour expliquer vos principes collectifs.',free:true,
 tokens:[...simpleElevenPositions.map(([n,x,y])=>[String(n),x,y,'own']),...simpleElevenPositions.map(([n,x,y])=>[String(n),100-x,100-y,'away'])],ball:[57,50],
 steps:[['Placement libre','Déplacez les 22 pions et le ballon pour expliquer le pressing, la relance ou le déplacement du bloc.',[]],['Organisation','Chaque équipe possède les numéros 1 à 11. Les gardiens portent le numéro 1.',[]],['Ajustements','Vous pouvez masquer les adversaires, ajouter ou retirer des pions et adapter leurs numéros.',[]]]};
let simpleState=null,simpleSelected=null,simpleDrag=null;
function simpleValid(s){return s&&(s.sequenceId===undefined||(typeof s.sequenceId==='string'&&s.sequenceId.length<=100))&&(s.sequenceTitle===undefined||(typeof s.sequenceTitle==='string'&&s.sequenceTitle.length<=100))&&(s.showOpponents===undefined||typeof s.showOpponents==='boolean')&&Object.hasOwn(simpleScenarios,s.scenario)&&Number.isInteger(s.step)&&s.step>=0&&s.step<3&&Array.isArray(s.tokens)&&s.tokens.length<=40&&new Set(s.tokens.map(t=>t?.id)).size===s.tokens.length&&s.tokens.every(t=>t&&typeof t.id==='string'&&typeof t.label==='string'&&t.label.length<=20&&['own','away'].includes(t.side)&&coords(t))&&coords(s.ball);}
function coords(t){return t&&Number.isFinite(t.x)&&t.x>=5&&t.x<=95&&Number.isFinite(t.y)&&t.y>=6&&t.y<=93;}
function saveSimple(){try{coachStorageSet('vestiaire-simple',JSON.stringify(simpleState));}catch{notify('Tableau non sauvegardé : stockage indisponible.');}}
function loadSimple(scenario,step=0){
 const showOpponents=simpleState?.showOpponents!==false;const s=simpleScenarios[scenario];simpleState={scenario,step,showOpponents,tokens:s.tokens.map(([label,x,y,side],i)=>({id:'s'+i,label,x,y,side})),ball:{x:s.ball[0],y:s.ball[1]}};
 // La dernière étape de la sortie courte part du ballon arrivé au défenseur.
 if(scenario==='build'&&step===2)simpleState.ball={x:25,y:70};
 if(scenario==='third'&&step===2){simpleState.tokens[2].x=67;simpleState.tokens[2].y=48;simpleState.ball={x:40,y:45};}
 simpleSelected=null;renderSimple();saveSimple();
}
try{const saved=JSON.parse(coachStorageGet('vestiaire-simple')||'null');if(simpleValid(saved))simpleState=saved;}catch{}
$('simple-pitch').append(document.querySelector('.markings').cloneNode(true));
const simpleSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');simpleSvg.id='simple-lines';simpleSvg.setAttribute('viewBox','0 0 100 100');simpleSvg.setAttribute('preserveAspectRatio','none');
const defs=document.createElementNS(simpleSvg.namespaceURI,'defs');const marker=document.createElementNS(simpleSvg.namespaceURI,'marker');for(const [k,v] of Object.entries({id:'simple-head',markerWidth:4,markerHeight:4,refX:3,refY:2,orient:'auto'}))marker.setAttribute(k,v);const tip=document.createElementNS(simpleSvg.namespaceURI,'path');tip.setAttribute('d','M0 0L4 2L0 4');tip.setAttribute('fill','none');tip.setAttribute('stroke','#fff');tip.setAttribute('stroke-width','.7');marker.append(tip);defs.append(marker);simpleSvg.append(defs);const simpleLines=document.createElementNS(simpleSvg.namespaceURI,'g');simpleSvg.append(simpleLines);$('simple-pitch').append(simpleSvg);
const simpleTokens=el('div','simple-tokens');$('simple-pitch').append(simpleTokens);
function renderSimpleArrows(){
 simpleLines.replaceChildren();const s=simpleScenarios[simpleState.scenario];s.steps[simpleState.step][2].forEach(([index,x,y,type])=>{
 const p=simpleState.tokens.find(t=>t.id==='s'+index);if(!p)return;
 const line=document.createElementNS(simpleSvg.namespaceURI,'line');for(const [k,v] of Object.entries({x1:p.x,y1:p.y,x2:x,y2:y,stroke:'#fff','stroke-width':.5,'marker-end':'url(#simple-head)'}))line.setAttribute(k,v);if(type==='pass')line.setAttribute('stroke-dasharray','1.4 1.2');simpleLines.append(line);
 });
}
function selectSimple(id){simpleSelected=id;const t=simpleState.tokens.find(t=>t.id===id);$('simple-label').value=t?.label||'';$('simple-label').disabled=!t;$('simple-remove').disabled=!t;simpleTokens.querySelectorAll('.simple-token').forEach(b=>b.classList.toggle('selected',b.dataset.id===id));}
function renderSimple(){
 const s=simpleScenarios[simpleState.scenario];$('simple-scenario').value=simpleState.scenario;$('simple-title').textContent=s.title;$('simple-objective').textContent=s.goal;
 $('simple-step-title').textContent=(simpleState.step+1)+'. '+s.steps[simpleState.step][0];$('simple-step-text').textContent=s.steps[simpleState.step][1];
 $('simple-steps').hidden=!!s.free;$('simple-steps').replaceChildren();s.steps.forEach((step,i)=>{const b=el('button',i===simpleState.step?'active':'',String(i+1));b.setAttribute('aria-label',step[0]);b.setAttribute('aria-pressed',String(i===simpleState.step));b.onclick=()=>{if(confirm('Charger cette étape ? Les pions du tableau simple seront replacés.'))loadSimple(simpleState.scenario,i);};$('simple-steps').append(b);});
 const ownCount=simpleState.tokens.filter(t=>t.side==='own').length,awayCount=simpleState.tokens.filter(t=>t.side==='away').length;$('simple-team-count').textContent=ownCount+' bleus · '+awayCount+' adversaires'+(simpleState.showOpponents===false?' (masqués)':'');$('simple-eleven').setAttribute('aria-pressed',String(simpleState.scenario==='eleven'));
 $('simple-opponents').textContent='Adversaires : '+(simpleState.showOpponents===false?'non':'oui');$('simple-opponents').setAttribute('aria-pressed',String(simpleState.showOpponents!==false));
 simpleTokens.replaceChildren();[...simpleState.tokens.filter(t=>t.side!=='away'||simpleState.showOpponents!==false),{id:'ball',label:'●',side:'ball',...simpleState.ball}].forEach(t=>{
 const b=el('button','simple-token '+t.side,t.label);b.dataset.id=t.id;b.style.left=t.x+'%';b.style.top=t.y+'%';b.setAttribute('aria-label',t.side==='ball'?'Ballon':(t.side==='own'?'Bleu ':'Adversaire ')+t.label);b.onfocus=()=>selectSimple(t.id);
 b.onkeydown=e=>{const d=boardKeyStep(e.key);if(d){e.preventDefault();const p=t.id==='ball'?simpleState.ball:simpleState.tokens.find(p=>p.id===t.id);p.x=Math.max(5,Math.min(95,p.x+d[0]));p.y=Math.max(6,Math.min(93,p.y+d[1]));b.style.left=p.x+'%';b.style.top=p.y+'%';renderSimpleArrows();saveSimple();}};simpleTokens.append(b);
 });selectSimple(simpleSelected);renderSimpleArrows();
}
function simplePoint(e){const r=$('simple-pitch').getBoundingClientRect();const x=(e.clientX-r.left)*100/r.width,y=(e.clientY-r.top)*100/r.height;return document.body.classList.contains('landscape-mode')?[y,100-x]:[x,y];}
$('simple-pitch').onpointerdown=e=>{if(e.button!==0)return;const b=e.target.closest('.simple-token');if(!b)return;e.preventDefault();selectSimple(b.dataset.id);const p=b.dataset.id==='ball'?simpleState.ball:simpleState.tokens.find(t=>t.id===b.dataset.id);const [x,y]=simplePoint(e);simpleDrag={id:e.pointerId,p,b,dx:p.x-x,dy:p.y-y};$('simple-pitch').setPointerCapture(e.pointerId);};
$('simple-pitch').onpointermove=e=>{if(!simpleDrag||e.pointerId!==simpleDrag.id)return;const [x,y]=simplePoint(e);const {p,b,dx,dy}=simpleDrag;p.x=Math.max(5,Math.min(95,x+dx));p.y=Math.max(6,Math.min(93,y+dy));b.style.left=p.x+'%';b.style.top=p.y+'%';renderSimpleArrows();};
for(const type of ['pointerup','pointercancel'])$('simple-pitch').addEventListener(type,e=>{if(simpleDrag?.id===e.pointerId){simpleDrag=null;saveSimple();}});
function setSimpleMode(on){document.body.classList.remove('focus-mode');$('mode-focus').classList.remove('active');$('mode-focus').setAttribute('aria-pressed','false');document.body.classList.toggle('simple-mode',on);$('simple-board').hidden=!on;$('mode-simple').classList.toggle('active',on);$('mode-team').classList.toggle('active',!on);$('mode-simple').setAttribute('aria-pressed',String(on));$('mode-team').setAttribute('aria-pressed',String(!on));if(on)renderSimple();}
$('mode-simple').onclick=()=>setSimpleMode(true);$('mode-team').onclick=()=>setSimpleMode(false);
$('simple-scenario').onchange=e=>{if(confirm('Charger cette situation ? Le tableau simple actuel sera remplacé.'))loadSimple(e.target.value);else e.target.value=simpleState.scenario;};
for(const [id,side] of [['simple-own','own'],['simple-away','away']])$(id).onclick=()=>{if(simpleState.tokens.length>=40)return notify('40 pions maximum.');const t={id:crypto.randomUUID(),label:String(Array.from({length:40},(_,i)=>i+1).find(n=>!simpleState.tokens.some(t=>t.side===side&&t.label===String(n)))||simpleState.tokens.filter(t=>t.side===side).length+1),side,x:50,y:50};simpleState.tokens.push(t);simpleSelected=t.id;renderSimple();saveSimple();};
$('simple-label').oninput=e=>{const t=simpleState.tokens.find(t=>t.id===simpleSelected);if(t){t.label=e.target.value;const b=[...simpleTokens.children].find(b=>b.dataset.id===t.id);b.textContent=t.label;saveSimple();}};
$('simple-remove').onclick=()=>{simpleState.tokens=simpleState.tokens.filter(t=>t.id!==simpleSelected);simpleSelected=null;renderSimple();saveSimple();};
$('simple-reset').onclick=()=>{if(confirm('Réinitialiser cette situation ?'))loadSimple(simpleState.scenario);};
$('simple-pdf').onclick=()=>{document.title='Explication — '+(simpleState.sequenceTitle?.trim()||simpleScenarios[simpleState.scenario].title);window.print();};
$('simple-eleven').onclick=()=>{if(confirm('Charger 11 contre 11 ? Les pions actuels seront remplacés. Votre composition reste conservée.'))loadSimple('eleven');};
if(!simpleState)loadSimple('eleven');else renderSimple();

$('mode-focus').onclick=()=>{setSimpleMode(false);document.body.classList.add('focus-mode');$('mode-focus').classList.add('active');$('mode-focus').setAttribute('aria-pressed','true');$('mode-team').classList.remove('active');$('mode-team').setAttribute('aria-pressed','false');};

$('simple-opponents').onclick=()=>{simpleState.showOpponents=simpleState.showOpponents===false;renderSimple();saveSimple();};
