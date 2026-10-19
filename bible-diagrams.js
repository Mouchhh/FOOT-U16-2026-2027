// Schémas d’installation de la Bible de l’éduc : effectifs et inventaire issus du même plan.
let bibleDiagramSerial=0;
function bibleDiagramKnowledge(exercise){
 return typeof bibleKnowledge==='object'&&bibleKnowledge[exercise.id]?bibleKnowledge[exercise.id]:{};
}
function bibleDiagramSequence(exercise,index){
 const sequences=bibleDiagramKnowledge(exercise).sequences||[];
 return sequences[Math.max(0,Math.min(sequences.length-1,Number(index)||0))]||{};
}
function bibleDiagramMechanism(exercise){
 const patterns={
  triangle:['third','1 : appui · 2 : remise · 3 : trouver le troisième joueur lancé.'],
  'thirdman-depth':['third','Appui-remise pour libérer une passe vers le troisième joueur.'],
  'wall-pass':['third','Donner, recevoir la remise puis trouver le partenaire suivant.'],
  support:['support','Sortir de l’ombre du défenseur avant de recevoir.'],
  'receive-back':['back','Recevoir dos à la cible, protéger puis remettre si le retournement est fermé.'],
  'escape-turn':['turn','Regarder avant de recevoir ; se retourner côté libre ou utiliser le soutien.'],
  'rondo-direction':['split','Repérer une fenêtre de passe ouverte avant de franchir la pression.'],
  'defend-outnumbered':['delay','Ralentir le porteur ; couvrir l’axe sans sortir tous sur le ballon.'],
  'finish-rebound':['rebound','Préparer un soutien derrière le tir puis jouer le ballon repoussé.'],
  trap:['trap','Approcher depuis l’intérieur, orienter sur le côté et garder une couverture.'],
  'wide-isolate':['isolate','Servir le joueur large ; garder un soutien si le duel devient défavorable.'],
  'box-combine':['combine','Appui, remise et déplacement pour créer une frappe face au but.'],
  switch:['switch','Attirer d’un côté, puis transmettre vers le côté opposé.'],
  'build-switch':['switch','Fixer la pression puis trouver la cible du côté opposé.'],
  'attract-release':['switch','Attirer un adversaire avant de libérer le partenaire éloigné.'],
  cover:['cover','Le premier défenseur ralentit ; le deuxième protège derrière lui.'],
  'press-cover-three':['cover','Coordonner la sortie du premier défenseur et la couverture.'],
  block:['block','Coulisser ensemble vers le ballon en protégeant l’axe.'],
  'block-two-lines':['block','Déplacer le bloc vers le ballon sans ouvrir les intervalles.'],
  transition:['loss','À la perte, le plus proche intervient et un partenaire ferme la passe.'],
  'counterpress-escape':['loss','Réagir à la perte ; fermer les solutions proches du nouveau porteur.'],
  counter:['regain','À la récupération, chercher une première passe utile et accompagner.'],
  'recovery-firstpass':['regain','Sécuriser la première passe après récupération avant de progresser.'],
  'counter-wide':['regain','Exploiter l’espace libre à la récupération avec des appels complémentaires.'],
  'secure-regain':['regain','Trouver un soutien libre après récupération avant de réattaquer.'],
  'rest-defence':['balance','Pendant l’attaque, garder un équilibre derrière le ballon.'],
  'retreat-delay':['retreat','Ralentir le porteur pendant que les partenaires protègent la profondeur.'],
  cutback:['cutback','Atteindre le fond puis trouver un partenaire en retrait.'],
  'far-post':['farpost','Le joueur éloigné arrive au second poteau au moment du centre.'],
  touch:['throw','Remise depuis la touche ; un partenaire offre une solution puis un soutien.'],
  'throw-progression':['throw','Trouver une solution depuis la touche puis progresser avec un soutien.'],
  'keeper-feet':['keeperpass','Le gardien dispose de deux angles de sortie et accompagne sa passe.'],
  'keeper-distribute':['keeperpass','Le gardien choisit une distribution vers un partenaire disponible.'],
  underlap:['underlap','Le porteur fixe sur le côté ; un soutien passe à l’intérieur dans le bon tempo.'],
  'forward-runs':['behind','Déclencher l’appel en profondeur quand le passeur peut jouer vers l’avant.'],
  'defend-depth':['depth','Voir le ballon et l’appel puis ajuster la hauteur de la défense.'],
  'defend-cross':['defendcross','Sur le centre, protéger l’intérieur et accompagner les courses dans la surface.']
 };
 const definition=patterns[exercise.id];return definition?{type:definition[0],caption:definition[1]}:{type:'',caption:''};
}
function bibleCircuitStations(group,field){
 const count=Math.max(1,Number(group.material?.activeBalls||1)),cols=Math.min(count,Math.max(1,Math.ceil(Math.sqrt(count*field.fw/field.fh)))),rows=Math.ceil(count/cols),size=Math.floor(group.players/count),rest=group.players%count;
 const gap=Math.min(3*field.scale,field.fw/(cols*2),field.fh/(rows*2)),w=(field.fw-gap*(cols-1))/cols,h=(field.fh-gap*(rows-1))/rows;
 let offset=0;return Array.from({length:count},(_,i)=>{const players=size+(i<rest?1:0),x=field.fx+(i%cols)*(w+gap),y=field.fy+Math.floor(i/cols)*(h+gap),points=[[.2,.72],[.5,.22],[.8,.72]].map(([a,b])=>({x:x+w*a,y:y+h*b})),station={index:i,offset,players,x,y,w,h,points};offset+=players;return station;});
}
// Pure starting layout shared by static drawings and the demonstration player.
function bibleDiagramActors(exercise,group,field,goalPositions=[]){
 const knowledge=bibleDiagramKnowledge(exercise),mechanism=bibleDiagramMechanism(exercise),template=group.template||knowledge.template||'possession';
 const teams=group.teams||{blue:group.allocation?.[0]||0,red:group.allocation?.[1]||0,neutral:group.allocation?.[2]||0};
 const width=Number(group.width),length=Number(group.length),fieldKeepers=Number(group.fieldKeepers||0),activeKeepers=Number(group.activeKeepers||0),rotatingKeepers=Number(group.rotatingKeepers||0);
 const {fx,fy,fw,fh,scale}=field,point=(long,wide)=>[fx+long*scale,fy+wide*scale],px=(long,wide)=>{const [x,y]=point(long,wide);return{x,y};},goalSide=template==='build'?'left':'right';
 const tokens=[],teamIndices={blue:0,red:0,neutral:0};let nextNumber=1,gkFeetRemaining=fieldKeepers;
 const add=(long,wide,team,keeper=null,rotation=false)=>{const p=point(Math.max(.025*length,Math.min(.975*length,long)),Math.max(.04*width,Math.min(.96*width,wide)));let fieldKeeper=false;if(keeper===null){const index=teamIndices[team]++;fieldKeeper=Array.isArray(group.keeperSlots)?group.keeperSlots.some(s=>s.team===team&&s.index===index):gkFeetRemaining-->0;keeper=fieldKeeper;}tokens.push({x:p[0],y:p[1],long,wide,team,keeper,fieldKeeper,rotation,number:nextNumber++});};
 const grid=(n,start,end,team,wideStart=0,wideEnd=width)=>{
  const cols=Math.max(1,Math.ceil(Math.sqrt(n*Math.max(.6,(end-start)/width)))),rows=Math.ceil(n/cols);
  for(let i=0;i<n;i++){const col=i%cols,row=Math.floor(i/cols),xx=start+(col+1)*(end-start)/(cols+1),yy=wideStart+(row+1)*(wideEnd-wideStart)/(rows+1);add(xx,yy,team);}
 };
 if(template==='rondo'){
  const n=Number(teams.blue||0);for(let i=0;i<n;i++){const a=-Math.PI/2+i*Math.PI*2/n;add(length/2+length*.39*Math.cos(a),width/2+width*.37*Math.sin(a),'blue');}
  grid(Number(teams.red||0),length*.32,length*.68,'red');
 }else if(template==='circuit'&&!['warm','cool'].includes(exercise.id)){
  for(const station of bibleCircuitStations(group,field))for(let i=0;i<station.players;i++){const p=station.points[i]||{x:station.x+station.w*(.16+(i-3)*.12),y:station.y+station.h*.9},dx=station.x+station.w/2-p.x,dy=station.y+station.h/2-p.y,d=Math.hypot(dx,dy)||1,offset=i<3?Math.min(24,station.w*.12,station.h*.12):0;add((p.x+dx/d*offset-fx)/scale,(p.y+dy/d*offset-fy)/scale,'blue');}
 }else if(template==='circuit'&&exercise.id==='warm'){
  grid(Number(teams.blue||0),length*.02,length*.98,'blue',width*.02,width*.98);
 }else if(template==='circuit'){
  const n=Number(teams.blue||0);for(let i=0;i<n;i++){const a=-Math.PI/2+i*Math.PI*2/n;add(length/2+length*.37*Math.cos(a),width/2+width*.35*Math.sin(a),'blue');}
  grid(Number(teams.red||0),length*.35,length*.65,'red');
 }else if(template==='corner'){
  grid(Number(teams.blue||0),length*.58,length*.82,'blue');grid(Number(teams.red||0),length*.72,length*.91,'red');
 }else if(template==='wide-finish'){
  if(teams.blue)add(length*.88,width*.12,'blue');grid(Math.max(0,Number(teams.blue||0)-1),length*.47,length*.77,'blue',width*.28,width*.84);grid(Number(teams.red||0),length*.68,length*.89,'red',width*.27,width*.85);
 }else if(template==='finish'||template==='keeper'){
  grid(Number(teams.blue||0),length*.18,length*.7,'blue');grid(Number(teams.red||0),length*.63,length*.83,'red');
 }else if(template==='build'||template==='press'){
  grid(Number(teams.blue||0),length*.13,length*.56,'blue');grid(Number(teams.red||0),length*.4,length*.82,'red');
 }else if(template==='possession'||template==='four-goals'){
  grid(Number(teams.blue||0),length*.04,length*.96,'blue',width*.03,width*.97);grid(Number(teams.red||0),length*.12,length*.88,'red',width*.13,width*.87);
 }else{
  grid(Number(teams.blue||0),length*.09,length*.51,'blue');grid(Number(teams.red||0),length*.49,length*.91,'red');
 }
 const neutrals=Number(teams.neutral||0);for(let i=0;i<neutrals;i++)add((i+1)*length/(neutrals+1),i%2?width*.9:width*.1,'neutral');
 const activeGoalPositions=goalPositions.filter(g=>g.type==='full');
 for(let i=0;i<activeKeepers;i++){const goal=activeGoalPositions[i]||{side:i===0?goalSide:goalSide==='left'?'right':'left',wide:width/2};add(goal.side==='left'?length*.055:length*.945,goal.wide,goal.side==='left'?'blue':'red',true);}
 for(let i=0;i<rotatingKeepers;i++)tokens.push({x:fx+fw-20-i*35,y:fy+fh+27,team:'keeper',keeper:true,rotation:true,number:nextNumber++});
 const blue=tokens.filter(t=>t.team==='blue'&&!t.rotation),red=tokens.filter(t=>t.team==='red'&&!t.rotation),neutral=tokens.filter(t=>t.team==='neutral'&&!t.rotation),keepers=tokens.filter(t=>t.keeper&&!t.rotation);
 const relocate=(t,long,wide)=>{if(!t)return;const p=px(long,wide);Object.assign(t,p,{long,wide});};
 const a=blue[0],relay=neutral[0]||blue[1],third=neutral.length?blue[1]:blue[2];
 if(mechanism.type==='third'&&template!=='circuit'&&a&&relay&&third){relocate(a,length*.18,width*.67);relocate(relay,length*.47,width*.28);relocate(third,length*.73,width*.65);relocate(red[0],length*.43,width*.53);}
 if(['back','turn'].includes(mechanism.type)){relocate(a,length*.2,width*.6);relocate(blue[1]||neutral[0],length*.52,width*.5);relocate(red[0],length*.65,width*.5);relocate(blue[2],length*.3,width*.22);}
 if(mechanism.type==='split'){relocate(a,length*.12,width*.5);relocate(blue[1],length*.88,width*.5);red.forEach((p,i)=>relocate(p,length*(.42+Math.floor(i/2)*.15),width*(i%2?.78:.22)));}
 if(['trap','isolate'].includes(mechanism.type)){relocate(a,length*.35,width*.16);relocate(blue[1],length*.58,width*.14);relocate(blue[2],length*.3,width*.62);relocate(red[0],length*.52,width*.32);relocate(red[1],length*.69,width*.35);}
 if(mechanism.type==='delay'){relocate(a,length*.32,width*.32);relocate(blue[1],length*.4,width*.76);relocate(red[0],length*.57,width*.39);relocate(red[1],length*.72,width*.61);}
 if(mechanism.type==='support'&&blue.length>1){relocate(a,length*.2,width*.6);relocate(blue[1],length*.62,width*.55);relocate(red[0],length*.43,width*.56);}
 if(mechanism.type==='switch'&&blue.length>1){relocate(a,length*.28,width*.14);relocate(blue[blue.length-1],length*.65,width*.84);if(blue.length>2)relocate(blue[1],length*.44,width*.25);}
 if(['cover','block'].includes(mechanism.type)){relocate(a,length*.3,width*.28);relocate(red[0],length*.55,width*.3);relocate(red[1],length*.73,width*.58);}
 if(mechanism.type==='loss'){relocate(red[0],length*.51,width*.45);relocate(a,length*.28,width*.39);relocate(blue[1],length*.43,width*.76);relocate(red[1],length*.75,width*.77);}
 if(mechanism.type==='regain'){relocate(a,length*.35,width*.5);relocate(blue[1],length*.62,width*.22);relocate(blue[2],length*.55,width*.77);}
 if(mechanism.type==='balance'){relocate(a,length*.65,width*.23);relocate(blue[1],length*.29,width*.42);relocate(blue[2],length*.34,width*.77);}
 if(mechanism.type==='retreat'){relocate(red[0],length*.38,width*.35);relocate(a,length*.56,width*.35);relocate(blue[1],length*.7,width*.7);}
 if(mechanism.type==='farpost')relocate(blue[1],length*.89,width*.74);
 if(template==='corner')relocate(blue[0],length*.97,width*.06);
 if(mechanism.type==='throw'){relocate(a,length*.32,width*.035);relocate(blue[1],length*.52,width*.22);relocate(blue[2],length*.59,width*.55);}
 const keeperSupports=goalkeeper=>tokens.filter(t=>!t.rotation&&t!==goalkeeper&&!t.keeper&&(t.team===goalkeeper.team||t.team==='neutral'));
 if(mechanism.type==='keeperpass'&&keepers.length){const goalkeeper=keepers[0],supports=keeperSupports(goalkeeper);if(goalkeeper.fieldKeeper)relocate(goalkeeper,length*.07,width*.5);relocate(supports[0],goalkeeper.long<length*.5?length*.32:length*.68,width*.23);relocate(supports[1],goalkeeper.long<length*.5?length*.34:length*.66,width*.77);}
 if(mechanism.type==='underlap'){relocate(a,length*.55,width*.12);relocate(blue[1],length*.35,width*.35);relocate(red[0],length*.68,width*.17);}
 if(['behind','depth'].includes(mechanism.type)){relocate(a,length*.29,width*.4);relocate(blue[1],length*.58,width*.7);relocate(red[0],length*.67,width*.55);}
 // A tactical repositioning must not cover a shirt already on the installation
 // grid. Keep the main actors first, then find the nearest free starting spot.
 // This is deterministic installation spacing, never an invented game action.
 const radius=Math.max(9,Math.min(group.players<=12?18:15,Math.min(fw,fh)/13)),gap=radius*2.3,placed=[],priority=[...tokens.filter(t=>t.keeper&&!t.fieldKeeper&&!t.rotation),...blue.slice(0,3),...red.slice(0,3),...neutral.slice(0,2),...tokens],seen=new Set();
 const circuits=template==='circuit'&&!['warm','cool'].includes(exercise.id)?bibleCircuitStations(group,field):[];
 const clampPoint=(p,number)=>{const endzone=template==='endzones'&&!goalPositions.length&&group.zoneDimensions?.length===3,cell=circuits.find(s=>number>s.offset&&number<=s.offset+s.players)||(endzone?{x:fx+group.zoneDimensions[1].x*scale,y:fy,w:group.zoneDimensions[1].length*scale,h:fh}:{x:fx,y:fy,w:fw,h:fh}),mx=Math.min(radius+2,cell.w*.2),my=Math.min(radius+2,cell.h*.2);return{x:Math.max(cell.x+mx,Math.min(cell.x+cell.w-mx,p.x)),y:Math.max(cell.y+my,Math.min(cell.y+cell.h-my,p.y))};};
 const clear=p=>placed.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=gap);
 for(const token of priority){
  if(seen.has(token.number)||token.rotation)continue;seen.add(token.number);
  const original=clampPoint(token,token.number);let best=original;
  if(!clear(original))search:for(let ring=1;ring<=8;ring++)for(let i=0;i<24;i++){
   const angle=i*Math.PI/12,candidate=clampPoint({x:original.x+Math.cos(angle)*gap*ring*.55,y:original.y+Math.sin(angle)*gap*ring*.55},token.number);
   if(clear(candidate)){best=candidate;break search;}
  }
  Object.assign(token,best,{long:(best.x-fx)/scale,wide:(best.y-fy)/scale});placed.push(token);
 }
 return tokens;
}
function bibleDiagramField(group){
 const width=Number(group.width),length=Number(group.length),scale=Math.min(690/length,405/width),fw=length*scale,fh=width*scale;
 return {fx:(880-fw)/2,fy:96+(405-fh)/2,fw,fh,scale,width,length};
}
function bibleDiagramBallSpot(token,field,radius){
 const direction=token.team==='red'?-1:1;
 return {x:Math.max(field.fx+5,Math.min(field.fx+field.fw-5,token.x+direction*(radius+6))),y:Math.max(field.fy+5,Math.min(field.fy+field.fh-5,token.y+8))};
}
function bibleDiagramBallActors(tokens,count){
 const active=tokens.filter(t=>!t.rotation),taken=new Set();
 return Array.from({length:Math.min(count,active.length)},(_,i)=>{let index=i*Math.floor(active.length/count)+Math.min(i,active.length%count);if(index>=active.length||taken.has(index))index=active.findIndex((t,j)=>!taken.has(j));taken.add(index);return active[index];});
}
function bibleDiagramSVG(exercise,group,options={}){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),serial=++bibleDiagramSerial;
 const make=(tag,attrs={},text)=>{const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e;};
 const knowledge=bibleDiagramKnowledge(exercise),mechanism=bibleDiagramMechanism(exercise),template=group.template||knowledge.template||'possession',material=group.material||{},teams=group.teams||{blue:group.allocation?.[0]||0,red:group.allocation?.[1]||0,neutral:group.allocation?.[2]||0};
 const sequence=bibleDiagramSequence(exercise,options.sequenceIndex),width=Number(group.width),length=Number(group.length),teamCount=Number(teams.blue||0)+Number(teams.red||0)+Number(teams.neutral||0),fieldKeepers=Number(group.fieldKeepers||0),activeKeepers=Number(group.activeKeepers||0),rotatingKeepers=Number(group.rotatingKeepers||0);
 const titleId='bible-schema-title-'+serial,descId='bible-schema-desc-'+serial;
 svg.classList.add('training-diagram-svg','bible-diagram-svg');svg.setAttribute('viewBox','0 0 880 660');svg.setAttribute('role','img');svg.setAttribute('aria-labelledby',titleId+' '+descId);svg.dataset.players=String(group.players);svg.dataset.keepers=String(group.keepers||0);svg.dataset.width=String(width);svg.dataset.length=String(length);svg.dataset.template=template;svg.dataset.sequence=String(Number(options.sequenceIndex)||0);svg.dataset.fits=String(group.fits!==false);
 svg.append(make('title',{id:titleId},exercise.title+' — atelier '+group.index+' : '+group.players+' joueurs dont '+(group.keepers||0)+' gardien(s), largeur '+width+' m et longueur '+length+' m.'),make('desc',{id:descId},'Plan d’installation proportionnel. '+(sequence.title?sequence.title+'. ':'')+(sequence.rule||'')+' Bleu et rouge : équipes ; blanc : appui neutre ; G jaune : gardien ; traits pointillés : passe ; traits pleins : déplacement.'));
 svg.append(make('rect',{x:0,y:0,width:880,height:660,rx:18,fill:'#f5f8fc'}));
 if(!(width>0&&length>0)||teamCount+activeKeepers+rotatingKeepers!==Number(group.players)){
  svg.dataset.invalid='true';svg.append(make('text',{x:440,y:290,'text-anchor':'middle',fill:'#8a3c18','font-size':19,'font-weight':700},'Organisation à préciser avant de dessiner'),make('text',{x:440,y:325,'text-anchor':'middle',fill:'#4e617b','font-size':14},'Vérifiez la répartition des joueurs et les dimensions.'));return svg;
 }
 const scale=Math.min(690/length,405/width),fw=length*scale,fh=width*scale,fx=(880-fw)/2,fy=96+(405-fh)/2;
 const viewWidth=Math.max(540,fw+120),viewLeft=(880-viewWidth)/2;svg.setAttribute('viewBox',viewLeft+' 0 '+viewWidth+' 660');
 svg.biblePlacement=[];
 const placement=(type,x,y,extra={})=>svg.biblePlacement.push({type,long:(x-fx)/scale,wide:(y-fy)/scale,...extra});
 const point=(long,wide)=>[fx+long*scale,fy+wide*scale],px=(long,wide)=>{const [x,y]=point(long,wide);return {x,y};};
 const markerId='bible-arrow-'+serial,dimensionId='bible-dimension-'+serial,defs=make('defs');
 const arrowMarker=make('marker',{id:markerId,markerWidth:7,markerHeight:7,refX:6,refY:3.5,orient:'auto',markerUnits:'strokeWidth'});arrowMarker.append(make('path',{d:'M1 1L6 3.5L1 6',fill:'none',stroke:'#ffffff','stroke-width':1.6,'stroke-linecap':'round','stroke-linejoin':'round'}));defs.append(arrowMarker);
 const dimensionMarker=make('marker',{id:dimensionId,markerWidth:5,markerHeight:5,refX:2.5,refY:2.5,orient:'auto-start-reverse',markerUnits:'strokeWidth'});dimensionMarker.append(make('path',{d:'M4.5 .5L.5 2.5L4.5 4.5',fill:'none',stroke:'#526b89','stroke-width':1}));defs.append(dimensionMarker);svg.append(defs);
 const fmt=n=>Number.isInteger(n)?String(n):String(Math.round(n*10)/10).replace('.',',');
 const dim=(x1,y1,x2,y2,label,vertical=false)=>{svg.append(make('line',{x1,y1,x2,y2,stroke:'#6e829b','stroke-width':1.3,'marker-start':'url(#'+dimensionId+')','marker-end':'url(#'+dimensionId+')'}));const tx=(x1+x2)/2+(vertical?-13:0),ty=(y1+y2)/2+(vertical?0:-10);svg.append(make('text',{x:tx,y:ty,'text-anchor':'middle',fill:'#355278','font-size':13,'font-weight':700,...(vertical?{transform:'rotate(-90 '+tx+' '+ty+')'}:{})},label));};
 svg.append(make('text',{x:440,y:28,'text-anchor':'middle',fill:'#244b82','font-size':17,'font-weight':700},'Atelier '+group.index+' · '+group.players+' joueurs'+(group.keepers?' dont '+group.keepers+' G':'')));
 if(group.fits===false||group.pedagogyFits===false){svg.append(make('rect',{x:205,y:39,width:470,height:27,rx:7,fill:'#fff0d8'}),make('text',{x:440,y:57,'text-anchor':'middle',fill:'#855017','font-size':12,'font-weight':700},'Installation à revoir · dimensions requises ci-dessous'));}
 svg.append(make('rect',{x:fx,y:fy,width:fw,height:fh,rx:4,fill:'#176247'}));
 for(let i=0;i<8;i++)if(i%2===0)svg.append(make('rect',{x:fx+i*fw/8,y:fy,width:fw/8,height:fh,fill:'#1d6b4e'}));
 const zones=Array.isArray(group.zoneDimensions)?group.zoneDimensions:[];
 zones.forEach((zone,i)=>{
  const zx=Number(zone.x)||0,zy=Number(zone.y)||0,zl=Number(zone.length)||length,zw=Number(zone.width)||width;const [x,y]=point(zx,zy);
  if(zones.length>1){svg.append(make('rect',{x,y,width:zl*scale,height:zw*scale,fill:i%2===0?'#d0e5ac':'#d8e8ff',opacity:i%2===0?.09:.045}));if(i>0)svg.append(make('line',{x1:x,y1:y,x2:zy>0?x+zl*scale:x,y2:zy>0?y:y+zw*scale,stroke:'#b9dfce','stroke-width':1.4,'stroke-dasharray':'7 6'}));}
  if(zones.length>1){const widthAxis=(group.format?.zoneAxis||knowledge.format?.zoneAxis)==='width';const dimension=widthAxis?zw:zl;svg.append(make('text',{'class':'bible-zone-label',x:widthAxis?fx+fw-8:x+zl*scale/2,y:widthAxis?y+zw*scale/2+4:fy+19,'text-anchor':widthAxis?'end':'middle',fill:'#d9eee3','font-size':11},(zone.name&&widthAxis?zone.name+' · ':'')+fmt(dimension)+' m'));}
 });
 svg.append(make('rect',{x:fx,y:fy,width:fw,height:fh,rx:4,fill:'none',stroke:'#f4fbf7','stroke-width':2}));
 // Les cotes utilisent une même échelle horizontale et verticale, en mètres.
 dim(fx,fy-19,fx+fw,fy-19,'Longueur '+fmt(length)+' m');dim(fx-26,fy,fx-26,fy+fh,'Largeur '+fmt(width)+' m',true);
 for(const x of [fx,fx+fw])svg.append(make('line',{x1:x,y1:fy-24,x2:x,y2:fy-5,stroke:'#9caec4','stroke-width':1}));
 for(const y of [fy,fy+fh])svg.append(make('line',{x1:fx-32,y1:y,x2:fx-7,y2:y,stroke:'#9caec4','stroke-width':1}));
 const smallGoal=Number(material.miniGoals||0),fullGoal=Number(material.goals||0),gateCount=Number(material.gates||0),goalPositions=[];
 const goalSide=template==='build'?'left':'right';
 const goalSlots=count=>Array.from({length:count},(_,i)=>({side:count===1?goalSide:i%2===0?'left':'right',wide:count>2?(Math.floor(i/2)+1)*width/(Math.ceil(count/2)+1):width/2}));
 const drawGoal=(position,type)=>{
  const {side,wide}=position,goalWidth=Math.min(type==='full'?7.32:2,width*.9),depth=type==='full'?2:1,at=point(side==='left'?0:length,wide),sign=side==='left'?-1:1,y=at[1]-goalWidth*scale/2,w=depth*scale;
  const goal=make('g',{'class':'bible-equipment','data-equipment':type==='full'?'goal':'miniGoal','data-side':side,'data-opening':goalWidth});
  goal.append(make('rect',{x:sign<0?at[0]-w:at[0],y,width:w,height:goalWidth*scale,fill:'#ebf6ff18',stroke:'#bad8de','stroke-width':1.2}));
  for(let i=1;i<4;i++)goal.append(make('line',{x1:sign<0?at[0]-w:at[0],y1:y+goalWidth*scale*i/4,x2:sign<0?at[0]:at[0]+w,y2:y+goalWidth*scale*i/4,stroke:'#dbeef3','stroke-width':.7,opacity:.7}));
  for(let i=1;i<3;i++)goal.append(make('line',{x1:at[0]+sign*w*i/3,y1:y,x2:at[0]+sign*w*i/3,y2:y+goalWidth*scale,stroke:'#dbeef3','stroke-width':.7,opacity:.7}));
  goal.append(make('line',{x1:at[0],y1:y,x2:at[0],y2:y+goalWidth*scale,stroke:'#fff','stroke-width':4,'stroke-linecap':'round'}));svg.append(goal);goalPositions.push({...position,type,width:goalWidth});placement(type==='full'?'goal':'mini',at[0],at[1],{rotation:side==='left'?90:270,opening:goalWidth});
  if(type==='full'&&width>=18.32&&length>=11){
   const direction=side==='left'?1:-1,boxY=at[1]-18.32*scale/2;
   svg.append(make('path',{'data-feature':'goal-area',d:'M'+at[0]+' '+boxY+'H'+(at[0]+direction*5.5*scale)+'V'+(boxY+18.32*scale)+'H'+at[0],fill:'none',stroke:'#c4e2d5','stroke-width':1.1,opacity:.6}),make('circle',{'data-feature':'penalty-mark',cx:at[0]+direction*11*scale,cy:at[1],r:1.8,fill:'#d6e9e0',opacity:.7}));
   if(width>=40.32&&length>=26){const areaY=at[1]-40.32*scale/2;svg.append(make('path',{'data-feature':'penalty-area',d:'M'+at[0]+' '+areaY+'H'+(at[0]+direction*16.5*scale)+'V'+(areaY+40.32*scale)+'H'+at[0],fill:'none',stroke:'#c4e2d5','stroke-width':1.1,opacity:.55}));}
  }
 };
 const targetSlots=goalSlots(fullGoal+smallGoal+gateCount);
 targetSlots.slice(0,fullGoal).forEach(g=>drawGoal(g,'full'));targetSlots.slice(fullGoal,fullGoal+smallGoal).forEach(g=>drawGoal(g,'mini'));
 const discs=[];const addDisc=(long,wide)=>discs.push(point(long,wide));
 [[0,0],[length,0],[length,width],[0,width]].forEach(([x,y])=>addDisc(x,y));
 for(let i=1;i<zones.length;i++){if(Number(zones[i].y)>0){addDisc(0,Number(zones[i].y));addDisc(length,Number(zones[i].y));}else{addDisc(Number(zones[i].x)||length*i/zones.length,0);addDisc(Number(zones[i].x)||length*i/zones.length,width);}}
 const discCount=Number(material.discs||0);
 while(discs.length<discCount){const i=discs.length-4;discs.push(point(length*(i+1)/(Math.max(1,discCount-4)+1),width));}
 discs.slice(0,discCount).forEach(([x,y])=>{const g=make('g',{'class':'bible-equipment','data-equipment':'disc'});g.append(make('ellipse',{cx:x,cy:y+1.5,rx:6,ry:3.2,fill:'#e8a135',stroke:'#fff0c7','stroke-width':1}),make('ellipse',{cx:x,cy:y,rx:2,ry:1,fill:'#a26920'}));svg.append(g);placement('disc',x,y);});
 const cones=[];
 targetSlots.slice(fullGoal+smallGoal).forEach(g=>{const opening=3,long=g.side==='left'?0:length;cones.push(point(long,g.wide-opening/2),point(long,g.wide+opening/2));goalPositions.push({...g,type:'gate',width:opening});});
 const coneCount=Number(material.cones||0),circuitCones=Number(material.circuitCones||0),stations=template==='circuit'&&!['warm','cool'].includes(exercise.id)?bibleCircuitStations(group,{fx,fy,fw,fh,scale}):[];
 const stationPoints=stations.flatMap(s=>s.points);for(let i=0;i<circuitCones;i++){const p=stationPoints[i];if(p)cones.push([p.x,p.y]);else{const a=-Math.PI/2+i*Math.PI*2/circuitCones;cones.push(point(length/2+length*.41*Math.cos(a),width/2+width*.4*Math.sin(a)));}}
 for(const s of stations){svg.append(make('text',{'class':'bible-station-label',x:s.x+s.w/2,y:s.y+s.h*.52,'text-anchor':'middle',fill:'#def0e7','font-size':11},'Circuit '+(s.index+1)+' · '+s.players+' j.'));if(s.index%Math.max(1,Math.round(fw/s.w))>0)svg.append(make('line',{x1:s.x,y1:s.y+6,x2:s.x,y2:s.y+s.h-6,stroke:'#b6d4c5','stroke-width':1,'stroke-dasharray':'4 6',opacity:.45}));}
 while(cones.length<coneCount){const i=cones.length;cones.push([fx+10+i*15,fy+fh+15]);}
 cones.slice(0,coneCount).forEach(([x,y])=>{const cone=make('g',{'class':'bible-equipment','data-equipment':'cone'});cone.append(make('ellipse',{cx:x,cy:y+4,rx:6,ry:2.8,fill:'#9e541d',opacity:.6}),make('path',{d:'M'+(x-5)+' '+(y+3)+'L'+x+' '+(y-9)+'L'+(x+5)+' '+(y+3)+'Z',fill:'#ffa64c',stroke:'#fff0d7','stroke-width':1}),make('path',{d:'M'+(x-2.6)+' '+(y-3)+'H'+(x+2.6),stroke:'#fff','stroke-width':1.6}));svg.append(cone);placement('cone',x,y);});
 const tokens=bibleDiagramActors(exercise,group,{fx,fy,fw,fh,scale},goalPositions);
 const playerRadius=Math.max(9,Math.min(group.players<=12?18:15,Math.min(fw,fh)/13)),blue=tokens.filter(t=>t.team==='blue'&&!t.rotation),red=tokens.filter(t=>t.team==='red'&&!t.rotation),neutral=tokens.filter(t=>t.team==='neutral'&&!t.rotation),keepers=tokens.filter(t=>t.keeper&&!t.rotation);
 const a=blue[0],relay=neutral[0]||blue[1],third=neutral.length?blue[1]:blue[2];
 const keeperSupports=goalkeeper=>tokens.filter(t=>!t.rotation&&t!==goalkeeper&&!t.keeper&&(t.team===goalkeeper.team||t.team==='neutral'));
 const ballFeet=t=>bibleDiagramBallSpot(t,{fx,fy,fw,fh},playerRadius);
 const clearArrow=(a,b,dashed=false,label='')=>{
  if(!a||!b)return;const d=Math.hypot(b.x-a.x,b.y-a.y),start=a.number?playerRadius+4:6,end=b.number?playerRadius+8:5;if(d<start+end+8)return;const ux=(b.x-a.x)/d,uy=(b.y-a.y)/d;
  svg.append(make('line',{'class':dashed?'bible-action-pass':'bible-action-move',x1:a.x+ux*start,y1:a.y+uy*start,x2:b.x-ux*end,y2:b.y-uy*end,stroke:'#fff','stroke-width':2.2,'stroke-dasharray':dashed?'6 5':'none','marker-end':'url(#'+markerId+')',opacity:.93,...(a.number?{'data-from-number':a.number}:{}),...(b.number?{'data-to-number':b.number}:{}),...(a.team?{'data-from-team':a.team,'data-from-keeper':String(a.keeper)}:{}),...(b.team?{'data-to-team':b.team}:{})}));
  if(label)svg.append(make('text',{'class':'bible-action-label',x:(a.x+b.x)/2-uy*12,y:(a.y+b.y)/2+ux*12,fill:'#fff','font-size':10,'text-anchor':'middle','paint-order':'stroke',stroke:'#176247','stroke-width':3},label));
 };
 const returnArrow=(from,to,label)=>{const dx=to.x-from.x,dy=to.y-from.y,d=Math.hypot(dx,dy);if(d<playerRadius*3)return;const ux=dx/d,uy=dy/d,cx=(from.x+to.x)/2-uy*32,cy=(from.y+to.y)/2+ux*32;svg.append(make('path',{'class':'bible-action-pass',d:'M'+(from.x+ux*(playerRadius+4))+' '+(from.y+uy*(playerRadius+4))+'Q'+cx+' '+cy+' '+(to.x-ux*(playerRadius+8))+' '+(to.y-uy*(playerRadius+8)),fill:'none',stroke:'#fff','stroke-width':2.2,'stroke-dasharray':'6 5','marker-end':'url(#'+markerId+')'}),make('text',{'class':'bible-action-label',x:cx,y:cy,'text-anchor':'middle',fill:'#fff','font-size':10,'paint-order':'stroke',stroke:'#176247','stroke-width':3},label));};
 // Une à trois actions de principe, rattachées au mécanisme football travaillé.
 let ballOwner=blue[0]||neutral[0]||red[0]||keepers[0],ballPoint=ballOwner?ballFeet(ballOwner):px(length*.5,width*.5);
 if(mechanism.type==='third'&&a&&relay&&third){clearArrow(a,relay,true,'1');returnArrow(relay,a,'2');clearArrow(a,third,true,'3');ballPoint=ballFeet(a);}
 else if(['back','turn'].includes(mechanism.type)&&(blue[1]||neutral[0])){const receiver=blue[1]||neutral[0];clearArrow(a,receiver,true,'1');returnArrow(receiver,a,'2 · soutien');ballPoint=ballFeet(a);}
 else if(mechanism.type==='split'&&blue.length>1){clearArrow(a,blue[1],true,'fenêtre');ballPoint=ballFeet(a);}
 else if(mechanism.type==='delay'&&red[0]){clearArrow(a,px(length*.46,width*.32),false,'avancer');clearArrow(red[0],px(length*.64,width*.37),false,'temporiser');ballPoint=ballFeet(a);}
 else if(mechanism.type==='trap'&&red[0]){clearArrow(red[0],px(length*.43,width*.22),false,'fermer l’axe');if(red[1])clearArrow(red[1],px(length*.58,width*.31),false,'couvrir');ballPoint=ballFeet(a);}
 else if(mechanism.type==='isolate'&&blue[1]){clearArrow(a,blue[1],true,'servir large');clearArrow(a,px(length*.45,width*.32),false,'soutenir');ballPoint=ballFeet(a);}
 else if(mechanism.type==='support'&&blue.length>1){const receive=px(length*.62,width*.24);clearArrow(blue[1],receive,false,'1');clearArrow(a,receive,true,'2');ballPoint=ballFeet(a);}
 else if(mechanism.type==='switch'&&blue.length>1){const far=blue[blue.length-1];if(blue.length>2){clearArrow(a,blue[1],true,'1');clearArrow(blue[1],far,true,'2');}else clearArrow(a,far,true);ballPoint=ballFeet(a);}
 else if(mechanism.type==='cover'&&red.length){clearArrow(red[0],px(length*.43,width*.29),false,'Presser');if(red[1])clearArrow(red[1],px(length*.6,width*.43),false,'Couvrir');if(exercise.id==='press-cover-three'&&red[2])clearArrow(red[2],px(length*.68,width*.73),false,'Équilibrer');ballPoint=ballFeet(a);}
 else if(mechanism.type==='block'&&red.length){red.slice(0,3).forEach((t,i)=>clearArrow(t,px(t.long-length*.07,Math.max(width*.09,t.wide-width*.18)),false,i===0?'Coulisser':''));ballPoint=ballFeet(a);}
 else if(mechanism.type==='loss'&&red.length&&blue.length){const recovered=red[0];clearArrow(a,px(length*.43,width*.44),false,'Presser');if(blue[1])clearArrow(blue[1],px(length*.63,width*.64),false,'Fermer');ballPoint=ballFeet(recovered);}
 else if(mechanism.type==='regain'&&blue.length>1){clearArrow(a,blue[1],true,'1');if(blue[2])clearArrow(blue[2],px(length*.82,width*.73),false,'2');ballPoint=ballFeet(a);}
 else if(mechanism.type==='balance'&&blue.length>1){clearArrow(blue[1],px(length*.41,width*.44),false,'Équilibrer');if(blue[2])clearArrow(blue[2],px(length*.39,width*.62),false);ballPoint=ballFeet(a);}
 else if(mechanism.type==='retreat'&&blue.length){clearArrow(a,px(length*.71,width*.35),false,'Ralentir');if(blue[1])clearArrow(blue[1],px(length*.81,width*.58),false,'Couvrir');if(red[0])ballPoint=ballFeet(red[0]);}
 else if(mechanism.type==='underlap'&&blue.length>1){const inside=px(length*.8,width*.34);clearArrow(blue[1],inside,false,'1');clearArrow(a,inside,true,'2');ballPoint=ballFeet(a);}
 else if(['behind','depth'].includes(mechanism.type)&&blue.length>1){const depth=px(length*.9,width*.7);clearArrow(blue[1],depth,false,'Appeler');clearArrow(a,depth,true);if(mechanism.type==='depth'&&red[0])clearArrow(red[0],px(length*.83,width*.55),false,'Ajuster');ballPoint=ballFeet(a);}
 else if(mechanism.type==='throw'&&blue.length>1){ballPoint=px(length*.32,0);clearArrow(ballPoint,blue[1],true,'1');if(blue[2])clearArrow(blue[1],blue[2],true,'2');}
 else if(mechanism.type==='keeperpass'&&keepers.length){ballOwner=keepers[0];ballPoint=ballFeet(ballOwner);clearArrow(ballOwner,keeperSupports(ballOwner)[0],true);}
 else if(template==='build'&&keepers.length&&blue.length){ballOwner=keepers[0];ballPoint=ballFeet(ballOwner);clearArrow(ballOwner,blue.find(t=>!t.keeper),true);}
 else if(template==='corner'){
  ballPoint=px(length*.98,width*.025);const receiver=blue.slice(1).sort((a,b)=>b.long-a.long)[0];clearArrow(ballPoint,receiver,true);
 }else if(template==='wide-finish'&&blue.length>1){
  const crosser=blue[0],receiver=blue.slice(1).sort((a,b)=>b.long-a.long)[0];clearArrow(crosser,receiver,true);ballPoint=ballFeet(crosser);
  if(mechanism.type==='defendcross'&&red[0]&&receiver)clearArrow(red[0],px(Math.min(length*.9,receiver.long+length*.08),receiver.wide),false,'Accompagner');
 }else if(['finish','keeper'].includes(template)){
  const shooter=blue.slice().sort((a,b)=>b.long-a.long)[0];const target=goalPositions[0];if(shooter&&target){clearArrow(shooter,{x:target.side==='left'?fx:fx+fw,y:fy+target.wide*scale},true);ballPoint=ballFeet(shooter);}
 }else if(template==='press'&&red.length&&blue.length){
  const presser=red.slice().sort((a,b)=>a.long-b.long)[0],receiver=blue.slice().sort((a,b)=>b.long-a.long)[0];if(presser&&receiver){const towards={x:presser.x+(receiver.x-presser.x)*.45,y:presser.y+(receiver.y-presser.y)*.45};clearArrow(presser,towards,false);}
 }else if(template==='duel'&&blue.length){clearArrow(blue[0],px(length*.7,Math.max(width*.15,blue[0].wide-width*.13)),false);}
 else if(blue.length>1){
  const first=blue[0],second=blue.slice(1).sort((a,b)=>Math.hypot(a.x-first.x,a.y-first.y)-Math.hypot(b.x-first.x,b.y-first.y))[0];clearArrow(first,second,true);
 }
 tokens.forEach(t=>{
  const r=playerRadius,color=t.keeper&&!t.fieldKeeper?'#ffd166':t.team==='red'?'#df5a65':t.team==='neutral'?'#f5f8ff':'#3679dd',textColor=t.keeper&&!t.fieldKeeper||t.team==='neutral'?'#19385c':'#fff';
  const player=make('g',{'class':'exercise-player bible-player','data-team':t.team,'data-keeper':String(t.keeper),'data-rotation':String(t.rotation),'data-number':t.number,transform:'translate('+t.x+' '+t.y+')'});
  player.append(make('ellipse',{cx:1,cy:r*.86,rx:r*.92,ry:r*.36,fill:'#002c2640'}));
  player.append(make('circle',{cx:0,cy:0,r,fill:color,stroke:'#fff','stroke-width':2}),make('circle',{cx:0,cy:0,r:r-3,fill:'none',stroke:'#ffffff',opacity:.18,'stroke-width':1}));
  player.append(make('text',{x:0,y:r*.33,'text-anchor':'middle',fill:textColor,'font-size':t.keeper?Math.max(9,r*.65):Math.max(12,r*.8),'font-weight':800},t.keeper?'G'+t.number:t.number));if(t.fieldKeeper)player.append(make('circle',{cx:r*.78,cy:-r*.78,r:3,fill:'#ffd166',stroke:'#fff','stroke-width':.7}));
  if(t.rotation)player.append(make('circle',{cx:0,cy:0,r:r*1.35,fill:'none',stroke:'#687f9d','stroke-width':1,'stroke-dasharray':'3 3'}));svg.append(player);placement(t.keeper&&!t.fieldKeeper?'keeper':t.team==='red'?'red':'blue',t.x,t.y,{color,label:t.rotation?'G'+t.number+' rotation':t.keeper?'G'+t.number:String(t.number)});
 });
 const ballCount=Number(material.balls||0),drawBall=(x,y,reserve=false)=>{
  const g=make('g',{'class':'bible-equipment','data-equipment':'ball','data-reserve':String(reserve)});g.append(make('circle',{cx:x,cy:y,r:4.9,fill:'#fff',stroke:'#173d3a','stroke-width':1.2}),make('path',{d:'M'+x+' '+(y-2.3)+'l2.2 1.5-.8 2.4h-2.8l-.8-2.4z',fill:'#244d4b'}));svg.append(g);placement('ball',x,y,{color:'#ffffff'});
 };
 const activeBalls=Math.min(ballCount,Math.max(0,Number(material.activeBalls??1)));
 if(template==='circuit'){for(const t of bibleDiagramBallActors(tokens,activeBalls)){const at=ballFeet(t);drawBall(at.x,at.y);}for(let i=activeBalls;i<ballCount;i++)drawBall(fx+10+(i-activeBalls)*14,fy+fh+27,true);}
 else{if(activeBalls)drawBall(ballPoint.x,ballPoint.y);for(let i=1;i<activeBalls;i++){const t=tokens[i%tokens.length];{const at=ballFeet(t);drawBall(at.x,at.y);}}for(let i=activeBalls;i<ballCount;i++)drawBall(fx+10+(i-activeBalls)*14,fy+fh+27,true);}
 const extraEquipment=[['poles','pole'],['dummies','dummy'],['hurdles','hurdle'],['ladders','ladder'],['hoops','hoop']];let extraIndex=0;
 extraEquipment.forEach(([key,type])=>{for(let i=0;i<Number(material[key]||0);i++){
  const x=fx+fw*.15+(extraIndex%6)*Math.min(38,fw*.11),y=fy+fh-23-Math.floor(extraIndex/6)*28,g=make('g',{'class':'bible-equipment','data-equipment':type,transform:'translate('+x+' '+y+')'});extraIndex++;
  if(type==='pole')g.append(make('ellipse',{cx:0,cy:8,rx:6,ry:3,fill:'#263e46'}),make('line',{x1:0,y1:8,x2:0,y2:-19,stroke:'#ffd166','stroke-width':4}));
  if(type==='dummy')g.append(make('circle',{cx:0,cy:-13,r:4,fill:'#ffce5e',stroke:'#fff','stroke-width':.8}),make('path',{d:'M-6-7H6L8 7H-8Z',fill:'#ffce5e',stroke:'#fff','stroke-width':1}),make('line',{x1:0,y1:7,x2:0,y2:15,stroke:'#d1e1eb','stroke-width':2}));
  if(type==='hurdle')g.append(make('path',{d:'M-10 9V-4H10V9',fill:'none',stroke:'#f9c64c','stroke-width':3}));
  if(type==='ladder'){g.append(make('path',{d:'M-6-17V17M6-17V17',stroke:'#1e3544','stroke-width':2}));for(let j=-15;j<=15;j+=6)g.append(make('path',{d:'M-6 '+j+'H6',stroke:'#f4c34b','stroke-width':2}));}
  if(type==='hoop')g.append(make('ellipse',{cx:0,cy:0,rx:10,ry:7,fill:'none',stroke:'#ffd166','stroke-width':3}));svg.append(g);placement(type,x,y);
 }});
 // L’inventaire présenté à côté du schéma et les éléments dessinés ont les mêmes comptes.
 const reserveBallCount=ballCount-activeBalls;
 const pitchBottom=fy+fh;
 if(reserveBallCount)svg.append(make('text',{x:fx+10,y:pitchBottom+48,fill:'#536b87','font-size':10},reserveBallCount+' ballon'+(reserveBallCount>1?'s':'')+' de réserve'));
 if(rotatingKeepers)svg.append(make('text',{x:fx+fw,y:pitchBottom+48,'text-anchor':'end',fill:'#536b87','font-size':10},rotatingKeepers+' G en rotation'));
 const activeBallCircles=[...svg.querySelectorAll('[data-equipment="ball"][data-reserve="false"] circle')],ballActors=template==='circuit'?bibleDiagramBallActors(tokens,activeBalls):[];
 const firstOwner=tokens.filter(t=>!t.rotation).slice().sort((a,b)=>{const pa=ballFeet(a),pb=ballFeet(b);return Math.hypot(pa.x-ballPoint.x,pa.y-ballPoint.y)-Math.hypot(pb.x-ballPoint.x,pb.y-ballPoint.y);})[0];
 const balls=activeBallCircles.map((circle,i)=>({id:i?'ball-'+i:'ball',x:Number(circle.getAttribute('cx')),y:Number(circle.getAttribute('cy')),owner:ballActors[i]?.number??(!i?firstOwner?.number:undefined)}));
 svg.bibleScene={tokens:tokens.map(t=>({...t})),ball:balls[0]?{x:balls[0].x,y:balls[0].y}:{...ballPoint},balls,field:{fx,fy,fw,fh,scale,width,length},goals:goalPositions.map(g=>({...g})),playerRadius,activeBalls,template,mechanism};
 if(typeof bibleCoachScenario==='function'){
  const coachX=fx+fw*.5,coachY=fy+fh+24;svg.append(make('circle',{'data-feature':'coach',cx:coachX,cy:coachY,r:10,fill:'#173c58',stroke:'#c4d8e7','stroke-width':1.5}),make('text',{x:coachX,y:coachY+4,'text-anchor':'middle',fill:'#fff','font-size':11,'font-weight':700},'C'));
  const owner=template==='circuit'?ballActors[0]:firstOwner,player=owner?svg.querySelector('.bible-player[data-number="'+owner.number+'"]'):null;
  if(player)player.prepend(make('circle',{'class':'bible-start-ring',cx:0,cy:0,r:playerRadius+5,fill:'none',stroke:'#ffe298','stroke-width':2,'stroke-dasharray':'4 3'}));
  svg.append(make('text',{'class':'bible-installation-note',x:440,y:fy+fh+65,'text-anchor':'middle',fill:'#355278','font-size':10},'C : coach et réserve hors terrain · départ : '+(owner?'n° '+owner.number:'au signal du coach')));
 }
 const keyY=590;
 const legend=[{x:135,color:'#3679dd',text:'Équipe bleue'},{x:325,color:'#df5a65',text:'Équipe rouge'},{x:520,color:'#f5f8ff',text:'Appui neutre'},{x:700,color:'#ffd166',text:'Gardien · G'}];
 legend.filter(k=>k.text==='Équipe bleue'?teams.blue:k.text==='Équipe rouge'?teams.red:k.text==='Appui neutre'?teams.neutral:group.keepers).forEach((k,i,list)=>{k.x=viewLeft+24+i*(viewWidth-32)/list.length;svg.append(make('circle',{cx:k.x-13,cy:keyY-4,r:5.5,fill:k.color,stroke:'#8293aa','stroke-width':.8}),make('text',{x:k.x,y:keyY,fill:'#3d5777','font-size':11},k.text));});
 svg.append(make('line',{x1:245,y1:616,x2:285,y2:616,stroke:'#526b89','stroke-width':1.8,'stroke-dasharray':'5 4'}),make('text',{x:294,y:620,fill:'#526b89','font-size':11},'Passe / frappe'),make('line',{x1:455,y1:616,x2:495,y2:616,stroke:'#526b89','stroke-width':1.8}),make('text',{x:504,y:620,fill:'#526b89','font-size':11},'Déplacement'));
 svg.append(make('text',{x:440,y:645,'text-anchor':'middle',fill:'#667d98','font-size':10},'Plan d’installation · positions de départ indicatives · cotes en mètres'));
 return svg;
}
function bibleDiagram(exercise,session,options={}){
 const plan=options.plan||(typeof biblePlan==='function'?biblePlan(exercise,session,options):null),groups=plan?.groups||[],root=document.createElement('figure');root.className='training-diagram bible-diagram';
 if(!groups.length){const message=document.createElement('p');message.className='training-alert';message.textContent='Aucune installation proposée pour cet effectif. Choisissez une autre organisation.';root.append(message);return root;}
 let selected=Math.max(0,Math.min(groups.length-1,Number(options.groupIndex)||0)),sequenceIndex=Math.max(0,Number(options.sequenceIndex)||0);
 const knowledge=bibleDiagramKnowledge(exercise),sequences=knowledge.sequences||[],controls=document.createElement('div');controls.className='training-diagram-controls bible-diagram-selection';
 const heading=document.createElement('strong');heading.textContent='Installer l’exercice';controls.append(heading);
 const workshop=document.createElement('select');workshop.setAttribute('aria-label','Atelier illustré · '+exercise.title);groups.forEach((g,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent='Atelier '+g.index+' · '+g.players+' joueurs';workshop.append(option);});workshop.value=String(selected);if(groups.length>1)controls.append(workshop);
 const sequence=document.createElement('select');sequence.setAttribute('aria-label','Séquence illustrée · '+exercise.title);sequences.forEach((s,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=(index+1)+'. '+s.title;sequence.append(option);});sequence.value=String(sequenceIndex);if(sequences.length>1&&options.sequenceControls!==false)controls.append(sequence);root.append(controls);
 const zoom=document.createElement('button');zoom.type='button';zoom.className='bible-diagram-zoom-toggle';zoom.textContent='Agrandir le schéma';zoom.setAttribute('aria-pressed','false');zoom.onclick=()=>{const active=root.classList.toggle('bible-diagram-zoomed');zoom.setAttribute('aria-pressed',String(active));zoom.textContent=active?'Réduire le schéma':'Agrandir le schéma';};controls.append(zoom);
 const display=document.createElement('div');display.className='training-diagram-screen';root.append(display);
 const animationHost=document.createElement('div');animationHost.className='bible-animation-host';if(options.animation!==false)root.append(animationHost);
 const print=document.createElement('div');print.className='training-diagram-print';root.append(print);
 const caption=document.createElement('figcaption');caption.className='bible-diagram-active-rule';root.append(caption);
 let animation=null;
 function render(){
  animation?.dispose();animation=null;animationHost.replaceChildren();
  const svg=bibleDiagramSVG(exercise,groups[selected],{...options,sequenceIndex});display.replaceChildren(svg);
  if(options.animation!==false&&typeof bibleAnimationMount==='function'&&!svg.dataset.invalid){animation=bibleAnimationMount(root,svg,exercise,groups[selected],{...options,sequenceIndex});animationHost.append(animation.element);root.bibleAnimation=animation;}
  const seen=new Set();print.replaceChildren();groups.forEach(g=>{const key=JSON.stringify([g.players,g.keepers,g.width,g.length,g.teams,g.material,g.fits]);if(!seen.has(key)){seen.add(key);print.append(bibleDiagramSVG(exercise,g,{...options,sequenceIndex}));}});
  const active=bibleDiagramSequence(exercise,sequenceIndex),mechanism=bibleDiagramMechanism(exercise),material=groups[selected].material||{},targets=[material.goals?'But : 7,32 m':null,material.miniGoals?'Mini-buts : 2 m':null,material.gates?'Portes : 3 m':null].filter(Boolean).join(' · ');caption.textContent=(mechanism.caption?mechanism.caption+' ':'')+(options.showSequenceRule===false?'':(active.title?'Séquence '+(sequenceIndex+1)+' · '+active.title+' : ':'')+(active.rule||exercise.goal||''))+(targets?' '+targets+'.':'')+(groups[selected].fits===false?' Installation à revoir : vérifier l’effectif et l’espace requis.':'');
  root.dataset.groupIndex=String(selected);root.dataset.sequenceIndex=String(sequenceIndex);
 }
 root.bibleSetGroup=index=>{selected=Math.max(0,Math.min(groups.length-1,Number(index)||0));workshop.value=String(selected);render();};
 root.bibleSetSequence=index=>{sequenceIndex=Math.max(0,Math.min(Math.max(0,sequences.length-1),Number(index)||0));sequence.value=String(sequenceIndex);render();};
 root.bibleDispose=()=>{animation?.dispose();animation=null;root.bibleAnimation=null;};
 workshop.onchange=()=>{root.bibleSetGroup(workshop.value);if(typeof options.onGroupChange==='function')options.onGroupChange(selected);};
 sequence.onchange=()=>{root.bibleSetSequence(sequence.value);if(typeof options.onSequenceChange==='function')options.onSequenceChange(sequenceIndex);};
 render();return root;
}
// Copie des placements initiaux vers l'atelier libre, sans toucher au tableau de match.
// Les frontières de zones restent matérialisées par leurs coupelles ; l'atelier n'impose pas de fausses proportions de zones.
function bibleEditableBoard(exercise,group){
 const svg=bibleDiagramSVG(exercise,group),placements=svg.biblePlacement;
 if(!Array.isArray(placements)||placements.length>100)return null;
 const scale=Math.min(1020/group.length,540/group.width),left=(1200-group.length*scale)/2,top=(750-group.width*scale)/2-12;
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const objects=placements.map((p,index)=>{
  const isPlayer=['blue','red','keeper'].includes(p.type),size=p.type==='goal'||p.type==='mini'?p.opening*scale/(p.type==='goal'?114:66):isPlayer? .68:.5;
  return {id:'bible-'+bibleDiagramSerial+'-'+index,type:p.type,x:clamp((left+p.long*scale)/12,2,98),y:clamp((top+p.wide*scale)/7.5,2,98),rotation:p.rotation||0,scale:clamp(size,.5,3),label:p.label||'',color:p.color||(p.type==='goal'||p.type==='mini'?'#ffffff':'#ffb23e')};
 });
 return {version:1,lines:false,seconds:2,frames:[{objects}]};
}
