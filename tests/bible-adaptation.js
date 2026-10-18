// Vérification du contrat commun fiche / terrain / PDF, sans navigateur ni réseau.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),context={};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'training-adaptation.js'),'utf8'),context);
const exercise={id:'test-rondo',kind:'possession',target:6,width:18,length:18,rules:['Trouver un partenaire libre.'],cues:['Observer avant de recevoir.'],success:'Deux solutions visibles.',harder:'Presser avec un défenseur de plus.'};
context.bibleKnowledge={
 'test-rondo':{template:'rondo',format:{min:3,max:9,ideal:6,neutrals:0,keeperMode:'feet',goals:0,goalType:'gate',zones:1},sequences:[{title:'Angles',rule:'Touches libres.',observe:'Deux angles ouverts.'},{title:'Pression',rule:'Le défenseur presse immédiatement.',observe:'Soutien après la passe.'},{title:'Transfert',rule:'Retirer le bonus.',observe:'Le soutien se maintient.'}]},
 'test-game':{template:'endzones',format:{min:4,max:14,ideal:10,neutrals:1,keeperMode:'goals',goals:2,goalType:'full',zones:3},sequences:[]},
 'test-keeper':{template:'keeper',format:{min:3,max:8,ideal:5,neutrals:0,keeperMode:'single',goals:1,goalType:'full',zones:1},sequences:[]},
 'test-four':{template:'four-goals',format:{min:4,max:12,ideal:8,neutrals:0,keeperMode:'feet',goals:4,goalType:'mini',zones:2},sequences:[]}
};
const base={space:'half',players:14,keepers:2,age:16,level:'developing'};
function plan(ex=exercise,s={},options={}){return context.biblePlan(ex,{...base,...s},options);}
function audit(p,n,gk){
 assert.equal(p.groups.reduce((sum,g)=>sum+g.players,0),n,'Chaque présent est affecté exactement une fois');
 assert.equal(p.groups.reduce((sum,g)=>sum+g.keepers,0),gk,'Tous les gardiens sont répartis');
 for(const g of p.groups){
  assert.equal(g.teams.blue+g.teams.red+g.teams.neutral+g.activeKeepers+g.rotatingKeepers,g.players,'Les rôles décrivent exactement l’atelier');
  assert.equal(g.fieldKeepers+g.activeKeepers+g.rotatingKeepers,g.keepers,'Gardien actif, au pied ou en rotation, jamais deux fois');
  assert.equal(g.keeperSlots.length,g.fieldKeepers);
  assert.equal(g.material.bibsBlue+g.material.bibsRed+g.material.bibsNeutral+g.material.bibsKeeper,g.players,'Une chasuble par personne, rotations comprises');
  assert.equal(g.material.activeBalls+g.material.reserveBalls,g.material.balls);
  assert.equal(g.material.cones,g.material.gates*2+g.material.circuitCones,'Les portes possèdent exactement deux cônes');
  const axis=g.format.zoneAxis==='width'?'width':'length';
  assert.ok(Math.abs(g.zoneDimensions.reduce((sum,z)=>sum+z[axis],0)-g[axis])<.001,'Les zones remplissent exactement la dimension choisie');
  assert.equal(g.material.discs,4+2*(g.format.zones-1),'Chaque séparation possède deux coupelles');
  assert.ok(g.width>=6&&g.length>=6);
 }
 if(p.fits){
  assert.ok(p.footprint.width<=p.available.width&&p.footprint.length<=p.available.length,'Une installation annoncée possible tient réellement dans la surface');
  assert.ok(p.footprint.gap>=2&&p.footprint.margin>=2,'Dégagements explicites');
  for(let a=0;a<p.groups.length;a++)for(let b=a+1;b<p.groups.length;b++){
   const x=p.groups[a],y=p.groups[b],rot=p.footprint.rotated;
   const wx=rot?x.length:x.width,lx=rot?x.width:x.length,wy=rot?y.length:y.width,ly=rot?y.width:y.length;
   assert.ok(x.layout.x+wx+p.footprint.gap<=y.layout.x||y.layout.x+wy+p.footprint.gap<=x.layout.x||x.layout.y+lx+p.footprint.gap<=y.layout.y||y.layout.y+ly+p.footprint.gap<=x.layout.y,'Les ateliers n’empiètent pas les uns sur les autres');
  }
 }
}
// Petits et grands groupes, nombres impairs et gardiens répartis sur tous les ateliers.
for(const n of [2,3,5,9,14,17,27,40,61,80])for(const gk of [0,1,Math.min(12,n-2)])for(const space of ['small','quarter','half','full'])audit(plan(exercise,{players:n,keepers:gk,space}),n,gk);
const game={...exercise,id:'test-game',kind:'game',target:10,width:32,length:40};
for(const n of [4,7,14,40,80])for(const gk of [0,1,Math.min(12,n-2)])audit(plan(game,{players:n,keepers:gk,space:'full'}),n,gk);
const rotated=plan(game,{players:10,keepers:2,spaceWidth:46,spaceLength:38},{width:30,length:40,groups:1});
assert.equal(rotated.fits,true);assert.equal(rotated.footprint.rotated,true,'Le plan sait tourner une installation sans modifier les dimensions de l’exercice');
const tooSmall=plan(game,{players:10,keepers:2,spaceWidth:8,spaceLength:8},{width:30,length:40,groups:1});
assert.equal(tooSmall.fits,false);assert.ok(tooSmall.warnings.some(w=>w.includes('Installation impossible')));assert.equal(tooSmall.groups[0].width,30,'Une dimension explicite impossible n’est pas réduite silencieusement');
const crowded=plan(game,{players:14,keepers:2,spaceWidth:68,spaceLength:105},{width:6,length:6,groups:1});
assert.equal(crowded.fits,false);assert.ok(crowded.warnings.some(w=>w.includes('trop serrées')));
const extras=plan(game,{players:14,keepers:6},{groups:1});audit(extras,14,6);assert.equal(extras.groups[0].activeKeepers,2);assert.equal(extras.groups[0].rotatingKeepers,4);assert.equal(extras.groups[0].material.goals,2);
const noKeeper=plan(game,{players:10,keepers:0},{groups:1});assert.equal(noKeeper.groups[0].material.goals,0);assert.equal(noKeeper.groups[0].material.gates,2);assert.equal(noKeeper.groups[0].material.cones,4);
const keeper={...game,id:'test-keeper'};assert.equal(plan(keeper,{players:5,keepers:0}).pedagogyFits,false,'Sans gardien une fiche spécifique gardien est signalée inadaptée');
const four=plan({...game,id:'test-four'},{players:9,keepers:1},{groups:1});audit(four,9,1);assert.equal(four.groups[0].material.miniGoals,4);assert.equal(four.groups[0].material.goals,0);assert.equal(four.groups[0].material.gates,0);
context.bibleKnowledge['test-unopposed']={template:'finish',format:{min:3,max:10,ideal:6,neutrals:0,keeperMode:'single',goals:1,goalType:'full',zones:1,opposition:'none'}};
const unopposed=plan({...game,id:'test-unopposed'},{players:6,keepers:1},{groups:1});audit(unopposed,6,1);assert.equal(unopposed.fits,true);assert.equal(unopposed.groups[0].teams.blue,5);assert.equal(unopposed.groups[0].teams.red,0,'Un atelier sans opposition n’invente pas de défenseur');
context.bibleKnowledge['test-overload']={template:'build',format:{min:4,max:12,ideal:8,neutrals:0,keeperMode:'single',goals:1,goalType:'full',zones:3,zoneAxis:'width',zoneLabels:['Gauche','Axe','Droite'],attackAdvantage:1}};
const overload=plan({...game,id:'test-overload'},{players:8,keepers:1},{groups:1});audit(overload,8,1);assert.equal(overload.groups[0].teams.blue,4);assert.equal(overload.groups[0].teams.red,3);assert.equal(overload.groups[0].zoneDimensions[1].name,'Axe');
context.bibleKnowledge['test-neutral']={template:'possession',format:{min:5,max:14,ideal:10,neutrals:1,keeperMode:'feet',goals:0,goalType:'gate',zones:1}};
const neutralPlan=plan({...game,id:'test-neutral',kind:'possession'},{players:12,keepers:0},{groups:1});audit(neutralPlan,12,0);assert.equal(neutralPlan.groups[0].teams.neutral,2,'Un effectif pair ne supprime jamais le joker demandé par l’objectif');assert.equal(neutralPlan.groups[0].teams.blue,neutralPlan.groups[0].teams.red);
context.bibleKnowledge['test-balanced']={template:'possession',format:{min:4,max:12,ideal:8,neutrals:0,keeperMode:'feet',goals:0,goalType:'gate',zones:1}};
const balanced=plan({...game,id:'test-balanced',kind:'possession'},{players:8,keepers:0},{groups:1});assert.equal(balanced.groups[0].teams.blue,4);assert.equal(balanced.groups[0].teams.red,4,'Une transition en possession repart à équipes équilibrées, pas avec les 2 défenseurs du rondo');
context.bibleKnowledge['test-keeper-start']={template:'build',format:{min:4,max:10,ideal:6,neutrals:0,requiresKeeper:true,keeperMode:'single',goals:1,goalType:'full',zones:1}};
const keeperStart=plan({...game,id:'test-keeper-start',target:6,width:28,length:24},{players:40,keepers:4,space:'full'});audit(keeperStart,40,4);assert.equal(keeperStart.fits,true);assert.equal(keeperStart.groups.length,4,'Un départ spécifique gardien ne crée pas six ateliers pour seulement quatre gardiens');assert.ok(keeperStart.groups.every(g=>g.activeKeepers===1));
const keeperAbsent=plan({...game,id:'test-keeper-start'},{players:14,keepers:0});assert.equal(keeperAbsent.fits,false);assert.ok(keeperAbsent.warnings.some(w=>w.includes('gardien dans chaque atelier')));
context.bibleKnowledge['test-keeper-foot-start']={template:'build',format:{min:4,max:10,ideal:6,neutrals:0,requiresKeeper:true,keeperMode:'feet',goals:2,goalType:'gate',zones:1}};
const keeperFootStart=plan({...game,id:'test-keeper-foot-start',target:6,width:28,length:24},{players:40,keepers:4,space:'full'});audit(keeperFootStart,40,4);assert.equal(keeperFootStart.groups.length,4);assert.ok(keeperFootStart.groups.every(g=>g.fieldKeepers===1));assert.equal(keeperFootStart.fits,true);
const finishInsufficient=plan({...game,id:'test-unopposed'},{players:3,keepers:2},{groups:1});assert.equal(finishInsufficient.fits,false,'Un gardien en rotation ne tient pas le rôle du passeur manquant');assert.ok(finishInsufficient.warnings.some(w=>w.includes('joueurs de champ')));
context.bibleKnowledge['test-corner']={template:'corner',format:{min:6,max:14,ideal:10,neutrals:0,keeperMode:'single',goals:1,goalType:'full',zones:1}};
const cornerInsufficient=plan({...game,id:'test-corner',kind:'cpa'},{players:6,keepers:4},{groups:1});assert.equal(cornerInsufficient.fits,false,'Le total présents ne masque pas un manque de livreur et de receveurs');
const excessiveGroups=plan(exercise,{players:5,keepers:1},{groups:40});assert.equal(excessiveGroups.groups.length,2);assert.equal(excessiveGroups.fits,false);assert.ok(excessiveGroups.warnings.length);
const immutableSession={...base},immutableOptions={groups:2},before=JSON.stringify([exercise,immutableSession,immutableOptions]);context.biblePlan(exercise,immutableSession,immutableOptions);assert.equal(JSON.stringify([exercise,immutableSession,immutableOptions]),before,'Le calcul ne modifie pas le groupe ou le brouillon du coach');
// Une durée de bloc reste exacte, y compris avec un nombre de séquences et un repos choisis.
for(const minutes of [1,2,5,8,12,17,30,120])for(const options of [{},{sequences:1},{sequences:4,workSeconds:180,restSeconds:60},{sequences:3,restSeconds:300}]){
 const t=context.bibleTimeline(exercise,minutes,base,options);
 assert.equal(t.totalSeconds,minutes*60);
 assert.equal(t.sequences.reduce((sum,s)=>sum+s.workSeconds+s.restSeconds,0),minutes*60,'Travail et récupérations occupent exactement le bloc');
 assert.equal(t.sequences.at(-1).restSeconds,0,'Aucun repos ajouté après la dernière séquence');
 assert.equal(t.sequences[0].startSeconds,0);
 assert.equal(t.sequences.at(-1).endSeconds,minutes*60);
 for(let i=1;i<t.sequences.length;i++)assert.equal(t.sequences[i].startSeconds,t.sequences[i-1].endSeconds+t.sequences[i-1].restSeconds);
 assert.ok(t.sequences.every(s=>s.workSeconds>0&&s.rule&&s.observe));
}
const progression=context.bibleTimeline(exercise,12,base,{sequences:3,restSeconds:60});
assert.equal(progression.sequences[1].title,'Pression');assert.equal(progression.sequences[1].rule,'Le défenseur presse immédiatement.');assert.equal(progression.totalWorkSeconds,600);assert.equal(progression.totalRestSeconds,120);
assert.deepEqual(JSON.parse(JSON.stringify(context.bibleAvailable({space:'custom',spaceWidth:21,spaceLength:37}))),{width:21,length:37});
// Les contraintes de rôle des vraies fiches doivent rester reliées au moteur.
const catalogueContext={};vm.createContext(catalogueContext);
vm.runInContext(['training-data.js','training-knowledge.js','training-adaptation.js'].map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n')+'\nglobalThis.exercises=trainingExercises;',catalogueContext);
const realPlan=(id,players,keepers)=>catalogueContext.biblePlan(catalogueContext.exercises.find(e=>e.id===id),{players,keepers,space:'full',age:17,level:'developing'});
for(const id of ['keeper-feet','defend-cross','keeper-distribute'])assert.equal(realPlan(id,14,0).fits,false,id+' exige le gardien annoncé dans ses consignes');
const keeperForty=realPlan('keeper-feet',40,4);assert.equal(keeperForty.fits,true);assert.ok(keeperForty.groups.every(g=>g.activeKeepers>=1));assert.equal(keeperForty.groups.length,4);
for(const id of ['touch','throw-progression']){assert.equal(realPlan(id,4,0).fits,false,'Une touche avec trois solutions a besoin du lanceur et de trois partenaires');const p=realPlan(id,8,0);assert.equal(p.fits,true);assert.ok(p.groups.every(g=>g.teams.blue+g.teams.neutral>=4));}
vm.runInContext(fs.readFileSync(path.join(root,'training.js'),'utf8').split('let currentTraining=')[0]+'\n'+fs.readFileSync(path.join(root,'local-coach-rules.js'),'utf8'),catalogueContext);
for(const keepers of [0,1]){
 const session={version:1,id:'regression-cpa',updatedAt:'',team:'Club',category:'U16',date:'2026-10-18',time:'18:30',duration:90,players:7,keepers,age:16,level:'developing',context:'District',space:'half',themes:['CPA'],notes:'',blocks:[]};
 const proposal=catalogueContext.localCoachPlan(session);
 assert.equal(proposal.blocks.reduce((sum,b)=>sum+b.duration,0),90);
 for(const block of proposal.blocks)assert.equal(catalogueContext.biblePlan(catalogueContext.exercises.find(e=>e.id===block.exerciseId),session).fits,true,'Le générateur ne remplace pas un corner compatible par une touche à quatre acteurs offensifs impossible');
}
console.log('Bible adaptation : effectifs, rôles, matériel, surfaces, sécurité et séquences vérifiés.');
