// Démonstrations locales de principes de jeu. Aucune vidéo ni ressource distante.
// Les positions initiales et le matériel restent ceux du plan d'installation.
function bibleAnimationScene(exercise,group,options={}){
 const field=bibleDiagramField(group),knowledge=bibleDiagramKnowledge(exercise),template=group.template||knowledge.template||'possession',material=group.material||{};
 const count=Number(material.goals||0)+Number(material.miniGoals||0)+Number(material.gates||0),goalSide=template==='build'?'left':'right';
 const goals=Array.from({length:count},(_,i)=>({side:count===1?goalSide:i%2===0?'left':'right',wide:count>2?(Math.floor(i/2)+1)*group.width/(Math.ceil(count/2)+1):group.width/2,type:i<Number(material.goals||0)?'full':i<Number(material.goals||0)+Number(material.miniGoals||0)?'mini':'gate'}));
 if(exercise.id==='press-goalkick')goals.splice(0,goals.length,...biblePressRestartTargets(group));
 if(exercise.id==='duel-renforts')goals.splice(0,goals.length,{side:'right',wide:group.width/2,type:'full'},{side:'top',wide:0,long:group.length*.52,type:'mini'},{side:'bottom',wide:group.width,long:group.length*.52,type:'mini'});
 const tokens=bibleDiagramActors(exercise,group,field,goals,options),active=tokens.filter(t=>!t.rotation),blue=active.filter(t=>t.team==='blue'),red=active.filter(t=>t.team==='red'),keepers=active.filter(t=>t.keeper);
 const radius=bibleDiagramPlayerRadius(group,field),mechanism=bibleDiagramMechanism(exercise);
 let owner=blue[0]||active[0],ball=owner?bibleDiagramBallSpot(owner,field,radius):{x:field.fx+field.fw/2,y:field.fy+field.fh/2};
 if(mechanism.type==='retreat'&&red[0])owner=red[0];
 if((mechanism.type==='keeperpass'||template==='build'&&!mechanism.type)&&keepers.length)owner=keepers[0];
 if(template==='wide-finish'&&blue[0])owner=blue[0];
 if(['finish','keeper'].includes(template)&&!(mechanism.type==='keeperpass'&&keepers.length))owner=blue.slice().sort((a,b)=>b.x-a.x)[0]||owner;
 if(exercise.id==='press-goalkick')owner=keepers.find(k=>k.team==='blue')||owner;
 if(mechanism.type==='combine')owner=blue[0];
 if(exercise.id==='rondo-expand')owner=red[0];
 if(exercise.id==='possession-quadrants')owner=active.find(p=>p.team==='neutral')||owner;
 if(owner)ball=bibleDiagramBallSpot(owner,field,radius);
 if(template==='circuit'&&tokens[0])ball=bibleDiagramBallSpot(tokens[0],field,radius);
 if(mechanism.type==='throw')ball={x:field.fx+field.fw*.32,y:field.fy};
 if(template==='corner')ball={x:field.fx+field.fw*.98,y:field.fy+field.fh*.025};
 const activeBalls=Math.min(Number(material.balls||0),Number(material.activeBalls??1)),owners=template==='circuit'?bibleDiagramBallActors(tokens,activeBalls):[];
 const balls=Array.from({length:activeBalls},(_,i)=>({id:i?'ball-'+i:'ball',...(i?bibleDiagramBallSpot(owners[i]||tokens[i%tokens.length],field,radius):ball),owner:owners[i]?.number??(!i?owner?.number:undefined)}));
 return {tokens,ball,balls,field,goals,playerRadius:radius,activeBalls,template,mechanism};
}

// Pure engine: no DOM reads, no timer, no mutation of a plan, exercise or group.
// Pixel coordinates share the fixed 880 × 660 SVG viewBox; metric dimensions
// remain available on plan.field for tests and any future renderer.
function bibleAnimationPlan(exercise,group,options={}){
 const source=options.scene||bibleAnimationScene(exercise,group,options),scene={...source,field:{...source.field},tokens:source.tokens.map(t=>({...t})),ball:{...source.ball},balls:(source.balls||[{id:'ball',...source.ball}]).map(b=>({...b})),goals:(source.goals||[]).map(g=>({...g}))};
 const {field,template,mechanism}=scene,players=scene.tokens.map(t=>({...t})),active=players.filter(t=>!t.rotation),blue=active.filter(t=>t.team==='blue'&&(!t.keeper||t.fieldKeeper)),red=active.filter(t=>t.team==='red'&&(!t.keeper||t.fieldKeeper)),neutrals=active.filter(t=>t.team==='neutral'),keepers=active.filter(t=>t.keeper);
 const positions=new Map(players.map(p=>[p.number,{x:p.x,y:p.y}])),steps=[];
 let ball={...scene.ball},time=0,ballOwner=scene.balls[0]?.owner??active.slice().sort((a,b)=>Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y))[0]?.number;const extraBalls=new Map(scene.balls.filter(b=>b.id!=='ball').map(b=>[b.id,{...b}]));
 const initialOwner=players.find(p=>p.number===ballOwner);let possessionTeam=['blue','red'].includes(initialOwner?.team)?initialOwner.team:'blue',gamePhase='play',gameFormat=exercise.id==='duel-renforts'?'1 contre 1':'';
 const point=(long,wide)=>({x:field.fx+long*field.fw,y:field.fy+wide*field.fh});
 const safe=(p,margin=0)=>({x:Math.max(field.fx+margin,Math.min(field.fx+field.fw-margin,p.x)),y:Math.max(field.fy+margin,Math.min(field.fy+field.fh-margin,p.y))});
 const circuits=template==='circuit'&&!['warm','cool'].includes(exercise.id)?bibleCircuitStations(group,field):[];
 const safeRun=(target,id,margin=scene.playerRadius+2)=>{const actor=players.find(p=>p.number===id),base=scene.tokens.find(p=>p.number===id),quadrant=exercise.id==='possession-quadrants'&&base&&base.team!=='neutral'?{x:field.fx+(base.x>field.fx+field.fw/2?field.fw/2:0),y:field.fy+(base.y>field.fy+field.fh/2?field.fh/2:0),w:field.fw/2,h:field.fh/2}:null,cell=quadrant||circuits.find(s=>id>s.offset&&id<=s.offset+s.players);if(!cell)return safe(target,margin);const mx=Math.min(margin,cell.w*.2),my=Math.min(margin,cell.h*.2);return{x:Math.max(cell.x+mx,Math.min(cell.x+cell.w-mx,target.x)),y:Math.max(cell.y+my,Math.min(cell.y+cell.h-my,target.y))};};
 const current=p=>p?positions.get(p.number):null;
 const feet=p=>{const at=current(p);return at?bibleDiagramBallSpot({...p,...at},field,scene.playerRadius):{...ball};};
 const friends=p=>active.filter(t=>t.number!==p.number&&!t.keeper&&(t.team===p.team||t.team==='neutral'));
 const move=(p,target,timing={})=>p&&!p.rotation?{player:p.number,to:safeRun(target,p.number),start:timing.start??0,end:timing.end??1}:null;
 const advance=(p,dx,dy)=>{const at=current(p);return at?move(p,{x:at.x+dx*field.fw,y:at.y+dy*field.fh}):null;};
 const rondoSupport=p=>{if(!p)return null;const at=current(p),angle=Math.atan2((at.y-field.fy-field.fh/2)/(.38*field.fh),(at.x-field.fx-field.fw/2)/(.39*field.fw))+.12;return move(p,point(.5+.39*Math.cos(angle),.5+.38*Math.sin(angle)),{start:.7});};
 function add(title,caption,seconds,moves=[],ballTarget=null){
  if(exercise.id==='cpa-attack'&&!(Number(options.sequenceIndex)||0))moves=moves.filter(change=>change&&players.find(p=>p.number===change.player)?.team!=='red');
  const motions=[],holder=ballOwner;
  const moving=new Set(moves.filter(Boolean).map(m=>m.player));
  // Authored football paths: never invent a detour to avoid a shirt on screen.
  for(const change of moves.filter(Boolean)){
   const from=positions.get(change.player);if(!from)continue;const to=safeRun(change.to,change.player);
   motions.push({kind:'player',id:change.player,from:{...from},to,startFraction:Math.max(0,Math.min(.8,change.start||0)),endFraction:Math.max(.2,Math.min(1,change.end??1))});positions.set(change.player,{...to});
  }
  let target=typeof ballTarget==='function'?ballTarget():ballTarget;
  const carrying=!target&&moving.has(ballOwner);if(carrying)target=feet(players.find(p=>p.number===ballOwner));
  const attach=(motion,owner)=>{const run=motions.find(m=>m.kind==='player'&&m.id===owner);if(run?.control)motion.control=safe({x:run.control.x+(motion.from.x-run.from.x+motion.to.x-run.to.x)/2,y:run.control.y+(motion.from.y-run.from.y+motion.to.y-run.to.y)/2});motion.easing='run';motion.follow=owner;};
  if(target){const to=safe(target),motion={kind:'ball',id:'ball',from:{...ball},to};if(carrying||typeof ballTarget==='function'&&moving.has(ballOwner)&&Math.hypot(to.x-feet(players.find(p=>p.number===ballOwner)).x,to.y-feet(players.find(p=>p.number===ballOwner)).y)<.01)attach(motion,ballOwner);else ballOwner=null;motions.push(motion);ball={...to};}
  for(const [id,other]of extraBalls){const owner=players.find(p=>p.number===other.owner);if(owner&&moves.some(m=>m?.player===other.owner)){const to=feet(owner),motion={kind:'ball',id,from:{x:other.x,y:other.y},to};attach(motion,owner.number);motions.push(motion);Object.assign(other,to);}}
  // A shared clock, with a shorter ball flight inside the running phase.
  // The passer retains the ball until departure; the receiver catches it on arrival.
  const duration=Math.max(.65,seconds*.7,...motions.map(m=>Math.hypot(m.to.x-m.from.x,m.to.y-m.from.y)/field.scale/(m.kind==='player'?3.8*Math.max(.2,(m.endFraction??1)-(m.startFraction||0)):m.easing==='run'?3.8:12)));
  for(const motion of motions.filter(m=>m.kind==='player')){motion.delay=duration*(motion.startFraction||0);motion.duration=duration*Math.max(.2,(motion.endFraction??1)-(motion.startFraction||0));}
  for(const motion of motions.filter(m=>m.kind==='ball'&&m.easing!=='run')){
   const departureRun=motions.find(m=>m.kind==='player'&&m.id===holder),original={...motion.from};
   let flight=Math.max(.25,Math.hypot(motion.to.x-original.x,motion.to.y-original.y)/field.scale/12);
   for(let i=0;i<4;i++){const delay=Math.max(0,duration-flight),fraction=departureRun?Math.max(0,Math.min(1,(delay-(departureRun.delay||0))/(departureRun.duration||duration))):delay/duration;motion.from=departureRun?{x:original.x+(departureRun.to.x-departureRun.from.x)*fraction,y:original.y+(departureRun.to.y-departureRun.from.y)*fraction}:{...original};flight=Math.min(duration,Math.max(.25,Math.hypot(motion.to.x-motion.from.x,motion.to.y-motion.from.y)/field.scale/12));}
   motion.delay=Math.max(0,duration-flight);motion.duration=duration-motion.delay;motion.before=original;if(departureRun)motion.departurePlayer=holder;
  }
  const step={index:steps.length,start:time,duration,end:time+duration,title,caption,motions,owner:ballOwner,team:possessionTeam,phase:gamePhase,format:gameFormat};steps.push(step);time+=duration;
 }
 const settle=()=>{}; // Optional guided stops belong to the player, not the choreography.
 const possession=p=>{if(p&&['blue','red'].includes(p.team))possessionTeam=p.team;if(!p||ballOwner===p.number)return;add('Préparer l’action','Le ballon est remis au joueur '+p.number+' pour démarrer la situation.',1.5,[],()=>feet(p));ballOwner=p.number;};
 const pass=(from,to,title,caption,seconds=1.8,moves=[],delivery={})=>{if(!from||!to||from.number===to.number)return;possession(from);add(title,caption,seconds,moves,()=>feet(to));const step=steps[steps.length-1];step.from=from.number;step.to=to.number;step.action='pass';if(delivery.loft){step.delivery='aerial';const flight=step.motions.find(m=>m.kind==='ball');if(flight)flight.loft=delivery.loft;}ballOwner=to.number;if(['blue','red'].includes(to.team))possessionTeam=to.team;settle();};
 const carry=(p,target,title,caption,seconds=1.8,others=[])=>{if(!p)return;possession(p);add(title,caption,seconds,[move(p,target),...others],()=>feet(p));const step=steps[steps.length-1],motion=step.motions.find(m=>m.kind==='ball');if(motion)motion.easing='run';step.action='carry';step.from=p.number;settle();};
 function intercept(from,intended,defender,title,caption,moves=[]){
  if(!from||!intended||!defender)return;possession(from);
  const destination=feet(intended),hit={x:ball.x+(destination.x-ball.x)*.52,y:ball.y+(destination.y-ball.y)*.52},at=current(defender),offset=feet(defender);
  const arrival={x:hit.x-(offset.x-at.x),y:hit.y-(offset.y-at.y)};gamePhase='interception';
  add(title,caption,1.8,[...moves,move(defender,arrival)],()=>feet(defender));Object.assign(steps.at(-1),{action:'recovery',from:from.number,to:defender.number,intendedTo:destination});ballOwner=defender.number;possessionTeam=defender.team;gamePhase='transition';
 }
 function loose(target,title,caption,action='clearance',moves=[]){const from=ballOwner;add(title,caption,1.5,moves,target);Object.assign(steps.at(-1),{action,from});ballOwner=null;}
 function control(p,title,caption){if(!p)return;const at=current(p),offset=feet(p),target={x:ball.x-(offset.x-at.x),y:ball.y-(offset.y-at.y)};add(title,caption,1.8,[move(p,target)]);Object.assign(steps.at(-1),{action:'control',to:p.number,owner:p.number});ballOwner=p.number;possessionTeam=p.team;}
 const targetGoal=scene.goals.find(g=>g.side==='right')||scene.goals[0];
 const goalPoint=(wide=.5)=>point(targetGoal?.side==='left'?0:1,targetGoal?targetGoal.wide/group.width:wide);
 const a=blue[0]||active.find(p=>!p.keeper),b=blue[1],c=blue[2],relay=neutrals[0]||b,third=neutrals.length?b:c;
 const nearRed=red.slice().sort((p,q)=>Math.hypot(p.x-(a?.x||0),p.y-(a?.y||0))-Math.hypot(q.x-(a?.x||0),q.y-(a?.y||0)))[0];
 const demonstrationIndex=options.designIndex===undefined?Number(options.sequenceIndex)||0:0;
 const sequence=bibleDiagramSequence(exercise,options.sequenceIndex);
 const initial={players:players.map(p=>({...p})),ball:{...scene.ball},balls:scene.balls.map(b=>({...b}))};
 const result=()=>({version:2,exerciseId:exercise.id,groupIndex:group.index,sequenceIndex:Number(options.sequenceIndex)||0,field:{...field},playerRadius:scene.playerRadius,initial,steps,duration:Math.round(time*100)/100,available:steps.length>0&&group.fits!==false&&group.pedagogyFits!==false&&scene.activeBalls>0,label:'Exemple animé · lecture continue',sequenceRule:sequence.rule||'',note:'Exemple d’action pour comprendre le principe ; les décisions restent libres dans le jeu.'});
 if(group.fits===false||group.pedagogyFits===false||!active.length||!scene.activeBalls)return result();
 if(template==='circuit'&&!['warm','cool'].includes(exercise.id)&&typeof bibleCircuitAnimationPlan==='function')return bibleCircuitAnimationPlan(exercise,group,scene,options);
 const design=options.designIndex!==undefined&&typeof bibleExerciseDesign==='function'?bibleExerciseDesign(exercise,options.designIndex):null;
 if(design&&typeof bibleVariantDemonstration==='function'&&bibleVariantDemonstration(design,{exerciseId:exercise.id,group,players:active,blue,red,neutrals,keepers,point,current,move,advance,add,pass,carry,feet,intercept,loose,control,rondoSupport,owner:()=>ballOwner,goalPoint,
  shot:(p,title,moves=[])=>{gamePhase='shot';add(title,design.rule,1.5,moves,goalPoint());Object.assign(steps.at(-1),{action:'shot',from:p.number});},
  recover:(p,title,caption,moves=[])=>{const from=ballOwner;add(title,caption,1.8,moves,()=>feet(p));Object.assign(steps.at(-1),{action:'recovery',from,to:p.number});ballOwner=p.number;possessionTeam=p.team;gamePhase='transition';}
 })){add('Relire la décision',design.rule,1);return result();}
 add('Observer le départ','Repérez le porteur, ses partenaires et les adversaires.',.9);
 if(mechanism.type==='overlap'&&a&&b&&red[0]){
  const inside=demonstrationIndex===1;
  carry(a,point(.48,.32),'1 · Fixer avant l’appel','Le porteur attire le premier défenseur ; le partenaire attend que celui-ci s’engage.',1.8,[move(red[0],point(.63,.36))]);
  add(inside?'2 · Appel intérieur':'2 · Dédoublement extérieur',inside?'Exemple : le couloir intérieur est libre. Le soutien passe à l’intérieur sans fermer le porteur.':'Exemple : le couloir extérieur est libre. Le soutien dépasse le porteur au bon moment.',2.2,[move(b,point(.5,inside?.5:.2))]);settle();
  pass(a,b,'3 · Servir l’avantage','La transmission suit la course si la ligne est libre ; sinon le porteur conserve une solution de retour.',1.8,[move(b,point(.7,inside?.58:.13),{start:.12}),advance(red[0],.02,inside?.04:-.03)]);
  carry(b,point(.86,inside?.58:.17),'4 · Exploiter l’espace','Le receveur progresse vers la cible. Après récupération, les défenseurs attaquent la porte opposée.',1.8);
 }else if(mechanism.type==='progress'&&a&&b){
  if(demonstrationIndex===2){
   carry(a,point(.45,.43),'1 · Avancer si la passe est fermée','Le porteur conduit dans un intervalle ouvert pour attirer un adversaire.',2,[advance(red[0],.06,.07)]);
   pass(a,b,'2 · Libérer après fixation','Le partenaire reçoit au-delà de la première ligne et prépare une action vers l’avant.',2);
  }else{
   add('1 · Voir au-delà de la ligne','Le receveur regarde derrière lui et reste accessible entre les défenseurs.',1.2,[advance(b,.025,-.025)]);
   pass(a,b,'2 · Traverser le premier rideau','Une passe est possible entre les défenseurs ; aucun passage obligatoire par tous les tiers.',2);
  }
  if(c)carry(b,point(.62,.32),'3 · Préparer la passe suivante','Après le franchissement, le receveur ajuste son contrôle pour éviter la couverture et retrouver un partenaire visible.',1.6);
  if(c)pass(b,c,'4 · Continuer la progression','L’action suivante valorise la réception : trouver le partenaire avancé, plutôt qu’un joueur enfermé.',2,[advance(c,.015,.025)]);
 }else if(mechanism.type==='pivot'&&a&&b&&neutrals[0]){
  const pivot=neutrals[0];
  if(demonstrationIndex===2){
   add('1 · Reconnaître l’axe fermé','Le défenseur se rapproche du pivot ; le passeur évite de forcer cette connexion.',1.8,[move(red[0],point(.54,.38))]);
   pass(a,b,'2 · Contourner le pivot marqué','La disponibilité du pivot peut libérer une autre solution. Le jeu ne doit pas obligatoirement passer par lui.',2);
  }else{
   add('1 · Préparer le pivot','Le pivot prend une information dans son dos. Le passeur prépare déjà une solution de remise.',1.3);
   pass(a,pivot,'2 · Connecter si accessible','La passe au pivot est jouée seulement si celui-ci peut conserver une action utile.',1.8,[advance(a,.06,.05),advance(red[0],-.015,.015)]);
   pass(pivot,a,'3 · Remettre face au jeu','Exemple avec pression dans le dos : le pivot remet au soutien qui s’est replacé.',1.8);
   pass(a,b,'4 · Trouver le partenaire libre','La remise permet une passe vers l’avant ; se retourner reste possible si la pression le permet.',2);
  }
 }else if(exercise.id==='duel-renforts'&&a&&b&&red.length>=2){
  carry(a,point(.43,.4),'1 · Bleu attaque : 1 contre 1','Sens de jeu : les bleus attaquent le grand but. Le rouge ralentit et ferme l’axe. Les autres attendent le signal.',2.5,[move(red[0],point(.6,.44))]);
  gameFormat='2 contre 1';
  add('2 · Renfort bleu : 2 contre 1','Un deuxième bleu entre au signal et offre une solution écartée. Le rouge reste entre ballon et grand but.',2.5,[move(b,point(.55,.74))]);settle();
  pass(a,b,'3 · Exploiter le 2 contre 1','Exemple : le rouge ferme le porteur, qui sert le partenaire libre. Les deux bleus progressent vers le grand but.',2,[move(red[0],point(.61,.38)),move(a,point(.59,.28))]);
  gameFormat='2 contre 2';
  add('4 · Renfort rouge : 2 contre 2','Un deuxième rouge entre. Il prend le porteur ; le premier couvre l’axe. Le gardien protège toujours le grand but.',2.5,[move(red[1],point(.73,.68)),move(red[0],point(.65,.43))]);settle();
  if(Number(options.sequenceIndex)>=2){
   carry(b,point(.66,.76),'5 · Fermer la passe intérieure','Le rouge proche ralentit le porteur. Son partenaire se prépare à couper la passe de retour : les bleus ne doivent pas forcer cette ligne.',2,[move(red[1],point(.78,.74)),move(red[0],point(.64,.48))]);
   gamePhase='interception';
   const intendedTo=feet(a),intercept={x:ball.x+(intendedTo.x-ball.x)*.58+scene.playerRadius+6,y:ball.y+(intendedTo.y-ball.y)*.58-8};
   add('6 · Le rouge intercepte','Exemple de perte : la passe intérieure est jouée dans une ligne fermée. Le rouge coupe la trajectoire et prend le contrôle.',1.8,[move(red[0],intercept)],()=>feet(red[0]));
   Object.assign(steps[steps.length-1],{action:'recovery',from:b.number,to:red[0].number,intendedTo});ballOwner=red[0].number;possessionTeam='red';gamePhase='transition';settle();
   carry(red[0],point(.5,.25),'7 · Changement de sens : rouges en attaque','Les rouges visent maintenant un mini-but latéral. Les bleus deviennent défenseurs et tentent de fermer l’accès ; aucun ballon nouveau n’est ajouté.',2.5,[move(a,point(.63,.28)),move(b,point(.65,.51)),move(red[1],point(.53,.7))]);
   const mini=scene.goals.find(g=>g.side==='top'&&g.type==='mini'),target=point((mini?.long??group.length*.52)/group.length,0);
   gamePhase='shot';add('8 · Finir dans le mini-but libre','Le rouge utilise la cible latérale libre. Si le ballon sort ou entre dans le mini-but, la vague s’arrête.',1.4,[],target);Object.assign(steps[steps.length-1],{action:'shot',from:red[0].number,target:'red-mini-top'});settle();
  }else{
   carry(b,point(.72,.79),'5 · Fixer le deuxième défenseur','Le porteur reste tourné vers le grand but. Son partenaire offre une solution intérieure et les rouges protègent l’axe.',2,[move(red[1],point(.8,.67)),move(a,point(.68,.27)),move(red[0],point(.73,.44))]);
   pass(b,a,'6 · Trouver un angle de frappe','La passe rejoint le bleu qui arrive face au but. La défense reste active ; si la ligne était fermée, il faudrait conserver.',2,[move(red[0],point(.8,.39))]);
   const corner=.5+Math.min(.12,7.32/group.width*.32);
   gamePhase='shot';add('7 · Tir bleu vers le grand but','Exemple de finition dans le côté libre du grand but. Le gardien protège sa cible ; dans le jeu réel, il peut arrêter ou repousser.',1.6,[],point(1,corner));Object.assign(steps[steps.length-1],{action:'shot',from:a.number,target:'blue-main-goal'});settle();
  }
  gamePhase='end';
  add('Fin de vague · rotation','But, sortie ou limite de temps : arrêt du jeu. Les quatre joueurs sortent sur le côté ; les suivants prennent leur place. Alterner l’équipe qui attaque le grand but entre les séries.',1.5);
 }else if(exercise.id==='wall-pass'&&a&&b){
  pass(a,b,'1 · Donner à l’appui','Le porteur trouve l’appui avec une passe dosée.');
  add('2 · Continuer sa course','Le passeur avance après sa passe ; l’appui le regarde avant de remettre.',1.8,[advance(a,.07,-.025)]);
  pass(b,a,'3 · Remettre dans la course','L’appui remet devant le joueur lancé pour conserver la continuité.',1.8,[advance(a,.035,.025)]);
  if(c)pass(a,c,'4 · Relier au poste suivant','La combinaison se termine par une passe au troisième poste, puis les fonctions tournent.');
 }else if(['back','turn'].includes(mechanism.type)&&a&&(b||neutrals[0])){
  const receiver=b||neutrals[0];
  add('1 · Regarder avant de recevoir','Le receveur repère la pression derrière lui et garde le soutien visible.',1.2);
  pass(a,receiver,'2 · Recevoir en protégeant','Le défenseur reste derrière le receveur ; celui-ci ne se retourne pas par obligation.',1.8,Number(options.sequenceIndex)>0?[advance(red[0],-.025,0)]:[]);
  if(mechanism.type==='back'||Number(options.sequenceIndex)===2){
   add('3 · Ouvrir le soutien','Le passeur se décale pour recevoir hors de la pression, plutôt que rester sur la même ligne.',1.4,[advance(a,.025,-.12)]);
   pass(receiver,a,'4 · Remettre puis accompagner','La remise conserve le ballon et remet un partenaire face au jeu ; le receveur accompagne.',1.8,[advance(receiver,.035,.08)]);
  }else carry(receiver,point(.7,.27),'3 · Orienter côté libre','Le premier contact éloigne le ballon du défenseur ; si ce côté était fermé, le soutien resterait une solution.',1.8,[advance(red[0],.04,-.025)]);
 }else if(mechanism.type==='split'&&a&&b){
  add('1 · Repérer la fenêtre','Le passeur identifie le partenaire de l’autre côté de la pression ; la passe ne doit pas traverser un défenseur.',1.2);
  pass(a,b,'2 · Franchir la pression','Dans cet exemple, l’intervalle est ouvert : le ballon passe dans cette fenêtre vers un soutien visible.',2,[advance(red[0],.015,-.025),advance(red[1],-.015,.025)]);
  add('3 · Redonner un angle','Le passeur redevient disponible ; conserver autour reste possible si la fenêtre se ferme.',1.5,[advance(a,0,.1)]);
 }else if(mechanism.type==='delay'&&a&&red[0]){
  carry(a,point(.45,.29),'1 · Lire le surnombre','L’attaque avance avec une solution de passe ; la défense garde l’axe et la profondeur.',1.8,[move(red[0],point(.6,.36)),advance(b,.06,0)]);
  carry(a,point(.53,.23),'2 · Temporiser sans se jeter','Le premier défenseur reste entre ballon et cible ; son partenaire, s’il est présent, couvre à l’intérieur.',1.8,[move(red[0],point(.68,.31)),red[1]?move(red[1],point(.78,.54)):null]);
  add('3 · Garder la couverture','Le porteur est ralenti ; gagner du temps ne signifie pas récupérer à chaque action.',1.2);
 }else if(mechanism.type==='trap'&&a&&red[0]){
  add('1 · Fermer la passe intérieure','Le premier défenseur approche depuis l’intérieur pour orienter le porteur vers le côté.',1.8,[move(red[0],point(.43,.22)),red[1]?move(red[1],point(.59,.31)):null]);
  if(b)pass(a,b,'2 · Jouer vers le côté','La passe latérale déclenche la sortie ; le partenaire défensif reste en couverture.',1.8,[move(red[0],point(.61,.24)),red[1]?move(red[1],point(.72,.33)):null]);
  if(c)pass(b||a,a,'3 · Réagir si la relance ressort','Si l’adversaire trouve le soutien, le bloc coulisse ; les défenseurs ne poursuivent pas tous le même joueur.',2,[move(red[0],point(.68,.19)),move(red[1],point(.69,.44))]);
 }else if(mechanism.type==='isolate'&&a&&b){
  pass(a,b,'1 · Servir le joueur large','Le receveur dispose d’un espace sur le côté ; le passeur propose une sécurité à l’intérieur.',1.8,[move(a,point(.44,.34))]);
  if(demonstrationIndex===2){
   add('2 · Reconnaître la fermeture','La défense réduit l’espace ; le soutien reste disponible.',1.6,[move(red[0],point(.65,.23)),red[1]?move(red[1],point(.73,.35)):null]);
   pass(b,a,'3 · Ressortir plutôt que forcer','Le porteur réutilise son soutien ; le duel n’est pas une obligation quand l’espace se ferme.');
  }else carry(b,point(.78,.14),'2 · Exploiter le côté favorable','Le couloir reste accessible ; le soutien accompagne sans prendre le même espace.',1.8,[advance(red[0],.07,-.025)]);
 }else if(mechanism.type==='combine'&&a&&b){
  pass(a,b,'1 · Trouver l’appui','L’appui attire l’attention de la défense ; le passeur poursuit son déplacement.',1.8,[advance(a,.06,-.04)]);
  pass(b,a,'2 · Remettre face au but','La remise rejoint le partenaire lancé ; on ne l’impose pas si la frappe directe est déjà ouverte.',1.8,[advance(a,.06,.025),advance(red[0],.025,.035)]);
  gamePhase='shot';add('3 · Finir après avoir créé l’angle','Exemple de frappe après la remise : le gardien peut arrêter ou repousser ; le résultat n’est pas garanti.',1.5,[],goalPoint());Object.assign(steps.at(-1),{action:'shot',from:a.number});
 }else if(mechanism.type==='rebound'&&a){
  const shooter=blue.slice().sort((p,q)=>q.x-p.x)[0],support=blue.find(p=>p!==shooter);
  if(support)add('1 · Préparer le second ballon','Un soutien reste derrière le finisseur, avec un angle différent ; tous ne partent pas vers le but.',1.8,[move(support,point(.58,.65))]);
  possession(shooter);gamePhase='shot';add('2 · Frapper vers la cible','Le tireur termine ; cet exemple illustre un ballon repoussé, pas un but automatique.',1.3,[],goalPoint());Object.assign(steps.at(-1),{action:'shot',from:shooter.number});
  gamePhase='loose';add('3 · Lire le ballon repoussé','La trajectoire ressort devant le but ; les partenaires réagissent après avoir lu la déviation.',1.3,[],point(.7,.6));Object.assign(steps.at(-1),{action:'clearance'});
  if(support){gamePhase='play';add('4 · Maîtriser la seconde action','Le soutien rejoint le ballon repoussé ; il contrôle avant de décider de rejouer ou de finir.',1.6,[move(support,point(.7,.6))],()=>feet(support));ballOwner=support.number;Object.assign(steps.at(-1),{action:'control',to:support.number,owner:support.number});}
 }else if(mechanism.type==='third'&&a&&relay&&third){
  pass(a,relay,'1 · Trouver l’appui','Le premier porteur joue sur un partenaire disponible entre les lignes.',1.8,[move(red[0],point(.58,.32))]);
  pass(relay,a,'2 · Remettre et déclencher','La remise remet le jeu face à la cible ; le troisième joueur déclenche son appel.',1.6,[move(third,point(.68,.66)),move(red[0],point(.58,.38))]);
  pass(a,third,'3 · Trouver le troisième joueur','La passe suivante exploite l’angle ouvert par l’appui-remise.',2,[move(third,point(.82,.57),{start:.1}),move(red[0],point(.59,.4))]);
 }else if(mechanism.type==='support'&&a&&b){
  add('1 · Sortir de l’ombre','Le receveur change d’angle avant la passe ; le défenseur ajuste sa position.',1.8,[move(b,point(.62,.16)),advance(nearRed,.025,-.06)]);
  pass(a,b,'2 · Recevoir face au jeu','Le porteur peut maintenant trouver le partenaire en dehors de la ligne du défenseur.');
  if(c)pass(b,c,'3 · Enchaîner','Le contrôle prépare la passe suivante ; un partenaire accompagne.',1.8,[advance(a,.1,-.04)]);
 }else if(mechanism.type==='switch'&&a&&b){
  const far=blue[blue.length-1],middle=blue.length>2?b:a;
  carry(a,point(.35,.18),'1 · Attirer sur un côté','Le porteur fixe un adversaire pour ouvrir le côté opposé.',1.6,[advance(nearRed,-.035,-.08)]);
  if(middle!==a)pass(a,middle,'2 · Trouver le relais','Le soutien joue avec une orientation qui permet de changer de côté.');
  pass(middle,far,'3 · Renverser','La transmission atteint le joueur éloigné avant le déplacement du bloc.',2.2,[advance(red[1],.03,.12)]);
 }else if(mechanism.type==='cover'&&a&&red.length){
  carry(a,point(.37,.29),'1 · Provoquer la sortie','Le porteur avance ; le défenseur proche se prépare à ralentir.',1.5);
  add('2 · Presser et couvrir','Le premier défenseur ferme le porteur ; le deuxième protège l’espace derrière lui.',2,[move(red[0],point(.46,.29)),move(red[1],point(.61,.43)),move(red[2],point(.7,.69))]);
  if(b)pass(a,b,'3 · Réagir à la passe','La pression et la couverture se réorganisent à la nouvelle position du ballon.',1.8,[move(b,point(.62,.12),{start:.08}),advance(red[0],.02,.1),advance(red[1],-.025,.07)]);
 }else if(mechanism.type==='block'&&a&&red.length){
  const receiver=blue.slice().sort((p,q)=>q.y-p.y)[0];
  if(receiver!==a)pass(a,receiver,'1 · Déplacer le ballon','La passe vers le côté déclenche le déplacement collectif.');
  else carry(a,point(.34,.62),'1 · Déplacer le ballon','Le porteur change de couloir pour déplacer le bloc.');
  add('2 · Coulisser ensemble','Les défenseurs se déplacent ensemble en conservant leurs écarts et la protection de l’axe.',2,red.map(p=>advance(p,-.04,.13)));
  add('3 · Stabiliser le bloc','Le plus proche peut sortir ; ses partenaires restent en couverture.',1.4,[advance(red[0],-.035,-.025)]);
 }else if(mechanism.type==='loss'&&red[0]&&a&&b){
  intercept(a,b,red[0],'1 · La passe est interceptée','Exemple d’une passe fermée : le rouge coupe sa trajectoire. À la maîtrise du ballon, les bleus deviennent défenseurs ; la récupération immédiate n’est pas garantie.');
  carry(red[0],point(.42,.38),'2 · Réagir pendant la sortie adverse','Dans ce jeu de conservation sans but imposé, le rouge cherche à sortir de la densité. Le bleu proche ralentit le porteur ; un partenaire ferme l’intérieur et un autre protège derrière. Ne pas attendre la fin de la conduite pour réagir.',1.8,[move(a,point(.32,.5)),move(b,point(.23,.62)),c?move(c,point(.62,.35)):null,red[1]?move(red[1],point(.68,.78)):null]);
  add('3 · Choisir : presser ou protéger','Le proche cadre sans se jeter. Ici, le rouge garde un appui visible ; les autres bleus restent reliés au lieu de tous poursuivre le ballon.',1.3);
  if(red[1])pass(red[0],red[1],'4 · La sortie oblige à se réorganiser','Exemple d’une sortie réussie : les bleus se reconnectent et ferment les relais intérieurs. Ne pas annoncer une récupération automatique.',1.8,[move(a,point(.3,.56)),move(b,point(.17,.54)),c?move(c,point(.55,.44)):null]);
 }else if(exercise.id==='counter-wide'&&a&&b){
  carry(a,point(.46,.46),'1 · Fixer dans l’axe','Le porteur avance ; un partenaire ouvre le couloir tandis qu’un autre accompagne à une hauteur différente.',2,[move(b,point(.58,.1)),move(red[0],point(.58,.52)),c?move(c,point(.68,.81)):null]);
  pass(a,b,'2 · Servir l’appel large','La passe rejoint le coureur dans le couloir libre, pendant sa course.',2,[move(b,point(.74,.12),{start:.1}),move(red[0],point(.61,.49))]);
  carry(b,point(.86,.15),'3 · Accompagner sans s’aligner','Le porteur conserve son couloir ; les soutiens échelonnent leurs arrivées plutôt que demander une diagonale forcée.',2,[move(a,point(.72,.44)),c?move(c,point(.78,.8)):null]);
 }else if(exercise.id==='secure-regain'&&a&&neutrals[0]){
  add('1 · Comparer progression et sécurité','La sortie vers l’avant est surveillée : le nouveau porteur voit aussi un appui décalé, sans obligation de se projeter.',1.4,[move(red[0],point(.55,.23))]);
  pass(a,neutrals[0],'2 · Sécuriser avec un appui visible','Une passe courte maîtrisée éloigne le ballon du premier duel ; l’appui joue avec l’équipe en possession.',1.8);
  pass(neutrals[0],a,'3 · Retrouver un nouvel angle','Le soutien ressort de la densité pendant la passe. La progression sera réévaluée après cette réception.',1.8,[move(a,point(.27,.22),{start:.1})]);
 }else if(mechanism.type==='regain'&&a&&b){
  add('1 · Voir les solutions à la récupération','Le nouveau porteur lève la tête ; ses partenaires s’écartent et se projettent.',1.6,[advance(b,.04,-.04),advance(c,.11,.015),advance(nearRed,-.045,.03)]);
  pass(a,b,'2 · Première passe utile','Sécuriser ou progresser selon la pression et les solutions disponibles.');
  if(c)pass(b,c,'3 · Accompagner la transition','Le soutien et la course en profondeur donnent une suite à la récupération.',2,[advance(a,.12,.02)]);
 }else if(mechanism.type==='balance'&&a&&b){
  carry(a,point(.75,.23),'1 · Accompagner l’attaque','Le porteur progresse ; tous les partenaires ne doivent pas partir devant le ballon.',1.8);
  add('2 · Garder une sécurité derrière','Les soutiens se rapprochent de l’axe et se placent pour défendre une éventuelle perte.',2,[move(b,point(.41,.44)),move(c,point(.39,.62)),advance(nearRed,.05,-.04)]);
  if(blue[3])pass(a,blue[3],'3 · Conserver l’équilibre','La circulation reste sur le côté libre ; les deux joueurs de sécurité protègent toujours l’axe derrière le ballon.',1.8,[move(blue[3],point(.57,.12),{start:.08})]);
 }else if(mechanism.type==='retreat'&&red[0]&&a){
  carry(red[0],point(.51,.35),'1 · L’adversaire avance','La priorité est de ralentir sans ouvrir un accès direct à la profondeur.',1.8,[move(a,point(.36,.35))]);
  carry(red[0],point(.43,.4),'2 · Reculer en couvrant','Le premier défenseur temporise ; le partenaire protège l’espace derrière.',2,[move(a,point(.29,.39)),move(b,point(.19,.58))]);
  add('3 · Retrouver une organisation','Les distances se resserrent pour permettre une nouvelle intervention collective.',1.4,[advance(a,-.025,.02),advance(b,-.035,-.035)]);
 }else if(mechanism.type==='underlap'&&a&&b){
  carry(a,point(.64,.12),'1 · Fixer à l’extérieur','Le porteur attire le défenseur dans le couloir.',1.6,[advance(red[0],-.015,-.02)]);
  add('2 · Courir à l’intérieur','Le soutien passe dans le dos et à l’intérieur du porteur, sans partir trop tôt.',1.9,[move(b,point(.58,.34))]);
  pass(a,b,'3 · Servir dans le tempo','La passe rejoint la course dès que l’espace intérieur devient accessible.',2,[move(b,point(.8,.34),{start:.1})]);
 }else if(['behind','depth'].includes(mechanism.type)&&a&&b){
  add('1 · Déclencher l’appel','L’appel commence quand le porteur peut jouer vers l’avant.',1.8,[move(b,point(.65,.72)),mechanism.type==='depth'?move(red[0],point(.81,.55)):advance(red[0],.04,.015)]);
  pass(a,b,'2 · Jouer dans la profondeur','Le passeur dose la transmission ; le défenseur ajuste sa hauteur et suit la course.',2,[move(b,point(.87,.7),{start:.08}),mechanism.type==='depth'?advance(red[0],.035,.06):null]);
 }else if(mechanism.type==='throw'&&a&&b){
  add('1 · Se rendre disponible','Le receveur crée un angle de passe à l’intérieur du terrain.',1.6,[advance(b,-.035,.05),advance(red[0],-.025,.02)]);
  pass(a,b,'2 · Remettre en jeu','La remise trouve le partenaire disponible depuis la ligne de touche.');
  if(c)pass(b,c,'3 · Trouver le soutien','La première réception est reliée à un soutien pour poursuivre la progression.',1.8,[advance(a,.07,.1)]);
 }else if(mechanism.type==='keeperpass'&&keepers[0]){
  const goalkeeper=keepers[0],supports=friends(goalkeeper),direction=goalkeeper.x<field.fx+field.fw/2?1:-1;
  add('1 · Ouvrir deux solutions','Les partenaires du gardien donnent de la largeur et des angles de passe.',1.6,[advance(supports[0],direction*.025,-.045),advance(supports[1],direction*.025,.045)]);
  if(supports[0])pass(goalkeeper,supports[0],'2 · Distribuer à un partenaire','Le gardien choisit une solution de son équipe ou un appui neutre disponible.',2,[advance(goalkeeper,direction*.018,0)]);
  if(supports[0]&&supports[1])pass(supports[0],supports[1],'3 · Relier les partenaires','La circulation change l’angle de jeu ; le gardien reste disponible en soutien.');
 }else if(exercise.id==='keeper-duel'&&a&&keepers.some(k=>!k.fieldKeeper)){
  const attacker=blue.slice().sort((p,q)=>q.x-p.x)[0]||a,keeper=keepers.find(k=>!k.fieldKeeper);
  carry(attacker,point(.74,.43),'1 · Approcher en gardant le ballon','Le porteur approche ; le gardien avance sur l’axe ballon–but en restant équilibré.',1.8,[move(keeper,point(.87,.47))]);
  carry(attacker,point(.81,.4),'2 · Réduire l’angle sans se jeter','Le gardien freine et se fixe quand l’attaquant prépare son dernier contact.',1.5,[move(keeper,point(.86,.44))]);
  gamePhase='shot';add('3 · Intervenir sur la frappe','Exemple d’un tir arrêté : le gardien rejoint la trajectoire. Ce n’est pas une réussite imposée dans le jeu réel.',1,[move(keeper,point(.88,.42))],()=>feet(keeper));Object.assign(steps.at(-1),{action:'shot',from:attacker.number,to:keeper.number});
  ballOwner=keeper.number;possessionTeam=keeper.team;gamePhase='secured';add('4 · Maîtriser le ballon','L’arrêt est illustré ici par une prise de balle. Dans le jeu réel, un ballon repoussé reste à disputer.',.8);Object.assign(steps.at(-1),{action:'control',to:keeper.number,owner:keeper.number});
  add('5 · Sécuriser avant de repartir','Le gardien conserve le ballon ; arrêter la vague avant de faire entrer le joueur suivant.',1);
 }else if(exercise.id==='press-goalkick'&&keepers.some(k=>k.team==='blue')&&a&&red.length){
  const keeper=keepers.find(k=>k.team==='blue'),receiver=blue.find(p=>!p.keeper),other=blue.find(p=>p!==receiver&&!p.keeper);
  if(receiver){pass(keeper,receiver,'1 · Départ depuis le gardien','La relance déclenche la sortie du presseur ; les autres protègent les solutions intérieures.',1.5,[advance(receiver,.025,-.035),move(red[0],point(.43,.28)),advance(red[1],-.03,-.02)]);
   add('2 · Presser sans ouvrir l’axe','Le premier ferme le porteur depuis l’intérieur ; les autres gardent les distances de couverture.',1.8,[move(red[0],{x:current(receiver).x+field.fw*.08,y:current(receiver).y+field.fh*.025}),advance(red[1],-.04,-.025)]);
   if(other)pass(receiver,other,'3 · Lire la solution de sortie','Exemple d’une sortie trouvée ; la défense coulisse au nouveau ballon au lieu de continuer sur l’ancien porteur.',1.2,[advance(red[0],.02,.07),advance(red[1],-.02,.06)]);
  }
 }else if(exercise.id==='cpa-defence'&&a&&b&&red.length){
  const receiver=blue.slice(1).sort((p,q)=>q.x-p.x)[0],defender=red[0],target=point(.83,.5);
  add('1 · Voir ballon et adversaire','Les défenseurs protègent l’intérieur et suivent la course sans perdre le ballon de vue.',1.6,[move(receiver,point(.85,.51)),move(defender,point(.88,.5)),advance(red[1],-.015,.035)]);
  add('2 · Attaquer le ballon du corner','Exemple d’un défenseur qui gagne le premier contact : le centre arrive dans sa zone d’intervention.',1.5,[move(defender,target)],()=>feet(defender));Object.assign(steps.at(-1),{action:'recovery',from:a.number,to:defender.number});ballOwner=defender.number;possessionTeam='red';
  gamePhase='transition';add('3 · Dégager hors de l’axe','Le dégagement vise le côté, à distance de la zone devant le but ; les partenaires accompagnent la sortie.',1.3,[advance(red[1],-.05,-.04),advance(blue[2],-.04,.025)],point(.46,.15));Object.assign(steps.at(-1),{action:'clearance',from:defender.number});
  add('4 · Remonter après le dégagement','Le bloc sort ensemble puis se replace selon le second ballon, sans abandonner la couverture.',1.8,red.map(p=>advance(p,-.055,-.025)));
 }else if(template==='corner'&&a&&b){
  const receiver=blue.slice(1).sort((p,q)=>q.x-p.x)[0];
  add('1 · Coordonner les courses','Le tireur observe les déplacements ; les attaquants et défenseurs ajustent leurs courses.',1.8,[move(receiver,point(.84,.27)),advance(red[0],-.02,.035),advance(blue[2],.04,-.04)]);
  pass(a,receiver,'2 · Jouer le corner · centre aérien','Le centre passe en hauteur ; les attaquants et défenseurs disputent la retombée. La démonstration illustre une réception possible, pas un ballon gagné d’avance.',2.2,[advance(red[0],.015,-.015)],{loft:3.2});
  if(exercise.id==='corner-secondball'&&red[0]){
   add('3 · Lire le ballon dégagé','Le défenseur repousse le ballon hors de la première zone ; les joueurs de sécurité se préparent à la seconde action.',1.2,[advance(red[0],-.025,0)],point(.58,.62));
   const support=blue.find(p=>p!==a&&p!==receiver)||a;
   add('4 · Contrôler le second ballon','Le soutien rejoint la retombée ; un partenaire reste derrière lui pour préparer une éventuelle perte.',1.6,[move(support,point(.58,.62)),move(a,point(.44,.38))],()=>feet(support));Object.assign(steps.at(-1),{action:'control',to:support.number});ballOwner=support.number;
   pass(support,receiver,'5 · Relancer une seconde attaque','Après maîtrise, retrouver un partenaire disponible ; ne pas rejouer immédiatement dans la densité.',1.4,[move(receiver,point(.76,.33))]);
  }else{gamePhase='shot';add('3 · Terminer l’action','Le receveur oriente sa reprise vers la cible ; les partenaires suivent le second ballon.',1.4,[],goalPoint());Object.assign(steps.at(-1),{action:'shot',from:receiver.number});}
 }else if(template==='wide-finish'&&a&&b){
  const receiver=mechanism.type==='farpost'?b:blue.slice(1).sort((p,q)=>q.x-p.x)[0];
  const retreat=mechanism.type==='cutback',target=retreat?point(.73,.46):mechanism.type==='farpost'?point(.9,.69):point(.84,.49);
  carry(a,point(.94,.14),'1 · Préparer le centre','Le joueur de côté avance ; les receveurs coordonnent leur arrivée.',1.9,[move(receiver,{x:target.x-field.fw*.16,y:target.y+field.fh*.04}),advance(red[0],.025,.015)]);
  pass(a,receiver,retreat?'2 · Trouver le retrait':mechanism.type==='farpost'?'2 · Trouver le second poteau':'2 · Attaquer le centre',retreat?'Le ballon revient derrière la première ligne défensive.':'La passe est synchronisée avec l’arrivée du receveur.',2,[move(receiver,target,{start:.12}),mechanism.type==='defendcross'?advance(red[0],.025,.02):null],{loft:mechanism.type==='farpost'?2.8:0});
  gamePhase='shot';add('3 · Finir ou défendre la surface',mechanism.type==='defendcross'?'Le défenseur accompagne et le gardien ajuste sa position.':'Le receveur termine ; les partenaires suivent une éventuelle remise en jeu.',1.5,[advance(keepers.find(k=>k.team==='red'),0,.025)],goalPoint());Object.assign(steps.at(-1),{action:'shot',from:receiver.number});
 }else if(['finish','keeper'].includes(template)&&a){
  const shooter=blue.slice().sort((p,q)=>q.x-p.x)[0]||a;
  const feeder=blue.find(p=>p!==shooter);if(feeder){pass(shooter,feeder,'1 · Préparer l’appui','Le futur finisseur donne à un partenaire et prépare sa course.',1);pass(feeder,shooter,'2 · Servir le finisseur','La passe rejoint le joueur qui se rend disponible face à la cible.',1,[advance(shooter,.035,-.025)]);}
  carry(shooter,point(Math.min(.83,(shooter.x-field.fx)/field.fw+.08),(shooter.y-field.fy)/field.fh),'3 · Préparer la finition','Le porteur prépare son dernier contact ; le défenseur et le gardien se placent.',1.8,[advance(nearRed,-.025,.025)]);
  gamePhase='shot';add('4 · Frapper vers la cible','Le tireur choisit sa zone ; le gardien se prépare puis accompagne la trajectoire.',1.3,[advance(keepers.find(k=>k.team!=='blue'),0,.035)],goalPoint());Object.assign(steps.at(-1),{action:'shot',from:shooter.number});
  add('5 · Suivre le ballon','Les joueurs restent disponibles pour un ballon repoussé ; reprendre au départ pour une nouvelle action.',1.2,[advance(b,.04,.015)]);
 }else if(template==='build'&&keepers[0]){
  const goalkeeper=keepers[0],supports=friends(goalkeeper),direction=goalkeeper.x<field.fx+field.fw/2?1:-1;
  if(supports[0])pass(goalkeeper,supports[0],'1 · Première relance','Un partenaire ouvre un angle de sortie face à la pression.',1.9,[advance(supports[0],direction*.025,-.03)]);
  if(supports[1])pass(supports[0],supports[1],'2 · Trouver la solution suivante','Le relais joue avant que la pression ne ferme la passe.',2,[advance(red.find(p=>p.team!==goalkeeper.team),-.03,.02)]);
 }else if(template==='press'&&a&&red.length){
  const receiver=b||a;
  if(b)pass(a,b,'1 · Déclencher sur la passe','Le déplacement du ballon donne un signal de pression aux défenseurs.');
  const near=red.slice().sort((p,q)=>Math.hypot(p.x-current(receiver).x,p.y-current(receiver).y)-Math.hypot(q.x-current(receiver).x,q.y-current(receiver).y))[0],at=current(receiver);
  add('2 · Presser avec couverture','Le plus proche ferme le porteur ; les autres réduisent les solutions autour.',2,[move(near,{x:at.x+field.fw*.065,y:at.y+field.fh*.025}),...red.filter(p=>p!==near).map(p=>advance(p,-.035,.025))]);
  if(c)pass(receiver,c,'3 · Ajuster au nouveau ballon','Le relais se rend disponible dans un autre couloir ; la couverture réagit au déplacement du ballon.',2,[move(c,point(.67,.15),{start:.1}),advance(red[1],.03,-.02)]);
 }else if(template==='duel'&&a){
  carry(a,point(.46,.38),'1 · Fixer le défenseur','Le porteur approche pour provoquer une décision du défenseur.',1.8,[move(nearRed,point(.57,.42))]);
  if(b)pass(a,b,'2 · Choisir entre passe et conduite','Le partenaire propose une solution ; le défenseur adapte son intervention.',1.8,[advance(nearRed,.015,.07)]);
  else carry(a,point(.72,.25),'2 · Changer de rythme','Le porteur exploite l’espace latéral ; le défenseur accompagne la course.',2,[move(nearRed,point(.65,.34))]);
 }else if(template==='circuit'&&exercise.id==='warm'&&a){
  const others=active.filter(p=>p!==a);
  carry(a,point(.62,.26),'1 · Conduire et regarder','Chacun conduit son ballon à faible intensité et prend des informations autour de lui.',2.2,others.map((p,i)=>advance(p,i%2?.025:-.025,i%2?-.045:.045)));
  carry(a,point(.66,.43),'2 · Changer de direction','Au signal, les joueurs changent de direction en gardant la maîtrise de leur ballon.',2,others.map((p,i)=>advance(p,i%2?-.035:.035,i%2?.04:-.04)));
  carry(a,point(.56,.5),'3 · Ajuster le rythme','L’activation reste progressive ; chaque joueur conserve son propre ballon.',1.8,others.map((p,i)=>advance(p,i%2?.025:-.025,i%2?-.025:.025)));
 }else if(template==='circuit'&&a){
  if(b)pass(a,b,exercise.id==='cool'?'Échanger à faible intensité':'1 · Passer dans le bon tempo',exercise.id==='cool'?'Le ballon circule doucement pendant le retour au calme.':'Le receveur ouvre son corps avant le contrôle.',2);
  if(exercise.id!=='cool')add('2 · Se déplacer après la passe','Le passeur libère sa position et propose un nouvel angle.',1.8,[advance(a,.07,.08),advance(b,-.035,-.03)]);
  if(b&&c)pass(b,c,'3 · Enchaîner vers un autre partenaire','La qualité du contrôle prépare la transmission suivante.',2);
 }else if(template==='rondo'&&a&&b){
  let carrier=a;const perimeter=blue.slice().sort((p,q)=>Math.atan2(p.y-field.fy-field.fh/2,p.x-field.fx-field.fw/2)-Math.atan2(q.y-field.fy-field.fh/2,q.x-field.fx-field.fw/2));
  for(let i=0;i<Math.min(6,perimeter.length+2);i++){
   const next=perimeter[(perimeter.indexOf(carrier)+1)%perimeter.length];if(next===carrier)continue;
   const at=current(carrier),pressers=red.slice().sort((p,q)=>Math.hypot(current(p).x-at.x,current(p).y-at.y)-Math.hypot(current(q).x-at.x,current(q).y-at.y));
   pass(carrier,next,(i+1)+' · Jouer hors de la pression','Le ballon circule sur le pourtour ; le défenseur proche presse pendant que son partenaire protège la passe intérieure.',.9,[rondoSupport(carrier),move(pressers[0],{x:at.x+(field.fx+field.fw/2-at.x)*.55,y:at.y+(field.fy+field.fh/2-at.y)*.55}),pressers[1]?move(pressers[1],point(.5+(i%2?.07:-.07),.5)):null]);carrier=next;
  }
 }else if(exercise.id==='freegame'&&a&&b){
  const pressers=red.slice().sort((p,q)=>Math.hypot(current(p).x-current(a).x,current(p).y-current(a).y)-Math.hypot(current(q).x-current(a).x,current(q).y-current(a).y));
  add('1 · Créer une solution hors de la pression','Un partenaire revient dans un couloir différent ; le proche défenseur ferme l’axe. Ce n’est qu’un exemple de décision dans le jeu libre.',1.8,[move(b,point(.36,.13)),move(pressers[0],point(.29,.59)),c?move(c,point(.7,.81)):null]);
  pass(a,b,'2 · Utiliser la largeur disponible','Le receveur voit devant lui et garde un soutien intérieur. Le ballon ne traverse pas le défenseur qui protège l’axe.',1.8,[move(b,point(.42,.12),{start:.08})]);
  carry(b,point(.66,.13),'3 · Avancer si le couloir est libre','Le porteur progresse, ses partenaires s’échelonnent et la défense couvre sa cible ; aucune combinaison n’est obligatoire.',2,[move(a,point(.4,.48)),c?move(c,point(.78,.8)):null,...pressers.slice(0,3).map((p,i)=>move(p,point(i===0?.69:.8,.34+i*.2)))]);
 }else if(a&&b){
  let carrier=a;const first=neutrals[0]||b,next=first===b?c:b;
  pass(carrier,first,'1 · Connecter la liaison',neutrals.length?'L’appui joue avec l’équipe qui possède le ballon ; les soutiens lui offrent deux sorties.':'Le porteur trouve un partenaire disponible ; la défense ajuste sa pression.',1,[advance(nearRed,-.02,-.03),advance(a,.025,.06)]);carrier=first;
  if(next){pass(carrier,next,'2 · Trouver la sortie libre','Le receveur s’oriente pendant que le soutien accompagne sans occuper le même espace.',1,[advance(a,.045,-.035),advance(red[1],-.025,.04)]);carrier=next;}
  if(template==='endzones'){
   // The en-but finish below illustrates the actual scoring condition.
   add('3 · Préparer l’appel vers la cible','Le porteur peut jouer vers l’avant ; son partenaire se prépare à entrer dans l’en-but.',.8,[advance(b,.045,.025)]);
  }else if(scene.goals.length){
   const receiver=blue.filter(p=>p!==carrier).sort((p,q)=>current(q).x-current(p).x)[0];
   if(receiver){pass(carrier,receiver,'3 · Progresser vers la cible','La passe accompagne l’appel ; les défenseurs couvrent leur but plutôt que courir tous sur le ballon.',1,[move(receiver,point(.82,['freekick-restart','build','build-three'].includes(exercise.id)?.12:.62),{start:.08}),advance(nearRed,.04,.025)]);carrier=receiver;}
   gamePhase='shot';add('4 · Atteindre la cible','Exemple d’une attaque menée jusqu’à la cible. Une récupération inverserait immédiatement les missions.',1,[],goalPoint());Object.assign(steps.at(-1),{action:'shot',from:carrier.number});
  }else{
   pass(carrier,a,'3 · Retrouver le soutien','Le soutien conserve un angle derrière le ballon ; on peut repartir de l’autre côté.',1,[advance(nearRed,-.025,.025)]);
   pass(a,exercise.id==='possession-neutral'?b:first,'4 · Repartir avec un nouvel angle','Exemple de conservation : aucun sens d’attaque n’est imposé, l’objectif reste de garder une solution libre.',1,[advance(exercise.id==='possession-neutral'?b:first,.025,.035),advance(red[1],.025,-.025)]);
  }
 }else if(a){
  carry(a,point(.64,.5),'Conduire et s’orienter','Démonstration technique : avancer avec le ballon en gardant la tête disponible.',2);
 }
 // Dans un jeu à en-buts, montrer une réception dans la cible, pas seulement des passes au milieu.
 if(template==='endzones'&&!scene.goals.length&&blue.length>=2){
  const carrier=players.find(p=>p.number===ballOwner),end=group.zoneDimensions?.at(-1);
  if(carrier?.team==='blue'&&end){
   const alreadyInside=current(carrier).x>=field.fx+end.x*field.scale;
   if(!alreadyInside){
    const receiver=blue.filter(p=>p.number!==carrier.number).sort((p,q)=>current(q).x-current(p).x)[0];
    const target={x:field.fx+(end.x+end.length*.55)*field.scale,y:field.fy+field.fh*.62};
    add('Arriver dans l’en-but','Le receveur entre sur son appel pendant que le porteur peut jouer ; il ne stationne pas dans la cible.',1.8,[move(receiver,{x:field.fx+end.x*field.scale-scene.playerRadius-4,y:target.y})]);
    pass(carrier,receiver,'Recevoir et maîtriser pour marquer','La réception dans l’en-but valide le point ; une course seule ou une passe non maîtrisée ne suffit pas.',2,[move(receiver,target,{start:.08})]);
   }
  }
 }
 add('Observer le résultat','Utilisez les étapes pour expliquer ; « Revenir au départ » prépare la répétition.',1.2);
 return result();
}

function bibleAnimationState(plan,time){
 const clamped=Math.max(0,Math.min(plan.duration,Number(time)||0)),players=plan.initial.players.map(p=>({...p})),byId=new Map(players.map(p=>[p.number,p]));
 const balls=(plan.initial.balls||[{id:'ball',...plan.initial.ball}]).map(b=>({...b})),ballById=new Map(balls.map(b=>[b.id,b]));
 let ball={...plan.initial.ball},current=plan.steps[0]||{index:0,title:'Installation',caption:'Ajustez le groupe et l’espace avant de lancer une démonstration.'};
 for(const step of plan.steps){
  if(clamped<step.start)break;
  current=step;const progress=step.duration?Math.max(0,Math.min(1,(clamped-step.start)/step.duration)):1;
  for(const motion of step.motions){
   const elapsed=Math.max(0,clamped-step.start),delay=motion.delay||0,span=motion.duration||step.duration;
   let t=Math.max(0,Math.min(1,(elapsed-delay)/span)),p;
   if(motion.kind==='ball'&&elapsed<delay){const run=step.motions.find(m=>m.kind==='player'&&m.id===motion.departurePlayer),f=run?Math.max(0,Math.min(1,(elapsed-(run.delay||0))/(run.duration||step.duration))):Math.min(1,elapsed/step.duration);p=run?{x:motion.before.x+(run.to.x-run.from.x)*f,y:motion.before.y+(run.to.y-run.from.y)*f}:{...(motion.before||motion.from)};}
   else if(motion.kind==='ball'&&motion.follow!==undefined){const run=step.motions.find(m=>m.kind==='player'&&m.id===motion.follow);if(run)t=Math.max(0,Math.min(1,(elapsed-(run.delay||0))/(run.duration||step.duration)));p={x:motion.from.x+(motion.to.x-motion.from.x)*t,y:motion.from.y+(motion.to.y-motion.from.y)*t};}
   else p=motion.control?{x:(1-t)**2*motion.from.x+2*(1-t)*t*motion.control.x+t*t*motion.to.x,y:(1-t)**2*motion.from.y+2*(1-t)*t*motion.control.y+t*t*motion.to.y}:{x:motion.from.x+(motion.to.x-motion.from.x)*t,y:motion.from.y+(motion.to.y-motion.from.y)*t};
   if(motion.kind==='ball'){p.height=motion.loft?4*t*(1-t)*motion.loft:0;if(motion.id==='ball')ball=p;if(ballById.has(motion.id))Object.assign(ballById.get(motion.id),p);}else if(byId.has(motion.id))Object.assign(byId.get(motion.id),p);
  }
  if(clamped<step.end)break;
 }
 return {time:clamped,players,ball,balls,step:current.index,title:current.title,caption:current.caption,ended:clamped>=plan.duration,team:current.team||'blue',phase:current.phase||'play',format:current.format||''};
}

// One shared lifecycle observer only watches removals. Detached figures stop and
// release their event handlers, including when their dialog is closed/removed.
const bibleAnimationControllers=new Set();
let bibleAnimationObserver=null;
function bibleAnimationMount(root,svg,exercise,group,options={}){
 const plan=bibleAnimationPlan(exercise,group,{...options,scene:svg.bibleScene}),box=document.createElement('div');box.className='bible-animation';
 const decision=typeof bibleDecisionGuide==='function'?bibleDecisionGuide(exercise,group,options,plan):null;
 const coaching=typeof bibleCoachScenario==='function'?bibleCoachScenario(exercise,group,options.sequenceIndex):null;
 if(!plan.available){const message=document.createElement('p');message.className='bible-animation-unavailable';message.textContent='Ajustez l’effectif et l’espace avant la démonstration.';box.append(message);root.dataset.animationState='idle';return {element:box,dispose(){},plan};}
 // Cadrer le terrain dans le lecteur ; la copie imprimée garde sa légende complète.
 const f=plan.field;svg.setAttribute('viewBox',[f.fx-40,f.fy-24,f.fw+80,f.fh+76].join(' '));
 // Les légendes d’installation restent sur la copie imprimée, jamais tournées
 // au milieu du lecteur. Les numéros et zones font partie du terrain.
 svg.dataset.reader='clean';for(const label of svg.querySelectorAll(':scope > text:not(.bible-zone-label):not(.bible-station-label)'))label.setAttribute('display','none');
 for(const annotation of svg.querySelectorAll('.bible-dimension,.bible-installation-legend,[data-feature=coach]'))annotation.setAttribute('display','none');
 for(const label of svg.querySelectorAll('.bible-zone-label,.bible-station-label'))label.setAttribute('data-reader-zone','true');
 const row=document.createElement('div');row.className='bible-animation-controls';
 const button=(name,text,label)=>{const b=document.createElement('button');b.type='button';b.className='bible-animation-'+name;b.textContent=text;b.setAttribute('aria-label',label);return b;};
 const play=button('play','▶ Voir l’exemple','Lire la démonstration'),reset=button('reset','↺ Installation','Revenir au départ'),previous=button('previous','‹','Étape précédente'),next=button('next','›','Étape suivante');play.setAttribute('aria-pressed','false');
 const speed=document.createElement('select');speed.className='bible-animation-speed';speed.setAttribute('aria-label','Vitesse de démonstration');for(const value of [.5,1,1.5,2]){const option=document.createElement('option');option.value=String(value);option.textContent=String(value).replace('.',',')+'×';speed.append(option);}speed.value='1';
 const progress=document.createElement('input');progress.type='range';progress.className='bible-animation-progress';progress.min='0';progress.max=String(plan.duration);progress.step='.01';progress.value='0';progress.setAttribute('aria-label','Avancement de la démonstration');
 const caption=document.createElement('p');caption.className='bible-animation-caption';caption.setAttribute('role','status');caption.setAttribute('aria-live','polite');
 const status=document.createElement('span');status.className='bible-animation-status';status.textContent='Démonstration du principe';
 const phases=document.createElement('div');phases.className='bible-animation-phases';phases.setAttribute('role','group');phases.setAttribute('aria-label','Actions de la démonstration');
 const gameState=document.createElement('p');gameState.className='bible-game-state';gameState.setAttribute('aria-live','polite');
 const key=document.createElement('p');key.className='bible-animation-key';key.textContent='Pointillés jaunes : ballon · traits bleus / rouges : courses · blanc : appui · G : gardien';
 const observe=document.createElement('p');observe.className='bible-animation-observe';const sequence=bibleDiagramSequence(exercise,options.sequenceIndex);if(coaching)observe.textContent='À observer · séquence '+((Number(options.sequenceIndex)||0)+1)+' : '+(options.sequenceObserve||sequence.observe||coaching.look);
 const guidedLabel=document.createElement('label');guidedLabel.className='bible-animation-guided';const guided=document.createElement('input');guided.type='checkbox';guided.setAttribute('aria-label','Arrêt après chaque action');guidedLabel.append(guided,document.createTextNode('Arrêt après chaque action'));row.append(guidedLabel);
 const decisionLabel=document.createElement('label');decisionLabel.className='bible-animation-guided';const decisionStops=document.createElement('input');decisionStops.type='checkbox';decisionStops.setAttribute('aria-label','Pauses pédagogiques');decisionLabel.append(decisionStops,document.createTextNode('Pauses pédagogiques'));if(decision?.moments.length)row.append(decisionLabel);
 const reading=document.createElement('details');reading.className='bible-decision-reading';
 if(decision){const summary=document.createElement('summary');summary.textContent='Comprendre le placement et le choix';reading.append(summary);for(const [label,value]of [['Déclencheur',decision.trigger],['Choix recherché',decision.choice],['Occupation de l’espace',decision.spacing],['À vérifier',decision.question],['Si cela ne fonctionne pas',decision.correction]]){const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=label+' · ';p.append(strong,document.createTextNode(value));reading.append(p);}}
 const placementLabel=document.createElement('label');placementLabel.className='bible-animation-guided';const placementHints=document.createElement('input');placementHints.type='checkbox';placementHints.setAttribute('aria-label','Repères de placement');placementLabel.append(placementHints,document.createTextNode('Repères de placement'));reading.append(placementLabel);
 const placementText=document.createElement('p');placementText.className='bible-placement-reading';placementText.hidden=true;
 const rolePlayers=plan.initial.players.filter(p=>!p.rotation).map(p=>({...p,role:p.role||(p.keeper?'Gardien':p.number===plan.initial.balls?.[0]?.owner?'Porteur au départ':p.team==='neutral'?'Appui de l’équipe en possession':p.team==='red'?'Joueur rouge':'Partenaire bleu')})),roleButtons=document.createElement('div');roleButtons.className='bible-role-choices';roleButtons.hidden=true;roleButtons.setAttribute('role','group');roleButtons.setAttribute('aria-label','Rôle et distances des joueurs');let selectedRole=null;
 for(const actor of rolePlayers){const b=button('role',(actor.keeper?'G':actor.team==='red'?'R':actor.team==='neutral'?'A':'B')+actor.number,'Repérer '+actor.number+' : '+actor.role);b.dataset.team=actor.team;b.setAttribute('aria-pressed','false');b.onclick=()=>{pause();selectedRole=actor.number;for(const item of roleButtons.children)item.setAttribute('aria-pressed',String(item===b));render();};roleButtons.append(b);}
 if(!rolePlayers.length)placementLabel.hidden=true;
 const decisionPrompt=document.createElement('p');decisionPrompt.className='bible-decision-prompt';decisionPrompt.hidden=true;decisionPrompt.setAttribute('role','status');
 row.append(play,reset,previous,next,speed,status);const actionDetails=document.createElement('details'),actionSummary=document.createElement('summary');actionDetails.className='bible-animation-chapters';actionSummary.textContent='Voir les actions de la démonstration';actionDetails.append(actionSummary,phases);reading.append(roleButtons,placementText);box.append(gameState,key,row,progress,caption,decisionPrompt,observe);if(decision)box.append(reading);box.append(actionDetails);
 const tokenElements=new Map([...svg.querySelectorAll('.bible-player')].map(e=>[Number(e.dataset.number),e])),ballElements=[...svg.querySelectorAll('[data-equipment="ball"][data-reserve="false"]')],traces=[...svg.querySelectorAll('.bible-action-pass,.bible-action-move,.bible-action-label')];
 const ballStarts=ballElements.map(el=>{const circle=el.querySelector('circle');return{x:Number(circle?.getAttribute('cx')),y:Number(circle?.getAttribute('cy'))};});
 const ballShadows=ballStarts.map(()=>{const shadow=document.createElementNS('http://www.w3.org/2000/svg','ellipse');shadow.setAttribute('data-feature','flight-shadow');shadow.setAttribute('data-animation-decoration','true');shadow.setAttribute('fill','#163d2c');shadow.setAttribute('rx','9');shadow.setAttribute('ry','4');shadow.setAttribute('opacity','0');svg.append(shadow);return shadow;});
 const trail=document.createElementNS('http://www.w3.org/2000/svg','line');for(const [key,value]of Object.entries({stroke:'#ffe39a','stroke-width':2.1,'stroke-dasharray':'6 5','stroke-linecap':'round','pointer-events':'none',opacity:0}))trail.setAttribute(key,String(value));trail.dataset.animationDecoration='true';svg.append(trail);
 const halo=document.createElementNS('http://www.w3.org/2000/svg','circle');halo.setAttribute('r','11');halo.setAttribute('fill','#ffffff18');halo.setAttribute('stroke','#ffdd78');halo.setAttribute('stroke-width','1.7');halo.setAttribute('pointer-events','none');halo.dataset.animationDecoration='true';svg.append(halo);
 const actorHalos=new Map();for(const [id,token]of tokenElements){const ring=document.createElementNS('http://www.w3.org/2000/svg','circle');for(const [key,value]of Object.entries({cx:0,cy:0,r:sceneRadius(),'fill':'none',stroke:'#ffe39a','stroke-width':1.4,opacity:0,'pointer-events':'none'}))ring.setAttribute(key,String(value));ring.dataset.animationDecoration='true';token.prepend(ring);actorHalos.set(id,ring);}
 const ns='http://www.w3.org/2000/svg',actionLayer=document.createElementNS(ns,'g');actionLayer.dataset.animationDecoration='true';actionLayer.setAttribute('class','bible-live-actions');actionLayer.setAttribute('pointer-events','none');svg.insertBefore(actionLayer,tokenElements.values().next().value||null);
 const actionButtons=new Map();for(const step of plan.steps.filter(s=>s.reference===undefined&&s.motions.length)){const b=button('phase',step.title,'Afficher : '+step.title);b.onclick=()=>{seek(step.start+.01);if(root.getBoundingClientRect().height<innerHeight-100)root.scrollIntoView({block:'nearest',behavior:'instant'});};b.setAttribute('aria-pressed','false');phases.append(b);actionButtons.set(step.index,b);}
 function drawAction(step){
  actionLayer.replaceChildren();if(!step)return;
  const make=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,String(v));return e;};
  if(step.action==='recovery'&&step.intendedTo){const start=step.motions.find(m=>m.kind==='ball')?.from;if(start)actionLayer.append(make('path',{d:'M'+start.x+' '+start.y+'L'+step.intendedTo.x+' '+step.intendedTo.y,fill:'none',stroke:'#fff','stroke-width':1.8,'stroke-dasharray':'3 6',opacity:.45}));}
  for(const motion of step.motions){
   if(motion.kind==='ball'&&motion.easing==='run')continue;
   if(Math.hypot(motion.to.x-motion.from.x,motion.to.y-motion.from.y)<sceneRadius()*.7)continue;
   const d=motion.control?'M'+motion.from.x+' '+motion.from.y+'Q'+motion.control.x+' '+motion.control.y+' '+motion.to.x+' '+motion.to.y:'M'+motion.from.x+' '+motion.from.y+'L'+motion.to.x+' '+motion.to.y;
   const color=motion.kind==='ball'?'#ffe09a':plan.initial.players.find(p=>p.number===motion.id)?.team==='red'?'#ff9ca6':'#a8d3ff';
   actionLayer.append(make('path',{d,fill:'none',stroke:color,'stroke-width':2.5,'stroke-dasharray':motion.kind==='ball'?'7 5':'none',opacity:.85}));
   const control=motion.control||motion.from,angle=Math.atan2(motion.to.y-control.y,motion.to.x-control.x),x=motion.to.x,y=motion.to.y;
   actionLayer.append(make('path',{d:'M'+(x-Math.cos(angle-.45)*10)+' '+(y-Math.sin(angle-.45)*10)+'L'+x+' '+y+'L'+(x-Math.cos(angle+.45)*10)+' '+(y-Math.sin(angle+.45)*10),stroke:color,'stroke-width':2.5,fill:'none','stroke-linejoin':'round'}));
   // Une flèche par trajet utile ; pas de cercle fantôme à chaque destination.
  }
 }
 function sceneRadius(){return (svg.bibleScene?.playerRadius||14)*1.28;}
 let time=0,playing=false,lastTimestamp=0,raf=0,disposed=false,lastCaption='',connected=false,dialog=null,lastStep=-1,stopAt=null;
 const format=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
 function render(){
  const state=bibleAnimationState(plan,time);const intent=bibleGameIntent(exercise,group),phaseLabel={play:intent.mode==='keep'?'Conservation':intent.mode==='technical'?'Travail technique':intent.mode==='support'?'Protection et soutien':intent.mode==='build'?'Construction / pression':intent.mode==='finish'&&state.team==='red'?'Relance après récupération':'Attaque',interception:'Interception en cours',transition:'Transition : changement de rôle',shot:'Finition',loose:'Second ballon à disputer',secured:'Gardien · ballon maîtrisé',end:'Fin de vague · rotation'};const stateText=(state.format?state.format+' + G · ':'')+(phaseLabel[state.phase]||'Jeu')+(intent.mode==='technical'?'':state.phase==='loose'||state.phase==='interception'?' · ballon à disputer':state.phase==='shot'?' · tir des '+(state.team==='red'?'rouges':'bleus'):' · ballon aux '+(state.team==='red'?'rouges':'bleus'));if(gameState.textContent!==stateText)gameState.textContent=stateText;gameState.dataset.team=state.team;if(intent.mode==='keep'&&!intent.staged){for(const team of ['blue','red']){const chip=root.querySelector('.bible-direction-'+team),text='↔ '+(team==='blue'?'Bleus':'Rouges')+' · '+(state.team===team?'Conserver dans la zone':'Récupérer, puis conserver');if(chip&&chip.textContent!==text)chip.textContent=text;}}root.dataset.possession=state.team;root.dataset.gamePhase=state.phase;if(typeof bibleDrawTeamVolumes==='function')bibleDrawTeamVolumes(svg,state.players);for(const p of state.players)tokenElements.get(p.number)?.setAttribute('transform','translate('+p.x+' '+p.y+')');
  state.balls.forEach((ball,i)=>{const initialBall=ballStarts[i],height=ball.height||0,lift=height*plan.field.scale*.55;if(initialBall)ballElements[i]?.setAttribute('transform','translate('+(ball.x-initialBall.x)+' '+(ball.y-initialBall.y-lift)+')');const shadow=ballShadows[i];if(shadow){shadow.setAttribute('cx',ball.x);shadow.setAttribute('cy',ball.y);shadow.setAttribute('opacity',height>0?'.3':'0');shadow.setAttribute('rx',String(9+Math.min(5,height)));}});
  halo.setAttribute('cx',state.ball.x);halo.setAttribute('cy',state.ball.y);halo.setAttribute('opacity',time>0?'1':'0');traces.forEach(t=>t.style.opacity='0');
  roleButtons.hidden=!placementHints.checked;placementText.hidden=!placementHints.checked;const selected=state.players.find(p=>p.number===selectedRole)||state.players.find(p=>!p.rotation);if(placementHints.checked&&selected){selectedRole=selected.number;const original=rolePlayers.find(p=>p.number===selected.number),distance=p=>Math.hypot(p.x-selected.x,p.y-selected.y)/plan.field.scale,nearest=(opponent)=>state.players.filter(p=>p.number!==selected.number&&!p.rotation&&(opponent?p.team!==selected.team&&p.team!=='neutral'&&selected.team!=='neutral':p.team===selected.team||p.team==='neutral')).sort((a,b)=>distance(a)-distance(b))[0],mate=nearest(false),opponent=nearest(true),fmt=p=>distance(p).toFixed(1).replace('.',',')+' m';placementText.textContent=(time===0?'Placement de départ':'Position dans l’exemple')+' · '+(original?.role||'Joueur')+' '+selected.number+(mate?' · partenaire '+mate.number+' à '+fmt(mate):'')+(opponent?' · adversaire '+opponent.number+' à '+fmt(opponent):'')+'. Distances du schéma, à ajuster au groupe.';for(const [id,ring]of actorHalos)ring.setAttribute('opacity',id===selectedRole?'1':'0');}
  const activeStep=plan.steps[state.step],flight=activeStep?.motions.find(m=>m.kind==='ball');if(flight&&flight.easing!=='run'&&time>activeStep.start+(flight.delay||0)&&time<activeStep.start+(flight.delay||0)+(flight.duration||activeStep.duration)){trail.setAttribute('x1',flight.from.x);trail.setAttribute('y1',flight.from.y);trail.setAttribute('x2',state.ball.x);trail.setAttribute('y2',state.ball.y);trail.setAttribute('opacity','.8');}else trail.setAttribute('opacity','0');
  if(lastStep!==state.step||time===0){const illustrated=activeStep?.reference===undefined?activeStep:plan.steps[activeStep.reference],involved=new Set(time>0?[...(illustrated?.motions||[]).filter(m=>m.kind==='player').map(m=>m.id),...(illustrated?.motions||[]).flatMap(m=>[m.fromPlayer,m.toPlayer]),illustrated?.from,illustrated?.to].filter(Number.isFinite):[]);for(const [id,ring]of actorHalos){ring.setAttribute('opacity',involved.has(id)?'.8':'0');const actor=plan.initial.players.find(p=>p.number===id),side=plan.initial.players.filter(p=>!p.keeper&&p.team===actor?.team),index=side.findIndex(p=>p.number===id),entered=actor?.keeper||index===0||index===1&&(actor.team==='blue'?state.format!=='1 contre 1':state.format==='2 contre 2');tokenElements.get(id).style.opacity=exercise.id==='duel-renforts'&&!entered?'.38':'1';}drawAction(time>0?illustrated:null);for(const [id,b]of actionButtons)b.setAttribute('aria-pressed',String(time>0&&id===illustrated?.index));lastStep=state.step;}
  if(placementHints.checked&&selectedRole!==null)for(const [id,ring]of actorHalos)ring.setAttribute('opacity',id===selectedRole?'1':'0');
  svg.querySelectorAll('.bible-start-ring,.bible-installation-note').forEach(e=>e.style.opacity=time>0?'0':'1');const heading=root.querySelector('.training-diagram-controls>strong'),headingText=(time>0?'Exemple d’action':'Installation')+' · atelier '+group.index;if(heading&&heading.textContent!==headingText)heading.textContent=headingText;
  const text=state.title+' · '+state.caption+(time===0?' installation':'');if(text!==lastCaption){const title=document.createElement('strong'),description=document.createElement('span');title.textContent=time===0&&coaching?'Installation · le départ':state.title;description.textContent=time===0&&coaching?coaching.start:state.caption;caption.replaceChildren(title,description);lastCaption=text;}
  const timeLabel=format(time)+' / '+format(plan.duration);if(status.textContent!==timeLabel)status.textContent=timeLabel;progress.value=String(time);progress.setAttribute('aria-valuetext',state.title+' · '+format(time)+' sur '+format(plan.duration));previous.disabled=time<=0;next.disabled=time>=plan.duration;
  const stoppedMoment=decisionStops.checked&&!playing&&decision?.moments.find(m=>Math.abs(m.time-time)<.025);decisionPrompt.hidden=!stoppedMoment;if(stoppedMoment)decisionPrompt.textContent='Avant d’agir · '+stoppedMoment.title+' — '+stoppedMoment.question;
  root.dataset.animationState=playing?'playing':time>=plan.duration?'ended':time>0?'paused':'idle';root.dataset.animationStep=String(state.step);return state;
 }
 function pause(){playing=false;cancelAnimationFrame(raf);raf=0;lastTimestamp=0;play.textContent=decisionStops.checked&&time>0&&time<plan.duration?'▶ Continuer':guided.checked&&time>0&&time<plan.duration?'▶ Action suivante':'▶ Voir l’exemple';play.setAttribute('aria-label',guided.checked&&time>0&&time<plan.duration?'Lire l’action suivante':'Lire la démonstration');play.setAttribute('aria-pressed','false');if(!disposed)render();}
 function hidden(){const parentDialog=root.closest('dialog');return document.hidden||!root.isConnected||root.closest('[hidden],details:not([open])')!==null||Boolean(parentDialog&&!parentDialog.open)||getComputedStyle(root).display==='none'||!root.getClientRects().length||!svg.getClientRects().length;}
 function tick(timestamp){
  if(!playing||disposed)return;if(hidden()){pause();return;}
  if(lastTimestamp)time=Math.min(stopAt??plan.duration,time+Math.min(.1,(timestamp-lastTimestamp)/1000)*Number(speed.value));lastTimestamp=timestamp;
  const state=render();if(state.ended||stopAt!==null&&time>=stopAt){pause();return;}raf=requestAnimationFrame(tick);
 }
 function start(){if(disposed||hidden())return;connected=true;if(time>=plan.duration)time=0;stopAt=decisionStops.checked?(decision?.moments.find(m=>m.time>time+.05)?.time??plan.duration):guided.checked?(plan.steps.find(s=>s.motions.length&&s.end>time+.05)?.end??plan.duration):null;playing=true;lastTimestamp=0;play.textContent='Ⅱ Pause';play.setAttribute('aria-label','Mettre la démonstration en pause');play.setAttribute('aria-pressed','true');dialog=root.closest('dialog');dialog?.addEventListener('close',pause);render();raf=requestAnimationFrame(tick);}
 function seek(value){pause();time=Math.max(0,Math.min(plan.duration,Number(value)||0));render();}
 function step(direction){const starts=[0,...plan.steps.map(s=>s.start),plan.duration];seek(direction>0?starts.find(t=>t>time+.05)??plan.duration:[...starts].reverse().find(t=>t<time-.05)??0);}
 function visibility(){if(document.hidden)pause();}
 const controller={element:box,plan,play:start,pause,seek,step,reset:()=>seek(0),get state(){return bibleAnimationState(plan,time);},dispose(){if(disposed)return;pause();disposed=true;halo.remove();trail.remove();actionLayer.remove();for(const [id,ring]of actorHalos){ring.remove();tokenElements.get(id).style.opacity='';}document.removeEventListener('visibilitychange',visibility);dialog?.removeEventListener('close',pause);bibleAnimationControllers.delete(controller);if(!bibleAnimationControllers.size){bibleAnimationObserver?.disconnect();bibleAnimationObserver=null;}},check(){if(root.isConnected){connected=true;if(playing&&hidden())pause();}else if(connected)controller.dispose();}};
 placementHints.onchange=()=>{if(placementHints.checked)pause();render();};guided.onchange=()=>{if(guided.checked)decisionStops.checked=false;pause();};decisionStops.onchange=()=>{if(decisionStops.checked)guided.checked=false;pause();};play.onclick=()=>playing?pause():start();reset.onclick=()=>seek(0);previous.onclick=()=>step(-1);next.onclick=()=>step(1);progress.oninput=()=>seek(progress.value);document.addEventListener('visibilitychange',visibility);
 bibleAnimationControllers.add(controller);
 if(!bibleAnimationObserver&&document.body){bibleAnimationObserver=new MutationObserver(records=>{if(records.some(r=>r.removedNodes.length))for(const c of bibleAnimationControllers)c.check();});bibleAnimationObserver.observe(document.body,{childList:true,subtree:true});}
 render();queueMicrotask(()=>controller.check());return controller;
}
