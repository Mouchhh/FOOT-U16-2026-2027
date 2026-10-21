// Complete local rotations: every station has its own ball on a shared clock.
// Slots are the actual installation positions; identities never change.
function bibleCircuitAnimationPlan(exercise,group,scene,options={}){
 const field=scene.field,players=scene.tokens.map(p=>({...p})),positions=new Map(players.map(p=>[p.number,{x:p.x,y:p.y}])),steps=[];
 const initial={players,ball:{...scene.ball},balls:scene.balls.map(b=>({...b}))};
 const stations=bibleCircuitStations(group,field).map((s,i)=>({...s,roles:players.filter(p=>p.number>s.offset&&p.number<=s.offset+s.players).map(p=>p.number),ball:scene.balls[i]?.id}));
 const maxRounds=Math.max(...stations.map(s=>s.players)),balls=new Map(scene.balls.map(b=>[b.id,{...b}]));let time=0;
 const actor=id=>players.find(p=>p.number===id),feet=id=>bibleDiagramBallSpot({...actor(id),...positions.get(id)},field,scene.playerRadius);
 function phase(title,caption,motions,seconds,action){
  const duration=Math.max(seconds,...motions.map(m=>Math.hypot(m.to.x-m.from.x,m.to.y-m.from.y)/field.scale/(m.kind==='player'||m.follow!==undefined?3.8:12)));
  const step={index:steps.length,start:time,end:time+duration,duration,title,caption,motions,team:'blue',phase:'play',format:'',action};
  for(const m of motions){if(m.kind==='player')positions.set(m.id,{...m.to});else Object.assign(balls.get(m.id),m.to);}
  steps.push(step);time=step.end;
 }
 phase('Installation · chaque circuit a son ballon','Identifier les trois postes et la file ; les circuits fonctionnent en parallèle.',[],.7);
 const design=typeof bibleExerciseDesign==='function'?bibleExerciseDesign(exercise,options.designIndex):null,mode=design?.demo||'base';
 for(let round=0;round<maxRounds;round++){
  const ready=stations.filter(s=>s.players>round&&s.roles.length>=3&&s.ball);
  const routes=mode==='technical-return'?[[0,1],[1,0],[0,2],[2,3]]:mode==='technical-direct'?[[0,2],[2,1],[1,3]]:[[0,1],[1,2],[2,3]];
  for(let link=0;link<routes.length;link++){
   const motions=[];for(const station of ready){const route=routes[link],from=station.roles[route[0]],to=station.roles[route[1]],ball=balls.get(station.ball);if(!to)continue;motions.push({kind:'ball',id:station.ball,from:{x:ball.x,y:ball.y},to:feet(to),fromPlayer:from,toPlayer:to});ball.owner=to;}
   if(!motions.length)continue;
   phase((link+1)+' · '+(mode==='technical-return'?['Trouver l’appui','Remettre au soutien','Trouver le troisième','Relier le suivant'][link]:mode==='technical-direct'?['Trouver directement le troisième','Relier le poste opposé','Servir le suivant'][link]:['Passe au deuxième poste','Contrôle orienté et passe','Relier au prochain départ'][link]),design?.rule||'Contrôler vers le prochain poste puis transmettre ; chacun garde son numéro pendant la rotation.',motions,.65,'pass');
   if(motions[0]){steps.at(-1).from=motions[0].fromPlayer;steps.at(-1).to=motions[0].toPlayer;}
  }
  const motions=[];for(const station of ready){
   const old=station.roles.slice(),[a,b,c,...queue]=old,next=mode==='technical-direct'?(queue.length?[queue[0],c,a,...queue.slice(1),b]:[b,c,a]):queue.length?[queue[0],a,b,...queue.slice(1),c]:[c,a,b],slots=old.map(id=>({...positions.get(id)}));
   for(let i=0;i<next.length;i++)motions.push({kind:'player',id:next[i],from:{...positions.get(next[i])},to:slots[i]});
   const carrier=balls.get(station.ball).owner,move=motions.find(m=>m.kind==='player'&&m.id===carrier),from=balls.get(station.ball);motions.push({kind:'ball',id:station.ball,from:{x:from.x,y:from.y},to:bibleDiagramBallSpot({...actor(carrier),...move.to},field,scene.playerRadius),follow:carrier,easing:'run'});station.roles=next;
  }
  phase('Tourner réellement vers le poste suivant',mode==='technical-direct'?'Rotation adaptée au sens de la passe : départ → troisième poste → deuxième poste → fin de file. Chacun garde son numéro.':'Après la transmission : départ → deuxième poste → troisième poste → fin de file. Le prochain porteur rejoint le départ avec le ballon. Aucun numéro n’est échangé.',motions,1.4,'rotation');
 }
 phase('Rotation complète · recommencer','Chacun a occupé tous les postes de son circuit. Revenir au départ pour montrer de nouveau ou changer les critères de la séquence.',[],.8);
 return {version:2,exerciseId:exercise.id,groupIndex:group.index,sequenceIndex:Number(options.sequenceIndex)||0,field:{...field},playerRadius:scene.playerRadius,initial,steps,duration:time,available:group.fits!==false&&group.pedagogyFits!==false&&scene.activeBalls>0,label:'Circuit continu · rotation complète',sequenceRule:bibleDiagramSequence(exercise,options.sequenceIndex).rule||'',note:'Exemple technique ; les numéros suivent les joueurs pendant la rotation.'};
}
