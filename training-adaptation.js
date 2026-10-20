// Adaptations éditoriales du club. Ces repères d'installation ne sont pas des normes fédérales.
// Fonctions sans DOM : un même plan alimente la fiche, le schéma et l'export.
function bibleTrainingProfile(session={}){
 const category=String(session.category||'').trim(),ages=[...category.matchAll(/\bU\s*(\d{2})(?!\d)/gi)].map(m=>Number(m[1])).filter(n=>n>=12&&n<=23),senior=/s[ée]niors?|v[ée]t[ée]rans?/i.test(category),age=senior?Math.max(18,session.age||18):ages.length?Math.max(...ages):session.age||18;
 const band=senior?'adult':age<=15?'young':age<=18?'youth':'adult',level=['discovery','developing','advanced'].includes(session.level)?session.level:'developing',novice=level==='discovery',advanced=level==='advanced';
 const workSeconds=novice?(band==='young'?120:150):band==='young'?150:band==='youth'?180:advanced?240:210,restSeconds=session.coachingLoad==='light'?90:novice?(band==='young'?75:90):advanced?75:60;
 return {category:category||'Âge repère '+age+' ans',age,band,level,label:novice?'Découverte / reprise des bases':advanced?'Confirmé':'En développement',workSeconds:session.coachingLoad==='light'?Math.min(150,workSeconds):workSeconds,restSeconds,spaceFactor:(band==='young'?.9:1)*(novice?1.2:advanced?.95:1),idealFactor:(band==='young'?.9:1)*(novice?.8:advanced?1.1:1),passTarget:novice?3:advanced?6:5,focus:novice?'Une seule priorité observable ; stabiliser les réussites avant de compliquer.':advanced?'Lire la pression et choisir la solution ; vérifier le transfert sans aide.':'Relier la qualité technique à une décision sous opposition.',context:session.context||'Autre'};
}
function bibleExerciseLearning(exercise,session={}){
 const profile=bibleTrainingProfile(session),template=bibleExerciseKnowledge(exercise).template||'possession',index={discovery:0,developing:1,advanced:2}[profile.level];
 const rules={
  rondo:['Touches libres ; rechercher deux solutions et 3 passes maîtrisées avant de compliquer.','Après la passe, changer d’angle ; rechercher 5 passes sous une pression réelle.','Chercher la passe qui traverse la pression si elle existe ; 6 passes ou une sortie maîtrisée de la densité.'],
  possession:['Touches libres ; 3 passes pour un point et une priorité : rendre un soutien visible.','5 passes pour un point ; le receveur prépare sa solution suivante avant le contrôle.','6 passes pour un point ; valoriser la sortie de pression, puis retirer le bonus pour vérifier le transfert.'],
  build:['Les opposants déclenchent après le premier contrôle ; touches libres et deux soutiens visibles.','La pression démarre sur la passe ; relier une solution courte et une solution plus haute.','Pression active dès la mise en jeu ; choisir jeu court ou passe qui élimine la première ligne sans circuit imposé.'],
  press:['Un seul signal annoncé : la passe latérale. Un joueur presse, un partenaire couvre ; rejouer après le retour du coach.','Reconnaître passe latérale ou contrôle fermé ; coordonner pression et couverture.','Choisir le déclencheur selon la pression sur le ballon ; si la première ligne est éliminée, se réorganiser plutôt que poursuivre seul.'],
  endzones:['Touches libres ; identifier le sens de jeu avant d’imposer l’arrivée dans la cible sur un appel.','Recevoir dans la cible sur un appel ; garder un soutien si la passe devant est fermée.','Coordonner l’appel avec la pression sur le passeur ; conserver, changer de côté ou jouer derrière selon l’espace.'],
  'four-goals':['Touches libres ; repérer la cible libre et donner de la largeur, sans obligation de renverser.','Attirer sur un côté puis chercher la cible opposée si elle devient accessible.','Le relais décide de renverser ou de poursuivre ; retirer tout bonus pour vérifier la lecture du côté faible.'],
  transition:['Première priorité : maîtriser le premier ballon après récupération. Nommer une solution devant et une sécurité.','À la récupération, choisir progression ou sécurité ; à la perte, le proche ralentit et les autres protègent l’axe.','Adapter la projection à l’équilibre conservé derrière le ballon ; si l’attaque rapide est fermée, reconstruire.'],
  duel:['Touches libres et départ à distance pour voir l’adversaire ; fixer avant de choisir passe ou conduite.','Le défenseur intervient sur la réception ; le porteur lit l’espace et le soutien reste disponible.','Opposition active dès la passe ; enchaîner feinte, passe ou conduite selon la réaction réelle du défenseur.'],
  finish:['Contrôle autorisé et service précis ; observer le dernier contact avant la frappe, sans contrainte de vitesse.','Préparer la frappe sous opposition et proposer une solution de remise.','Décider frappe, remise ou passe sous pression ; suivre le ballon repoussé avec un soutien complémentaire.'],
  'wide-finish':['Le centreur peut contrôler et regarder ; un receveur attaque une zone annoncée avant de multiplier les courses.','Deux courses complémentaires ; le centreur choisit son service en regardant les positions.','Adapter centre en retrait, premier ou second poteau à la défense ; conserver si aucune réception n’est accessible.'],
  circuit:['Contrôle autorisé, rythme modéré et précision ; ne pas imposer une touche.','Prise d’information et contrôle orienté avant la passe suivante.','Choisir contrôle ou remise directe selon le service ; varier le sens sans dégrader la précision.'],
  corner:['Annoncer une responsabilité par joueur et répéter le signal à vitesse maîtrisée avant l’opposition.','Coordonner le signal, les courses et la couverture du second ballon.','Adapter les zones attaquées ou protégées au placement adverse ; enchaîner la transition sur le second ballon.'],
  keeper:['Service prévisible au départ ; replacer le gardien et stabiliser sa posture avant de varier.','Varier les angles de service ; le gardien lit le ballon et communique avec ses partenaires.','Le gardien choisit sa réponse selon la trajectoire et la pression ; relier son intervention à la relance si elle est disponible.']
 };
 let constraint=(rules[template]||rules.possession)[index];
 if(exercise.id==='warm')constraint=['Chacun garde son ballon ; conduire doucement et regarder avant de changer de direction.','Chacun garde son ballon ; adapter la conduite à l’espace repéré avant le changement de direction.','Chacun garde son ballon ; annoncer une information visuelle puis changer de direction sans accélérer inutilement.'][index];
 if(exercise.id==='cool')constraint=profile.level==='advanced'?'Faire expliquer une décision du thème et le contexte où elle serait utile en match.':'Faire citer une réussite et un point à reprendre, sans nouvelle charge physique.';
 if(exercise.id==='rondo-direction')constraint=profile.level==='discovery'?'Touches libres ; donner un point à une passe qui franchit la pression, sans la forcer si la ligne est fermée.':'Identifier le moment de franchir la pression ; la passe traversante maîtrisée vaut un point, la conservation reste possible.';
 return {profile,constraint,success:profile.level==='discovery'?'Faire évoluer seulement après 3 répétitions maîtrisées sur le critère observé.':profile.level==='advanced'?'Retirer l’aide ou le bonus et vérifier que le comportement reste présent dans le jeu.':'Faire évoluer une seule contrainte quand les réussites deviennent régulières.'};
}
function bibleAvailable(session={}){
 const spaces={small:[32,24],quarter:[34,52],half:[68,52],full:[68,105],custom:[40,30]};
 const base=spaces[session.space]||spaces.half;
 return {width:Number.isFinite(session.spaceWidth)&&session.spaceWidth>=6&&session.spaceWidth<=105?session.spaceWidth:base[0],length:Number.isFinite(session.spaceLength)&&session.spaceLength>=6&&session.spaceLength<=120?session.spaceLength:base[1]};
}
function bibleExerciseKnowledge(exercise){
 const entry=typeof bibleKnowledge!=='undefined'?bibleKnowledge[exercise.id]:null;
 if(entry)return entry;
 const template=exercise.kind==='circuit'?'circuit':exercise.kind==='possession'?'possession':exercise.kind==='finish'?'finish':exercise.kind==='cpa'?'corner':exercise.kind==='duel'?'duel':'endzones';
 return {template,format:{min:template==='circuit'||template==='duel'?2:4,max:Math.max(4,Math.ceil((exercise.target||8)*1.6)),ideal:exercise.target||8,neutrals:0,keeperMode:['finish','corner'].includes(template)?'single':template==='endzones'?'goals':'feet',goals:['finish','corner'].includes(template)?1:template==='endzones'?2:0,goalType:template==='endzones'?'gate':'full',zones:template==='endzones'?3:1},sequences:[],sourceIds:[]};
}
function bibleInteger(value,fallback,min,max){return Number.isInteger(value)?Math.max(min,Math.min(max,value)):fallback;}
function bibleFormat(exercise,knowledge,session={}){
 const raw=knowledge.format||{},min=bibleInteger(raw.min,2,2,40),ideal=Math.max(min,Math.min(raw.max||40,Math.round(bibleInteger(raw.ideal,exercise.target||8,2,40)*bibleTrainingProfile(session).idealFactor)));
 return {...raw,min,max:Math.max(min,bibleInteger(raw.max,Math.max(ideal,min),2,40)),ideal,neutrals:bibleInteger(raw.neutrals,0,0,4),requiresKeeper:raw.requiresKeeper===true||knowledge.template==='keeper',keeperMode:['feet','goals','single'].includes(raw.keeperMode)?raw.keeperMode:'feet',goals:[0,1,2,4].includes(raw.goals)?raw.goals:0,goalType:['mini','full','gate'].includes(raw.goalType)?raw.goalType:'gate',zones:[1,2,3,5].includes(raw.zones)?raw.zones:1};
}
function bibleDistribute(players,keepers,count){
 const base=Math.floor(players/count),rest=players%count;
 const groups=Array.from({length:count},(_,i)=>({players:base+(i<rest?1:0),keepers:0}));
 for(let left=keepers;left>0;left--){
  // Priorité à un gardien par atelier puis à une répartition équilibrée.
  const ranked=groups.map((g,i)=>({g,i})).filter(({g})=>g.keepers<g.players).sort((a,b)=>a.g.keepers-b.g.keepers||(b.g.players-b.g.keepers)-(a.g.players-a.g.keepers)||a.i-b.i);
  if(ranked.length)ranked[0].g.keepers++;
 }
 return groups;
}
function bibleRolePlan(exercise,format,group,template,profile={level:'developing'}){
 const circuit=exercise.kind==='circuit'||template==='circuit';
 const fullGoals=format.goalType==='full'?format.goals:0;
 const feet=circuit||format.keeperMode==='feet'||fullGoals===0;
 const activeKeepers=feet?0:Math.min(group.keepers,format.keeperMode==='single'?1:Math.min(2,fullGoals));
 const rotatingKeepers=feet?0:group.keepers-activeKeepers;
 const fieldKeepers=feet?group.keepers:0;
 const field=group.players-(feet?0:group.keepers);
 let blue=0,red=0,neutral=0;
 if(exercise.id==='duel-renforts'){blue=Math.ceil(field/2);red=Math.floor(field/2);}
 else if(circuit||format.opposition==='none')blue=field;
 else if(template==='rondo'){
  // Rondo : une véritable supériorité, avec un rapport de pression raisonnable.
  red=Math.max(1,Math.min(profile.level==='discovery'?Math.floor(field/4):profile.level==='advanced'?Math.ceil(field/3):Math.floor(field/3),Math.floor((field-1)/2),field-2));
  if(field<3)red=Math.min(1,field);blue=field-red;
 }else if(Number.isInteger(format.attackAdvantage)&&format.attackAdvantage>0){
  neutral=Math.min(format.neutrals,Math.max(0,field-3));
  const remaining=field-neutral,advantage=Math.max(0,Math.min(remaining-2,format.attackAdvantage));
  blue=Math.min(Math.max(0,remaining-1),Math.ceil((remaining+advantage)/2));red=remaining-blue;
 }else{
  neutral=Math.min(format.neutrals,Math.max(0,field-2));
  if((field-neutral)%2){
   // Un appui fait partie de l'objectif : ne jamais le supprimer pour obtenir la parité.
   if(neutral>0&&field-(neutral+1)>=4)neutral++;
   else if(neutral===0&&field>=3)neutral=1;
  }
  blue=Math.ceil((field-neutral)/2);red=Math.floor((field-neutral)/2);
 }
 const teams={blue,red,neutral},keeperSlots=[];
 let remaining=fieldKeepers;
 for(const name of ['blue','red','neutral'])for(let i=0;i<teams[name]&&remaining>0;i++,remaining--)keeperSlots.push({team:name,index:i});
 let roles=circuit?blue+' participants dans le circuit':format.opposition==='none'?blue+' joueurs de champ en alternance, sans défenseur':blue+' bleus contre '+red+' rouges'+(neutral?' + '+neutral+' appui'+(neutral>1?'s':'')+' neutre'+(neutral>1?'s':''):'');
 if(exercise.id==='duel-renforts')roles+=' · une vague de 2 bleus et 2 rouges maximum ; les autres attendent et tournent à chaque vague';
 if(fieldKeepers)roles+=' · '+fieldKeepers+' gardien'+(fieldKeepers>1?'s':'')+' inclus au jeu au pied';
 if(activeKeepers)roles+=' + '+activeKeepers+' gardien'+(activeKeepers>1?'s':'')+' en but';
 if(rotatingKeepers)roles+=' + '+rotatingKeepers+' gardien'+(rotatingKeepers>1?'s':'')+' en rotation';
 const allocation=circuit?[group.players]:[blue,red,neutral,feet?0:group.keepers];
 return {teams,roles,allocation,activeKeepers,rotatingKeepers,fieldKeepers,rotationPlayers:rotatingKeepers,keeperSlots};
}
function bibleMaterial(exercise,format,group,template){
 let goals=0,miniGoals=0,gates=0;
 if(format.goalType==='mini')miniGoals=format.goals;
 else if(format.goalType==='gate')gates=format.goals;
 else{goals=Math.min(format.goals,group.activeKeepers);gates=Math.max(0,format.goals-goals);}
 miniGoals+=Number.isInteger(format.miniGoals)?Math.min(2,Math.max(0,format.miniGoals)):0;
 const activeBalls=exercise.id==='warm'?group.players:template==='circuit'?Math.max(1,Math.floor(group.players/3)):1;
 const balls=exercise.id==='wall-pass'?1:Math.max(activeBalls,template==='circuit'?Math.ceil(group.players/2):Math.max(2,Math.ceil(group.players/4)));
 const equipment=format.equipment||{},extra={};
 for(const key of ['hurdles','poles','ladders','hoops','dummies'])if(Number.isInteger(equipment[key])&&equipment[key]>=0&&equipment[key]<=12)extra[key]=equipment[key];
 const circuitCones=template==='circuit'&&!['warm','cool'].includes(exercise.id)?3*activeBalls:0;
 const discs=Number.isInteger(format.discs)&&format.discs>=2&&format.discs<=20?format.discs:4+2*(format.zones-1),cones=2*gates+circuitCones;
 return {balls,activeBalls,reserveBalls:balls-activeBalls,discs,cones,circuitCones,bibsBlue:group.teams.blue,bibsRed:group.teams.red,bibsNeutral:group.teams.neutral,bibsKeeper:group.activeKeepers+group.rotatingKeepers,goals,miniGoals,gates,...extra};
}
function bibleDimensions(exercise,session,group,template,options){
 const minima={combination:[20,28,10],rondo:[6,6,6],possession:[10,12,15],endzones:[14,18,22],'four-goals':[14,18,22],build:[16,20,28],press:[16,20,28],transition:[16,20,28],finish:[12,18,22],'wide-finish':[20,24,32],circuit:[6,6,7],duel:[8,10,16],corner:[22,26,25],keeper:[10,14,20]};
 const basis=minima[template]||minima.possession;
 const factor=bibleTrainingProfile(session).spaceFactor;
 const scaling=Math.sqrt(group.players/Math.max(2,exercise.target||8))*factor;
 const desiredW=Math.max(basis[0],Math.round((exercise.width||24)*scaling)),desiredL=Math.max(basis[1],Math.round((exercise.length||24)*scaling));
 const densityFactor=Math.sqrt((basis[2]*group.players)/(desiredW*desiredL));
 const minimumFactor=Math.max(.67,Math.min(1,densityFactor));
 const minimum={width:Math.max(basis[0],Math.ceil(desiredW*minimumFactor)),length:Math.max(basis[1],Math.ceil(desiredL*minimumFactor))};
 const explicitW=Number.isFinite(options.width)&&options.width>=6&&options.width<=105?options.width:null,explicitL=Number.isFinite(options.length)&&options.length>=6&&options.length<=120?options.length:null;
 // Une dimension imposée par le coach n'est jamais discrètement écrasée pour la faire tenir.
 return {desired:{width:explicitW??desiredW,length:explicitL??desiredL},minimum:{width:explicitW??minimum.width,length:explicitL??minimum.length},recommendedMinimum:minimum,explicit:explicitW!==null||explicitL!==null};
}
function bibleActors(format,rolePlan,template){
 const defaults={finish:2,'wide-finish':3,corner:3,build:2,press:2};
 const minAttackers=bibleInteger(format.minAttackers,defaults[template]||1,1,20);
 const minDefenders=bibleInteger(format.minDefenders,template==='circuit'||format.opposition==='none'?0:1,0,20);
 const attackers=rolePlan.teams.blue+rolePlan.teams.neutral,defenders=rolePlan.teams.red;
 return {minAttackers,minDefenders,attackers,defenders,actorsFit:attackers>=minAttackers&&defenders>=minDefenders};
}
function bibleZones(group,format,template){
 const zones=[],n=format.zones,axis=format.zoneAxis==='width'?'width':'length',total=group[axis];
 const fractions=template==='endzones'&&n===3&&axis==='length'?[.15,.7,.15]:Array.from({length:n},()=>1/n);
 let offset=0;
 fractions.forEach((share,i)=>{const span=i===n-1?Math.round((total-offset)*10)/10:Math.round(total*share*10)/10;const name=Array.isArray(format.zoneLabels)&&typeof format.zoneLabels[i]==='string'?format.zoneLabels[i]:template==='endzones'&&n===3&&axis==='length'?(i===1?'Jeu':'Zone de marque '+(i===0?'A':'B')):'Zone '+(i+1);zones.push({name,x:axis==='length'?Math.round(offset*10)/10:0,y:axis==='width'?Math.round(offset*10)/10:0,width:axis==='width'?span:group.width,length:axis==='length'?span:group.length});offset+=span;});
 return zones;
}
function bibleLayout(groups,available,allowReduce){
 const count=groups.length,gap=3,margin=2;let best=null;
 for(let cols=1;cols<=count;cols++){
  const rows=Math.ceil(count/cols);
  for(const rotated of [false,true]){
   const usableW=available.width-2*margin-gap*(cols-1),usableL=available.length-2*margin-gap*(rows-1);
   const desiredW=Math.max(...groups.map(g=>rotated?g.desired.length:g.desired.width)),desiredL=Math.max(...groups.map(g=>rotated?g.desired.width:g.desired.length));
   const rawFactor=Math.min(1,usableW/(cols*desiredW),usableL/(rows*desiredL));
   const factor=allowReduce?Math.max(0,rawFactor):1;
   const fitted=groups.map(g=>({width:Math.max(g.minimum.width,Math.floor(g.desired.width*factor)),length:Math.max(g.minimum.length,Math.floor(g.desired.length*factor))}));
   const cellW=Math.max(...fitted.map(g=>rotated?g.length:g.width)),cellL=Math.max(...fitted.map(g=>rotated?g.width:g.length));
   const width=2*margin+cols*cellW+gap*(cols-1),length=2*margin+rows*cellL+gap*(rows-1),fits=width<=available.width&&length<=available.length;
   const overflow=Math.max(0,width-available.width)/available.width+Math.max(0,length-available.length)/available.length;
   const score=(fits?0:100+overflow*100)+(1-factor)*12+(cols*rows-count)*.05+(rotated?.01:0);
   if(!best||score<best.score)best={score,groups:fitted,footprint:{width,length,cols,rows,gap,margin,rotated,cellWidth:cellW,cellLength:cellL},fits,factor};
  }
 }
 return best;
}
function biblePlan(exercise,session={},options={}){
 const knowledge=bibleExerciseKnowledge(exercise),format=bibleFormat(exercise,knowledge,session),template=knowledge.template||'possession',learning=bibleExerciseLearning(exercise,session);
 const players=bibleInteger(session.players,8,2,80),keepers=bibleInteger(session.keepers,0,0,Math.min(12,players));
 const available=bibleAvailable(session),warnings=[];
 // Les anciennes fiches conservent leur répartition. Le coach peut désormais garder
 // tout le groupe dans un seul jeu, même au-delà du repère d'effectif de la fiche.
 const organisation=['single','auto','stations'].includes(options.organisation)?options.organisation:'auto';
 const requestedGroups=organisation==='single'?1:options.organisation==='auto'?null:Number.isInteger(options.groups)?options.groups:organisation==='stations'?1:null;
 const maxGroups=Math.min(40,Math.floor(players/2));
 let counts=requestedGroups!==null?[Math.max(1,Math.min(maxGroups,requestedGroups))]:Array.from({length:maxGroups},(_,i)=>i+1);
 if(requestedGroups===null&&format.requiresKeeper)counts=keepers?counts.filter(count=>count<=keepers):[1];
 const validCounts=counts.filter(count=>Math.floor(players/count)>=format.min&&Math.ceil(players/count)<=format.max);
 if(validCounts.length)counts=validCounts;
 else if(requestedGroups===null)counts=[Math.max(1,Math.min(maxGroups,format.requiresKeeper?Math.max(1,keepers):maxGroups,Math.round(players/format.ideal)))];
 let chosen=null;
 for(const count of counts){
  const distributed=bibleDistribute(players,keepers,count);
  const groups=distributed.map((group,i)=>{
   const rolePlan=bibleRolePlan(exercise,format,group,template,learning.profile),dims=bibleDimensions(exercise,session,group,template,options);
   const opposition=template==='circuit'||format.opposition==='none'?rolePlan.teams.blue>0:rolePlan.teams.blue>0&&rolePlan.teams.red>0;
   const keeperPresent=!format.requiresKeeper||rolePlan.activeKeepers+rolePlan.fieldKeepers>0;
   const appuiPresent=format.neutrals===0||rolePlan.teams.neutral>0;
   const superiority=!format.attackAdvantage||rolePlan.teams.blue>rolePlan.teams.red,actors=bibleActors(format,rolePlan,template);
   return {...group,...rolePlan,...dims,...actors,index:i+1,template,format,learning,pedagogyFits:group.players>=format.min&&((organisation==='single'&&exercise.id!=='wall-pass')||group.players<=format.max)&&opposition&&keeperPresent&&appuiPresent&&superiority&&actors.actorsFit};
  });
  const layout=bibleLayout(groups,available,true);
  const sizePenalty=groups.reduce((sum,g)=>sum+Math.abs(g.players-format.ideal)/format.ideal,0)/count;
  const invalid=groups.some(g=>!g.pedagogyFits);
  const score=layout.score+(invalid?80:0)+sizePenalty*4+Math.abs(count-players/format.ideal)*.1;
  if(!chosen||score<chosen.score)chosen={groups,layout,score};
 }
 const {layout}=chosen;
 const groups=chosen.groups.map((raw,i)=>{
  const dims=layout.groups[i],reduced=dims.width<raw.desired.width||dims.length<raw.desired.length;
  const belowRecommended=dims.width<raw.recommendedMinimum.width||dims.length<raw.recommendedMinimum.length;
  const fits=layout.fits&&raw.pedagogyFits&&!belowRecommended;
  const g={...raw,...dims,tight:reduced,fits,layout:{x:layout.footprint.margin+(i%layout.footprint.cols)*(layout.footprint.cellWidth+layout.footprint.gap),y:layout.footprint.margin+Math.floor(i/layout.footprint.cols)*(layout.footprint.cellLength+layout.footprint.gap),rotation:layout.footprint.rotated?90:0},notes:[]};
  g.material=bibleMaterial(exercise,format,g,template);g.zoneDimensions=bibleZones(g,format,template);
  if(template==='circuit'&&!['warm','cool'].includes(exercise.id)){
   const count=g.material.activeBalls,cols=Math.min(count,Math.max(1,Math.ceil(Math.sqrt(count*g.length/g.width)))),rows=Math.ceil(count/cols);
   g.circuitLayout={cols,rows,gap:3,width:(g.width-3*(rows-1))/rows,length:(g.length-3*(cols-1))/cols};g.circuitFits=g.circuitLayout.width>=6&&g.circuitLayout.length>=6;
   if(!g.circuitFits){g.fits=false;g.notes.push('Circuits trop serrés : prévoir au moins 6 × 6 m par circuit et 3 m entre circuits. Agrandir ou organiser des ateliers séparés.');}
  }
  if(reduced)g.notes.push('Dimensions resserrées par rapport au repère initial ; vérifier que les solutions de jeu restent possibles.');
  if(g.teams.neutral>format.neutrals)g.notes.push('Nombre d’appuis ajusté pour équilibrer les équipes avec l’effectif présent ; changer les appuis à chaque séquence.');
  if(belowRecommended)g.notes.push('Dimensions choisies en dessous du repère pédagogique : agrandir ou sélectionner une autre situation.');
  if(g.rotatingKeepers)g.notes.push(g.rotatingKeepers+' gardien(s) hors de l’opposition en rotation ; permuter au signal du coach ou à chaque séquence.');
  if(format.goalType==='full'&&g.material.gates)g.notes.push('Sans gardien pour chaque cible : '+g.material.gates+' but(s) remplacé(s) par des portes ; alterner les sens de jeu.');
  g.rotation=g.rotatingKeepers?'Tourner les gardiens à chaque séquence ; les gardiens hors jeu récupèrent les ballons depuis une zone protégée.':g.teams.neutral?'Changer les appuis à chaque séquence pour répartir les rôles.':template==='rondo'?'Permuter les défenseurs à la fin de chaque séquence, sans punition liée à une erreur.':'Inverser équipes, côtés ou fonctions à chaque séquence.';
  return g;
 });
 if(requestedGroups!==null&&requestedGroups!==groups.length)warnings.push('Le nombre d’ateliers demandé ne permet pas au moins deux joueurs par atelier : proposition limitée à '+groups.length+'.');
 if(groups.some(g=>g.players<format.min))warnings.push('Effectif par atelier inférieur au format conseillé ('+format.min+' à '+format.max+' joueurs) : choisir une autre fiche ou modifier le nombre d’ateliers.');
 if(groups.some(g=>g.players>format.max))warnings.push(organisation==='single'?'Le jeu unique dépasse le repère conseillé de '+format.max+' joueurs pour cette fiche. Vérifier le nombre de contacts avec le ballon et la lisibilité des rôles ; ajuster l’espace ou choisir un autre format si nécessaire.':'Effectif par atelier hors du format conseillé ('+format.min+' à '+format.max+' joueurs) : choisir une autre fiche ou modifier le nombre d’ateliers.');
 if(organisation==='stations'&&!Number.isInteger(options.groups))warnings.push('Nombre d’ateliers non renseigné : un atelier proposé. Choisir le nombre d’ateliers simultanés pour organiser le groupe.');
 if(format.requiresKeeper&&groups.some(g=>g.activeKeepers+g.fieldKeepers===0))warnings.push('Cet exercice nécessite un gardien dans chaque atelier. Réduire les ateliers simultanés ou choisir une autre fiche de relance si aucun gardien n’est présent.');
 if(format.neutrals>0&&groups.some(g=>g.teams.neutral===0))warnings.push('L’effectif de champ ne permet pas de conserver l’appui nécessaire à l’objectif : regrouper les ateliers ou sélectionner une autre fiche.');
 if(format.attackAdvantage&&groups.some(g=>g.teams.blue<=g.teams.red))warnings.push('L’effectif de champ ne permet pas la supériorité offensive prévue : revoir les groupes ou sélectionner une autre fiche.');
 if(groups.some(g=>!g.actorsFit))warnings.push('Pas assez de joueurs de champ dans les rôles nécessaires : au moins '+groups[0].minAttackers+' attaquant(s)/appui(s) et '+groups[0].minDefenders+' défenseur(s) par atelier. Les gardiens en rotation ne remplacent pas ces rôles ; regrouper les ateliers ou choisir une autre fiche.');
 if(groups.some(g=>g.teams.blue===0||g.teams.red===0)&&template!=='circuit'&&format.opposition!=='none')warnings.push('Ce groupe ne permet pas l’opposition prévue. Utiliser une situation technique sans opposition ou choisir une autre fiche.');
 if(!layout.fits)warnings.push('Installation impossible dans '+available.width+' × '+available.length+' m avec les dégagements : emprise requise '+layout.footprint.width+' × '+layout.footprint.length+' m. Réduire le nombre d’ateliers simultanés, alterner les groupes ou choisir une situation plus compacte.');
 if(groups.some(g=>g.width<g.recommendedMinimum.width||g.length<g.recommendedMinimum.length))warnings.push('Dimensions personnalisées trop serrées pour conserver l’intention de cette fiche ; agrandir ou choisir un format plus compact.');
 if(groups.some(g=>g.rotatingKeepers))warnings.push('Les gardiens supplémentaires sont comptés en rotation, jamais ajoutés aux joueurs en jeu.');
 if(groups.some(g=>g.circuitFits===false))warnings.push('Les circuits ne tiennent pas avec 6 × 6 m utiles par circuit et 3 m de séparation : agrandir la zone ou choisir plusieurs ateliers.');
 if(format.goalType==='full'&&format.goals>0&&keepers===0)warnings.push(template==='keeper'?'Sans gardien, cette fiche ne permet pas le travail spécifique annoncé. Choisir un exercice de jeu au pied ou prévoir un gardien.':'Sans gardien : les cibles deviennent des portes de cônes ; le travail de finition avec gardien n’est pas reproduit.');
 if(template==='keeper'&&groups.some(g=>g.activeKeepers===0))warnings.push('Chaque atelier de travail spécifique gardien nécessite un gardien actif : regrouper les joueurs, faire tourner les ateliers ou choisir un autre thème.');
 const totalMaterial={};groups.forEach(g=>{for(const [key,value] of Object.entries(g.material))if(Number.isFinite(value))totalMaterial[key]=(totalMaterial[key]||0)+value;});
 const oppositionFits=template==='circuit'||format.opposition==='none'||groups.every(g=>g.teams.blue>0&&g.teams.red>0);
 return {groups,footprint:layout.footprint,available,fits:layout.fits&&oppositionFits&&groups.every(g=>g.fits),surfaceFits:layout.fits,pedagogyFits:oppositionFits&&groups.every(g=>g.pedagogyFits),warnings,totalMaterial,totalPlayers:players,totalKeepers:keepers,organisation,knowledge,format,template,alternative:layout.fits?'':'Installer moins d’ateliers simultanés et organiser des rotations actives, ou choisir une fiche demandant moins de surface.'};
}
// Une séquence peut employer une partie du groupe sans inventer des partenaires ni
// transformer les gardiens écartés en joueurs de champ. Les dimensions ci-dessous
// restent celles de l'exercice ; l'espace disponible appartient toujours à la séance.
function bibleSequenceContext(exercise,session={},variant={},index=0){
 const errors=[],settings=variant.sequenceSettings;
 if(!Number.isInteger(index)||index<0||index>3)errors.push('Choisir une séquence entre 1 et 4.');
 if(settings!==undefined&&(!Array.isArray(settings)||settings.length>4))errors.push('Les réglages doivent décrire au maximum quatre séquences.');
 const rawSetting=Array.isArray(settings)?settings[index]:undefined;
 if(rawSetting!==undefined&&(!rawSetting||typeof rawSetting!=='object'||Array.isArray(rawSetting)))errors.push('Les réglages de cette séquence sont invalides.');
 const setting=rawSetting&&typeof rawSetting==='object'&&!Array.isArray(rawSetting)?rawSetting:{};
 const totalPlayers=Number.isInteger(session.players)?session.players:null,totalKeepers=Number.isInteger(session.keepers)?session.keepers:null;
 if(totalPlayers===null||totalPlayers<2||totalPlayers>80)errors.push('L’effectif présent doit comprendre entre 2 et 80 joueurs.');
 if(totalKeepers===null||totalKeepers<0||totalKeepers>Math.min(12,(totalPlayers??2)-2))errors.push('Le nombre de gardiens présents est invalide ; conserver au moins deux joueurs de champ.');
 const activePlayers=setting.players===undefined?totalPlayers:Number.isInteger(setting.players)?setting.players:null;
 const activeKeepers=setting.keepers===undefined?totalKeepers:Number.isInteger(setting.keepers)?setting.keepers:null;
 if(activePlayers===null||activePlayers<2||activePlayers>80)errors.push('Cette séquence doit réunir entre 2 et 80 joueurs, gardiens compris.');
 else if(totalPlayers!==null&&activePlayers>totalPlayers)errors.push('Cette séquence demande '+activePlayers+' joueurs alors que '+totalPlayers+' sont présents.');
 if(activeKeepers===null||activeKeepers<0||activeKeepers>12)errors.push('Le nombre de gardiens de cette séquence doit être compris entre 0 et 12.');
 else{
  if(totalKeepers!==null&&activeKeepers>totalKeepers)errors.push('Cette séquence demande '+activeKeepers+' gardien(s) alors que '+totalKeepers+' sont présents.');
  if(activePlayers!==null&&activeKeepers>activePlayers-2)errors.push('Conserver au moins deux joueurs de champ dans cette séquence.');
 }
 if(totalPlayers!==null&&totalKeepers!==null&&activePlayers!==null&&activeKeepers!==null&&activePlayers-activeKeepers>totalPlayers-totalKeepers)errors.push('Cette séquence demande plus de joueurs de champ que le groupe présent. Inclure les gardiens nécessaires ou réduire l’effectif actif.');
 const options={...variant};delete options.sequenceSettings;
 for(const key of ['width','length','organisation','groups'])if(setting[key]!==undefined)options[key]=setting[key];
 for(const [key,label,max] of [['width','La largeur',105],['length','La longueur',120]])if(options[key]!==undefined&&(!Number.isInteger(options[key])||options[key]<6||options[key]>max))errors.push(label+' de l’exercice doit être comprise entre 6 et '+max+' mètres.');
 if(options.organisation!==undefined&&!['single','auto','stations'].includes(options.organisation))errors.push('Choisir un jeu unique, une adaptation automatique ou plusieurs ateliers.');
 if(options.groups!==undefined&&(!Number.isInteger(options.groups)||options.groups<1||options.groups>40))errors.push('Choisir entre 1 et 40 ateliers simultanés.');
 const effectiveSession={...session,players:activePlayers,keepers:activeKeepers};
 const offPlayers=totalPlayers!==null&&activePlayers!==null?totalPlayers-activePlayers:null,offKeepers=totalKeepers!==null&&activeKeepers!==null?totalKeepers-activeKeepers:null;
 const offFieldPlayers=offPlayers!==null&&offKeepers!==null?offPlayers-offKeepers:null;
 if(errors.length)return {session:effectiveSession,options,plan:null,activePlayers,activeKeepers,offPlayers,offKeepers,offFieldPlayers,warnings:[],errors,valid:false,fits:false};
 const plan=biblePlan(exercise,effectiveSession,options),warnings=[...plan.warnings];
 if(offPlayers)warnings.push(offPlayers+' joueur'+(offPlayers>1?'s':'')+' hors de cette séquence : '+offFieldPlayers+' de champ et '+offKeepers+' gardien'+(offKeepers>1?'s':'')+'. Prévoir leur activité et les faire entrer à la séquence suivante ; ils restent comptés dans le groupe présent.');
 return {session:effectiveSession,options,plan,activePlayers,activeKeepers,offPlayers,offKeepers,offFieldPlayers,warnings,errors,valid:true,fits:plan.fits};
}
function bibleSequenceIntervals(seconds,profile){
 const count=seconds>profile.workSeconds*1.5?Math.max(2,Math.ceil((seconds+profile.restSeconds)/(profile.workSeconds+profile.restSeconds))):1;
 const rest=count>1?Math.min(profile.restSeconds,Math.max(0,Math.floor((seconds-count*30)/(count-1)))):0,available=seconds-rest*(count-1),base=Math.floor(available/count),remainder=available%count;
 return Array.from({length:count},(_,i)=>({workSeconds:base+(i<remainder?1:0),restSeconds:i<count-1?rest:0}));
}
function bibleTimeline(exercise,minutes,session={},options={}){
 const knowledge=bibleExerciseKnowledge(exercise),contents=Array.isArray(knowledge.sequences)?knowledge.sequences:[];
 const totalSeconds=Math.max(60,Math.round((Number.isFinite(minutes)?minutes:12)*60)),warnings=[];
 const learning=bibleExerciseLearning(exercise,session),nominalWork=learning.profile.workSeconds,nominalRest=learning.profile.restSeconds;
 const requestedCount=Number.isInteger(options.sequences)?Math.max(1,Math.min(4,options.sequences)):null;
 const count=requestedCount??Math.max(1,Math.min(contents.length||3,Math.round((totalSeconds+nominalRest)/(nominalWork+nominalRest)),4));
 let rest=count>1?Number.isInteger(options.restSeconds)?Math.max(0,Math.min(300,options.restSeconds)):nominalRest:0;
 const minimumWork=Math.min(30,Math.floor(totalSeconds/count));
 const maxRest=count>1?Math.max(0,Math.floor((totalSeconds-count*minimumWork)/(count-1))):0;
 if(rest>maxRest){rest=maxRest;warnings.push('Récupération réduite pour conserver le nombre de séquences dans la durée du bloc.');}
 const availableWork=totalSeconds-rest*(count-1),base=Math.floor(availableWork/count),remainder=availableWork%count;
 if(Number.isInteger(options.workSeconds)&&Math.abs(options.workSeconds*count+rest*(count-1)-totalSeconds)>0)warnings.push('Temps de travail réparti pour respecter exactement les '+minutes+' min du bloc ; modifier la durée du bloc pour conserver les temps saisis.');
 if(base<60)warnings.push('Séquences très courtes : vérifier que le format permet une observation utile.');
 const fallback=[{title:'Découvrir',rule:(exercise.rules||[])[0]||'Découvrir l’organisation à vitesse maîtrisée.',observe:(exercise.cues||[])[0]||'Observer les prises d’information.'},{title:'Faire évoluer',rule:exercise.harder||'Faire évoluer une seule contrainte après réussite.',observe:(exercise.cues||[])[1]||exercise.success||'Vérifier les décisions prises.'},{title:'Réinvestir',rule:'Retirer le bonus ou l’aide et retrouver le principe dans un jeu plus libre.',observe:exercise.success||'Observer si le principe apparaît sans rappel du coach.'}];
 let elapsed=0;
 const sequences=Array.from({length:count},(_,i)=>{
  const source=contents[i]||fallback[Math.min(i,fallback.length-1)],workSeconds=base+(i<remainder?1:0),restSeconds=i<count-1?rest:0;
  const intervals=['warm','cool'].includes(exercise.id)?[{workSeconds,restSeconds:0}]:bibleSequenceIntervals(workSeconds,learning.profile);
  const sequence={index:i+1,title:source.title||'Séquence '+(i+1),rule:(source.rule||'')+' '+learning.profile.focus,observe:source.observe||'',workSeconds,restSeconds,intervals,startSeconds:elapsed,endSeconds:elapsed+workSeconds};elapsed+=workSeconds+restSeconds;return sequence;
 });
 return {sequences,totalSeconds,workSeconds:availableWork,restSeconds:rest*(count-1),totalWorkSeconds:availableWork,totalRestSeconds:rest*(count-1),warnings,requested:{sequences:requestedCount,workSeconds:options.workSeconds,restSeconds:options.restSeconds}};
}
