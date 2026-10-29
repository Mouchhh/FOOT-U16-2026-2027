// Croquis pédagogiques du club, reliés aux effectifs calculés ; pas des plans à l’échelle.
let trainingDiagramSerial=0;
const trainingDiagramPlans={
 warm:{zones:[],moves:[[0,130,110],[1,460,310]],caption:'Conduite et déplacement vers un espace libre.'},
 cool:{passes:[[0,1]],caption:'Échanges à faible intensité et bilan collectif.'},
 passes:{passes:[[0,1],[1,2]],moves:[[0,350,310]],caption:'Passe, contrôle orienté puis changement de poste.'},
 rondo:{passes:[[0,1],[1,2]],caption:'Conserver autour des défenseurs et créer des angles.'},
 triangle:{zones:[[290,65,65,300]],passes:[[0,1],[1,2]],caption:'Appui, remise, réception du troisième homme.'},
 build:{keeperPass:true,zones:[[50,60,165,320]],passes:[[0,1]],moves:[[1,420,125]],caption:'Écarter les appuis et progresser vers la sortie libre.'},
 press:{moves:[[0,410,130],[1,410,290]],caption:'Un joueur sort, les partenaires ferment les relais.'},
 trap:{zones:[[50,60,540,80]],moves:[[0,450,110],[1,410,160]],caption:'Orienter vers la ligne puis fermer les passes proches.'},
 cover:{moves:[[0,385,180],[1,310,260]],caption:'Le premier ralentit ; le second couvre en retrait.'},
 block:{zones:[[270,60,100,320]],moves:[[0,330,140],[1,330,280]],caption:'Coulisser ensemble pour protéger l’axe.'},
 transition:{moves:[[0,340,160],[1,350,270]],caption:'À la perte, fermer les solutions ou protéger l’axe.'},
 counter:{passes:[[0,1]],moves:[[1,510,140],[2,490,300]],caption:'Première passe libre puis appels vers la profondeur.'},
 switch:{zones:[[50,60,540,70],[50,310,540,70]],passes:[[0,2]],caption:'Attirer d’un côté puis trouver le partenaire opposé.'},
 overlap:{passes:[[0,1]],moves:[[1,480,90]],caption:'Fixer puis appeler dans le couloir libre.'},
 finish:{passes:[[0,1]],shot:true,moves:[[1,465,205]],caption:'Passe vers un joueur lancé, contrôle et finition.'},
 cutback:{ball:[510,95],fixedPass:[510,95,445,230],moves:[[0,490,190],[1,440,270]],caption:'Débordement puis centre en retrait vers une arrivée échelonnée.'},
 duel:{moves:[[0,435,135]],caption:'Fixer le défenseur puis attaquer une porte libre.'},
 support:{zones:[[290,65,65,300]],passes:[[0,1]],moves:[[1,345,280]],caption:'Se déplacer hors de l’ombre avant de recevoir.'},
 'cpa-attack':{ball:[580,72],fixedPass:[580,72,495,205],moves:[[0,480,180],[1,510,270]],caption:'Courses échelonnées et couverture du second ballon.'},
 'cpa-defence':{actors:'red',ball:[580,72],fixedPass:[580,72,495,205],moves:[[0,500,180],[1,495,285]],caption:'Responsabilités dans la surface et sortie sur le second ballon.'},
 'keeper-feet':{keeperPass:true,passes:[[0,1]],caption:'Deux soutiens au gardien et choix de la sortie.'},
 'keeper-duel':{shot:true,moves:[[0,480,210]],caption:'Le porteur avance, le gardien ajuste son angle.'},
 touch:{ball:[270,65],fixedPass:[270,65,350,180],moves:[[0,380,110],[1,400,300]],caption:'Appui court, profondeur et soutien après la touche.'},
 freegame:{passes:[[0,1]],moves:[[1,490,130]],caption:'Réinvestir le thème dans un jeu avec opposition.'}
};
function trainingDiagramTokens(exercise,group){
 const tokens=[];let id=0;const add=(x,y,team,keeper=false,rotation=false)=>tokens.push({x,y,team,keeper,rotation,label:keeper?'G'+(++id):String(++id)});
 if(exercise.kind==='circuit'){
  for(let i=0;i<group.players;i++){const a=-Math.PI/2+i*Math.PI*2/group.players;add(320+195*Math.cos(a),220+115*Math.sin(a),'blue',i<group.keepers);}
 }else if(exercise.kind==='possession'){
  const defenders=group.allocation[1],attackers=group.players-defenders;
  for(let i=0;i<attackers;i++){const a=-Math.PI/2+i*Math.PI*2/attackers;add(320+220*Math.cos(a),220+130*Math.sin(a),'blue',i<group.keepers);}
  for(let i=0;i<defenders;i++)add(300+i*45,215+i*25,'red');
 }else if(exercise.kind==='duel'){
  const side=group.allocation[0];let remaining=group.keepers;
  for(let i=0;i<side;i++){add(200+(i%2)*45,95+(i+1)*250/(side+1),'blue',remaining-->0);}
  for(let i=0;i<side;i++)add(405+(i%2)*40,95+(i+1)*250/(side+1),'red',remaining-->0);
  if(group.allocation[2])add(320,345,'neutral',remaining-->0);
 }else{
  const side=group.allocation[0];for(let i=0;i<side;i++)add(170+(i%2)*65,85+(i+1)*270/(side+1),'blue');
  for(let i=0;i<side;i++)add(400+(i%2)*65,85+(i+1)*270/(side+1),'red');
  if(group.allocation[2])add(320,335,'neutral');
  for(let i=0;i<group.keepers;i++){const rightOnly=group.keepers===1&&!['build','keeper-feet'].includes(exercise.id);add(rightOnly?558:i===0?82:i===1?558:540,i<2?220:92+(i-2)*50,rightOnly||i===1?'red':'blue',true,i>=2);}
 }
 return tokens;
}
function trainingDiagramSVG(exercise,group){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('training-diagram-svg');svg.setAttribute('viewBox','0 0 640 440');svg.setAttribute('role','img');
 const node=(name,attrs={},text)=>{const n=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
 const serial=++trainingDiagramSerial;const titleId='training-schema-title-'+serial;svg.setAttribute('aria-labelledby',titleId);svg.append(node('title',{id:titleId},exercise.title+' — atelier '+group.index+', '+group.players+' joueurs dont '+group.keepers+' gardien(s).'));
 const plan=trainingDiagramPlans[exercise.id]||{},tokens=trainingDiagramTokens(exercise,group);svg.dataset.players=String(tokens.length);svg.dataset.keepers=String(tokens.filter(t=>t.keeper).length);
 svg.append(node('rect',{x:0,y:0,width:640,height:440,rx:12,fill:'#edf3fb'}),node('rect',{x:50,y:60,width:540,height:320,rx:5,fill:'#28513b'}));
 for(let i=0;i<6;i++)if(i%2===0)svg.append(node('rect',{x:50+i*90,y:60,width:90,height:320,fill:'#305c43'}));
 for(const zone of plan.zones||[])svg.append(node('rect',{x:zone[0],y:zone[1],width:zone[2],height:zone[3],fill:'#e8b85f',opacity:.18,stroke:'#ffe6a0','stroke-dasharray':'6 5'}));
 svg.append(node('rect',{x:62,y:72,width:516,height:296,fill:'none',stroke:'#d4e5d3','stroke-width':1.5}));
 if(['game','finish','cpa'].includes(exercise.kind)){
  if(group.keepers){svg.append(node('path',{d:'M62 185H40V255H62 M578 185H600V255H578',fill:'none',stroke:'#fff','stroke-width':3}),node('path',{d:'M62 140H145V300H62 M578 140H495V300H578',fill:'none',stroke:'#c3d8c2','stroke-width':1}));}
  else for(const y of [125,300])svg.append(node('path',{d:'M570 '+y+'H595V'+(y+40)+'H570',fill:'none',stroke:'#ffe6a0','stroke-width':4}));
 }
 for(const [x,y] of [[62,72],[578,72],[62,368],[578,368]])svg.append(node('path',{d:'M'+x+' '+(y-6)+'l-6 12h12z',fill:'#f2bc69',stroke:'#74491a','stroke-width':1}));
 svg.append(node('text',{x:320,y:32,'text-anchor':'middle',fill:'#2855a2','font-size':16,'font-weight':700},'Atelier '+group.index+' · '+group.players+' joueurs · '+group.width+' × '+group.length+' m'));
 const defs=node('defs');const markerId='training-arrow-'+serial;const marker=node('marker',{id:markerId,markerWidth:7,markerHeight:7,refX:5,refY:3,orient:'auto',markerUnits:'strokeWidth'});marker.append(node('path',{d:'M0 0L6 3L0 6',fill:'none',stroke:'#fff','stroke-width':1}));defs.append(marker);svg.append(defs);
 const arrow=(a,b,dashed=false)=>{if(!a||!b||Math.hypot(a[0]-b[0],a[1]-b[1])<20)return;svg.append(node('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#fff','stroke-width':2.5,'stroke-dasharray':dashed?'none':'7 5','marker-end':'url(#'+markerId+')'}));};
 const blue=tokens.filter(t=>t.team===(plan.actors||'blue')&&(!t.keeper||['circuit','possession','duel'].includes(exercise.kind))&&!t.rotation),at=i=>blue.length?blue[i%blue.length]:null,point=t=>t?[t.x,t.y]:null;
 for(const [i,j] of plan.passes||[])arrow(point(at(i)),point(at(j)),true);
 for(const [i,x,y] of plan.moves||[])arrow(point(at(i)),[x,y]);
 if(plan.fixedPass)arrow(plan.fixedPass.slice(0,2),plan.fixedPass.slice(2),true);
 if(plan.shot)arrow(point(at(0)),[575,220],true);
 if(plan.keeperPass){const g=tokens.find(t=>t.keeper);if(g)arrow(point(g),point(at(0)),true);}
 tokens.forEach(t=>{const color=t.keeper?'#e8b85f':t.team==='red'?'#c83f4f':t.team==='neutral'?'#f4f5f8':'#2855a2';const player=node('g',{'class':'exercise-player','data-team':t.team,'data-keeper':String(t.keeper)});player.append(node('circle',{cx:t.x,cy:t.y,r:14,fill:color,stroke:t.team==='neutral'?'#718196':'white','stroke-width':2,'stroke-dasharray':t.rotation?'3 2':'none'}),node('text',{x:t.x,y:t.y+4,'text-anchor':'middle',fill:t.keeper||t.team==='neutral'?'#18345b':'#fff','font-size':11,'font-weight':700},t.label));if(t.rotation)player.append(node('text',{x:t.x-20,y:t.y-20,fill:'#fff','font-size':9},'rotation'));svg.append(player);});
 const ball=plan.ball||point(at(0))||[320,220];svg.append(node('circle',{cx:Math.min(570,ball[0]+(plan.ball?0:20)),cy:ball[1],r:6,fill:'#fff',stroke:'#183d27','stroke-width':1.5}),node('text',{x:320,y:414,'text-anchor':'middle',fill:'#526b8c','font-size':12},'Bleu / rouge : opposition · G : gardien · Blanc : appui · Triangles : coupelles'));
 return svg;
}
function trainingDiagram(exercise,session){
 const groups=trainingOrganisation(exercise,session),root=el('figure','training-diagram');const controls=el('div','training-diagram-controls');controls.append(el('strong','','Le schéma de l’exercice'));
 const select=el('select');select.setAttribute('aria-label','Atelier illustré · '+exercise.title);groups.forEach(g=>{const option=el('option','','Atelier '+g.index+' · '+g.players+' joueurs');option.value=String(g.index-1);select.append(option);});controls.append(select);root.append(controls);
 const display=el('div','training-diagram-screen');display.append(trainingDiagramSVG(exercise,groups[0]));select.onchange=()=>display.replaceChildren(trainingDiagramSVG(exercise,groups[Number(select.value)]));root.append(display);
 const variants=el('div','training-diagram-print');const seen=new Set();groups.forEach(g=>{const key=[g.players,g.keepers,g.width,g.length].join('-');if(!seen.has(key)){seen.add(key);variants.append(trainingDiagramSVG(exercise,g));}});root.append(variants);
 const plan=trainingDiagramPlans[exercise.id];root.append(el('figcaption','',(plan?.caption||exercise.goal)+' Traits pleins : passes ou frappes. Pointillés : courses sans ballon. Croquis de principe, sans échelle ni séquence obligatoire.'));return root;
}
