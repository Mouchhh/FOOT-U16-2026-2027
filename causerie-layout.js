// Presentation flow: preserve authored text, group related information, skip inherited copies.
(() => {
 const BLUE='214FA0',WHITE='FFFFFF';
 const metadata=[['team','Équipe'],['category','Catégorie'],['section','Section'],['squad','Groupe'],['matchDuration','Durée du match'],['formation','Formation']];
 function analyze(snapshot,includeLinked){
  const boards=[snapshot.board];if(includeLinked&&snapshot.linked)boards.push(snapshot.linked);
  const main=snapshot.board;
  return boards.map((board,index)=>{
   function field(path,label,value){
    if(typeof value!=='string'||!value.length)return null;
    const original=path.split('.').reduce((value,key)=>value?.[key],main);
    if(index&&original===value)return null;
    return {key:'board.'+index+'.'+path,label,value};
   }
   const title=field('title','Document',board.title),meta=metadata.map(([key,label])=>field(key,label,board[key])).filter(Boolean);
   const match=board.matchPreparation||{};
   const repères=['date','title','match'].map(key=>field('matchPreparation.'+key,matchPlanFields[key],match[key])).filter(Boolean);
   const context=['context','opponent'].map(key=>field('matchPreparation.'+key,matchPlanFields[key],match[key])).filter(Boolean);
   const goals=(match.objectives||[]).map((value,i)=>field('matchPreparation.objectives.'+i,'Idée forte '+(i+1),value)).filter(Boolean);
   const tactics=['defensive','offensive','specific'].map(key=>field('matchPreparation.'+key,matchPlanFields[key],match[key])).filter(Boolean);
   const notes=field('notes','Spécificités / compléments · consignes',board.notes);
   const specific=tactics.find(item=>item.key.endsWith('.specific'));
   if(notes&&specific?.value===notes.value)specific.aliases=[notes.key];
   else if(notes)tactics.push(notes);
   const players=board.players.map((player,i)=>{
    const same=index&&main.players.some(p=>p.id===player.id&&p.name===player.name&&p.number===player.number&&(p.role==='sub')===(player.role==='sub'));
    return same?null:{player,name:{key:'board.'+index+'.players.'+i+'.name',label:'Joueur',value:player.name}};
   }).filter(Boolean);
   const opponent=board.opponents;
   if(opponent)for(const [key,label] of [['name','Adversaire'],['formation','Système adverse']]){
    if(key==='name'&&opponent.name==='Adversaires')continue;
    const item=field('opponents.'+key,label,opponent[key]);if(item)meta.push(item);
   }
   const opponentNames=(opponent?.players||[]).map((player,i)=>field('opponents.players.'+i+'.name','N° '+player.number,player.name)).filter(Boolean);
   return {board,index,title,meta,repères,context,goals,tactics,players,opponentNames};
  });
 }
 async function build(pptx,snapshot,includeLinked,style,{textPages,pitchImage}){
  const plans=analyze(snapshot,includeLinked),images=await Promise.all(plans.map(plan=>pitchImage(plan.board,true))),shape=pptx.ShapeType;
  let pageNumber=0;
  function rect(s,x,y,w,h,color){s.addShape(shape.rect,{x,y,w,h,line:{transparency:100},fill:{color}});}
  function text(s,value,x,y,w,h,size=20,options={}){s.addText(value,{x,y,w,h,fontFace:'Calistoga',fontSize:size,color:BLUE,margin:0,fit:'shrink',breakLine:false,paraSpaceAfterPt:0,lineSpacingMultiple:1.15,...options});}
  function raw(s,field,x,y,w,h,size=20,options={}){text(s,field.value,x,y,w,h,size,{objectName:'causerie:'+[field.key,...(field.aliases||[])].join('|'),...options});}
  function heading(s,title,reverse=false){
   rect(s,.45,.38,.65,.07,reverse?WHITE:BLUE);
   text(s,title,.45,.62,12.3,.65,title.length>40?25:29,{fontFace:'Montserrat',bold:true,italic:true,color:reverse?WHITE:BLUE});
  }
  function footer(s,scope,reverse=false,x=.45,whiteNumber=reverse){
   text(s,scope,x,7.15,12.1-x,.16,9,{color:reverse?'DDE7F7':'526780'});
   text(s,String(++pageNumber),12.4,7.15,.45,.16,9,{color:whiteNumber?WHITE:BLUE,align:'right'});
  }
  function plain(title,scope,reverse=false){const s=pptx.addSlide();s.background={color:reverse?BLUE:WHITE};heading(s,title,reverse);footer(s,scope,reverse);return s;}
  function paginated(field,scope,{firstMaster=null,firstX=6.25,firstWidth=6.6,firstSize=19,reverse=false}={}){
   const first=textPages(field.value,{fontSize:firstSize,width:firstMaster?firstWidth:12.1,maxRows:14});
   const chunks=firstMaster?[first[0],...textPages(first.slice(1).join(''),{fontSize:21,width:12.1,maxRows:14})]:first;
   let firstSlide=null;
   chunks.forEach((value,index)=>{
    const title=field.label+(chunks.length>1?' · '+(index+1)+' / '+chunks.length:'');
    if(index===0&&firstMaster){
     const s=pptx.addSlide({masterName:firstMaster});
     text(s,title,firstX,.3,firstWidth,.9,title.length>38?24:28,{fontFace:'Montserrat',bold:true,italic:true,underline:true});
     footer(s,scope,false,firstX,firstX<1);raw(s,{...field,value},firstX,1.55,firstWidth,5.3,firstSize);firstSlide=s;
    }else{
     const s=plain(title,scope,reverse);raw(s,{...field,value},.6,1.65,12.1,5.25,firstMaster?21:firstSize,{color:reverse?WHITE:BLUE});
    }
   });
   return firstSlide;
  }
  // The same pitch is stored in a master once, rather than copied into every text continuation.
  function tacticMaster(index,reversed=false){
   const title='TACTIC_'+index+(reversed?'_RIGHT':'_LEFT'),x=reversed?7.6:0;
   pptx.defineSlideMaster({title,background:{color:WHITE},objects:[
    {rect:{x,y:0,w:5.733333,h:7.5,line:{transparency:100},fill:{color:BLUE}}},
    {image:{data:images[index].data,x:x+.2,y:1.75,w:5.33,h:3}},
    {text:{text:index?'Vue épurée liée':'Terrain de la composition',options:{x:x+.25,y:4.9,w:5.23,h:.25,fontFace:'Montserrat',italic:true,fontSize:10,color:WHITE,align:'center',margin:0}}}
   ]});return title;
  }
  pptx.defineSlideMaster({title:'CLUB_COMPLEMENTS',background:{color:WHITE},objects:[
   {image:{data:style.decor,x:0,y:0,w:6.24,h:7.5}},
   {image:{data:style.chevrons,x:4.1,y:.36,w:2.2,h:.7}}
  ]});
  function twoCards(fields,title,scope){
   if(!fields.length)return;
   if(fields.length>2&&fields.every(field=>field.value.length<=100&&field.value.split('\n').length<=2)){
    for(let start=0;start<fields.length;start+=12){
     const s=plain(title+(fields.length>12?' · '+(Math.floor(start/12)+1):''),scope);
     fields.slice(start,start+12).forEach((field,i)=>{
      const x=.6+(i%2)*6.3,y=1.65+Math.floor(i/2)*.82;
      text(s,field.label,x,y,5.8,.22,12,{fontFace:'Montserrat',bold:true,italic:true});raw(s,field,x,y+.3,5.8,.4,19);
     });
    }
    return;
   }
   if(fields.length>2||fields.some(field=>field.value.length>250||field.value.split('\n').length>8)){
    fields.forEach(field=>paginated(field,scope,{firstSize:22}));return;
   }
   const s=plain(fields.length===1?fields[0].label:title,scope);
   fields.forEach((field,i)=>{
    const w=fields.length===1?12.1:5.85,x=.55+i*6.38;
    rect(s,x,1.65,w,.045,BLUE);if(fields.length>1)text(s,field.label,x,1.9,w,.5,17,{fontFace:'Montserrat',bold:true,italic:true});
    raw(s,field,x,2.7,w,3.8,field.value.length>150?20:24);
   });
  }
  function goals(fields,scope){
   if(!fields.length)return;
   const compact=fields.every(field=>field.value.length<=100&&textPages(field.value,{fontSize:25,width:5.7,maxRows:3}).length===1);
   if(!compact){fields.forEach(field=>paginated(field,scope,{firstSize:22,reverse:true}));return;}
   const s=plain('Objectif du jour / idées fortes',scope,true);
   fields.forEach((field,i)=>{
    const x=.65+(i%2)*6.35,y=1.7+Math.floor(i/2)*2.55,w=5.7;
    text(s,field.label,x,y,w,.3,14,{fontFace:'Montserrat',bold:true,italic:true,color:'DDE7F7'});
    rect(s,x,y+.48,.5,.04,WHITE);raw(s,field,x,y+.8,w,1.35,25,{color:WHITE});
   });
  }
  function roster(s,rows,x,y,w){
   rows.forEach((row,i)=>{
    if(row.heading)text(s,row.heading,x,y+i*.25,w,.23,11,{fontFace:'Montserrat',bold:true,italic:true});
    else{
     text(s,String(row.player.number),x,y+i*.25,.35,.23,13);
     raw(s,row.name,x+.45,y+i*.25,w-.45,.23,15);
    }
   });
  }
  function compactRoster(s,rows,x){
   rows.forEach((row,i)=>{
    const column=Math.floor(i/11),y=5.28+(i%11)*.16,left=x+column*2.65;
    if(row.heading)text(s,row.heading,left,y,2.5,.15,9,{fontFace:'Montserrat',bold:true,italic:true,color:WHITE});
    else{
     text(s,String(row.player.number),left,y,.27,.15,9,{color:WHITE});
     raw(s,row.name,left+.3,y,2.2,.15,10,{color:WHITE});
    }
   });
  }
  for(const plan of plans){
   const {board,index}=plan,scope=index?'Vue épurée liée':'Préparation du match';
   if(index===0){
    const cover=pptx.addSlide();cover.background={color:WHITE};
    cover.addImage({data:style.photo,x:.4,y:0,w:4.65,h:7.5});rect(cover,0,0,.4,7.5,BLUE);rect(cover,5.05,0,1,7.5,BLUE);rect(cover,5.8,1.9,7.533333,3.75,BLUE);
    const logo=board.clubLogo||style.logo;let lw=style.logoWidth,lh=style.logoHeight;
    if(board.clubLogo){const image=new Image();image.src=logo;try{await image.decode();lw=image.naturalWidth;lh=image.naturalHeight;}catch{throw Error('Le logo de votre équipe ne peut pas être lu. Vérifiez-le avant de réessayer.');}}
    const scale=Math.min(1.8/lw,1.65/lh);cover.addImage({data:logo,x:11.35+(1.8-lw*scale)/2,y:.12+(1.65-lh*scale)/2,w:lw*scale,h:lh*scale});
    if(plan.title)raw(cover,plan.title,6.35,2.35,6.45,1.35,29,{color:WHITE,align:'center',valign:'mid'});
    else text(cover,'Causerie',6.35,2.35,6.45,1.35,30,{color:WHITE,align:'center'});
    const coverFields=plan.repères.filter(field=>field.value.length<110&&field.value.split('\n').length<=2);
    coverFields.forEach((field,i)=>raw(cover,field,6.35,3.9+i*.48,6.45,.44,18,{color:WHITE,align:'center'}));
    plan.meta.forEach((field,i)=>{
     const x=6.35+(i%2)*3.3,y=5.95+Math.floor(i/2)*.26;
     text(cover,field.label,x,y,.92,.22,8,{fontFace:'Montserrat',italic:true});raw(cover,field,x+.96,y,2.2,.22,11);
    });
    pageNumber++;plan.repères.filter(field=>!coverFields.includes(field)).forEach(field=>paginated(field,scope));
   }
   const rows=[],named=plan.players.filter(({player})=>player.role==='sub'||(player.name&&!/^Joueur \d+$/.test(player.name)));
   for(const [sub,label] of [[false,'Sur le terrain'],[true,'Impacteurs / Finisseurs']]){
    const selected=named.filter(({player})=>(player.role==='sub')===sub);
    if(selected.length)rows.push({heading:label},...selected);
   }
   let rosterWritten=false;
   if(index){
    const different=images[index].data!==images[0].data;
    if(different||plan.title||plan.players.length){
     const s=plain('Lecture du plan de jeu',scope);
     if(plan.title)raw(s,plan.title,.6,1.5,12.1,.55,22);
     const note=plan.tactics.find(field=>field.key.endsWith('.notes')&&field.value.length<=320&&field.value.split('\n').length<=10);
     s.addImage({data:images[index].data,x:.5,y:2.05,w:7.15,h:4.021875});
     if(note){raw(s,note,8,2.05,4.7,4.6,20);plan.tactics=plan.tactics.filter(field=>field!==note);}
     if(rows.length&&!note){roster(s,rows.slice(0,22),8,2.05,4.7);rosterWritten=true;}
    }
    twoCards([...plan.meta,...plan.repères],'Repères du plan',scope);
   }
   twoCards(plan.context,'Contexte du match & adversaire',scope);
   if(plan.opponentNames.length)twoCards(plan.opponentNames,'Repères adverses',scope);
   goals(plan.goals,scope);
   for(const field of plan.tactics.filter(field=>/\.(defensive|offensive)$/.test(field.key))){
    const defensive=field.key.endsWith('.defensive'),offensive=field.key.endsWith('.offensive');
    if(defensive||offensive){
     const master=tacticMaster(index,offensive);
     const first=paginated(field,scope,{firstMaster:master,firstX:offensive?.55:6.2,firstWidth:offensive?6.7:6.6,firstSize:19});
     if(!rosterWritten&&rows.length){compactRoster(first,rows.slice(0,22),offensive?7.85:.3);rosterWritten=true;}
    }
   }
   const extras=plan.tactics.filter(field=>!/\.(defensive|offensive)$/.test(field.key));
   if(extras.length===2&&extras.every(field=>field.value.length<=250&&field.value.split('\n').length<=8)){
    twoCards(extras.map(field=>({...field,label:field.key.endsWith('.notes')?'Autres consignes':'Plan de jeu'})),'Spécificités / compléments du plan de jeu',scope);
   }else for(const field of extras){
    const short=field.value.length<=320&&field.value.split('\n').length<=10;
    paginated(field,scope,{firstMaster:short?'CLUB_COMPLEMENTS':null,firstSize:short?24:20});
   }
   // A pitch is an illustration of the printed sections, not a mandatory opening chapter.
   // Only add a standalone overview when there was no defensive/offensive illustration.
   const hasPhase=plan.tactics.some(field=>/\.(defensive|offensive)$/.test(field.key));
   const standard=typeof layouts!=='undefined'?layouts[board.formation]:null;
   const shifted=standard&&board.players.filter(p=>p.role!=='sub').some((p,i)=>standard[i]&&(Math.abs(p.x-standard[i][0])>.1||Math.abs(p.y-standard[i][1])>.1));
   const meaningful=!!named.length||board.arrows.length||board.opponents?.visible||board.formation!=='4-3-3'||shifted;
   if(!index&&!hasPhase&&meaningful){
    const s=plain('Le terrain et les joueurs',scope);s.addImage({data:images[index].data,x:.4,y:1.25,w:8.1,h:4.55625});
    rect(s,8.8,1.25,.025,5.65,'DCE4F0');roster(s,rows.slice(0,22),9.05,1.25,3.7);rosterWritten=true;
   }
   const overflow=rosterWritten?rows.slice(22):rows;
   if(overflow.length){
    const extra=plain('Joueurs disponibles',scope);
    overflow.forEach((row,i)=>roster(extra,[row],.6+(i%2)*6.3,1.75+Math.floor(i/2)*.4,5.8));
   }
  }
  return pptx;
 }
 window.causerieLayout={analyze,build};
})();
