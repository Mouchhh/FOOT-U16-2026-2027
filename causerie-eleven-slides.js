// Fixed eleven-slide deck inspired by the supplied club PDFs; no coaching text is invented.
(() => {
  const NAVY='09182A', BLUE='2855A2', RED='E41F28', WHITE='FFFFFF', MUTED='526780';
  const phases={defensive:{slide:6,title:'Animation Défensive',field:'defensive'},offDef:{slide:7,title:'Transition OFF / DEF',field:'transitionOffDef'},offensive:{slide:8,title:'Animation Offensive',field:'offensive'},defOff:{slide:9,title:'Transition DEF / OFF',field:'transitionDefOff'}};
  const fields={round:'Journée de championnat',venue:'Lieu du match',contextObjective:'Objectifs du contexte',contextDynamics:'Dynamique du groupe',opponentStrengths:'Forces adverses',opponentWeaknesses:'Faiblesses adverses',opponentAnimation:'Animation adverse',transitionOffDef:'Transition OFF / DEF · À la perte',transitionDefOff:'Transition DEF / OFF · À la récupération',setPiecesFor:'CPA offensifs',setPiecesAgainst:'CPA défensifs',closingMessage:'Mot d’ordre final'};
  const beforeValid=validMatchPreparation;
  validMatchPreparation=function(plan){return beforeValid(plan)&&(!plan||Object.keys(fields).every(k=>plan[k]===undefined||typeof plan[k]==='string'&&plan[k].length<=4000));};
  async function build(pptx,snapshot,style,{pitchImage}) {
    const board=snapshot.board,p=board.matchPreparation||{},S=pptx.ShapeType;
    const photos=window.causerieExportPhotos?await causerieExportPhotos.resolve(snapshot.photos):{};
    pptx.theme={headFontFace:'Montserrat',bodyFontFace:'Montserrat',lang:'fr-FR'};
    const slides=[],hosts=[];
    const text=(s,value,x,y,w,h,size=18,extra={})=>s.addText(value||'À compléter',{x,y,w,h,fontFace:'Montserrat',fontSize:size,color:NAVY,margin:0,valign:'top',fit:'shrink',breakLine:false,paraSpaceAfterPt:8,...extra});
    const rect=(s,x,y,w,h,color)=>s.addShape(S.rect,{x,y,w,h,line:{transparency:100},fill:{color}});
    function base(title,n,dark=false){
      const s=pptx.addSlide();slides.push(s);s.background={color:dark?NAVY:WHITE};
      const photo=photos[n];
      if(photo){
        if(dark){s.addImage({data:photo.portrait,x:8.9,y:0,w:4.433333,h:7.5});rect(s,8.85,0,.05,7.5,RED);}
        else s.addImage({data:photo.landscape,x:10.3,y:.35,w:2.4,h:1.3});
      }
      if(!dark){rect(s,.65,.55,.45,.045,RED);text(s,title,.65,.8,photo?9.2:11.9,.7,27,{bold:true});}
      text(s,'STADE MAYENNAIS',.65,7.06,8,.18,9,{color:dark?'BBC8DA':MUTED});
      text(s,String(n).padStart(2,'0')+' / 11',dark&&photo?7.1:11.65,7.06,1,.18,9,{align:'right',color:dark?'BBC8DA':MUTED});
      return s;
    }
    function card(s,title,value,x,y,w,h){rect(s,x,y,.025,h,RED);text(s,title,x+.18,y,w-.32,.38,15,{bold:true});text(s,value,x+.18,y+.62,w-.34,h-.7,18);}
    function notes(s,content){s.addNotes(content||'Aucune note complémentaire.');}
    let s=base('Infos match',1,true);
    text(s,p.title||'CAUSERIE D’AVANT-MATCH',.8,1.7,photos[1]?7.3:11.7,.45,14,{align:'center',color:RED,bold:true});
    text(s,p.match||board.title||[board.team,p.opponent?.split('\n')[0]].filter(Boolean).join(' / '),.8,2.5,photos[1]?7.3:11.7,1.3,34,{align:'center',bold:true,color:WHITE});
    const dateLabel=p.date?new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(p.date+'T12:00:00Z')):'';
    text(s,[p.round,dateLabel,p.venue].filter(Boolean).join(' · ')||'Date et lieu à renseigner',.8,4.15,photos[1]?7.3:11.7,.8,17,{align:'center',color:'BBC8DA'});rect(s,photos[1]?4:6.25,5.35,.8,.045,RED);
    notes(s,[...causerieExport.collect(board).map(field=>field.label+' : '+field.value),...Object.entries(fields).filter(([key])=>p[key]).map(([key,label])=>label+' : '+p[key])].join('\n\n'));
    s=base('La composition d’équipe',2);const image=await pitchImage({...board,benchVisible:true,lanes:false},true,{nameScale:1.8});
    s.addImage({data:image.data,x:.65,y:1.75,w:9,h:5.05});text(s,board.formation,10,1.8,2.5,.5,24,{bold:true,color:BLUE});
    text(s,'Impacteurs / Finisseurs',10,2.6,2.6,.7,16,{bold:true});text(s,board.players.filter(player=>player.role==='sub').map(player=>player.number+' · '+player.name).join('\n')||'Aucun remplaçant renseigné',10,3.4,2.6,3.1,16);
    notes(s,board.players.map(player=>(player.role==='sub'?'Impacteur / Finisseur':'Titulaire')+' · '+player.number+' · '+player.name).join('\n'));
    s=base('Le contexte',3);card(s,'Objectifs',p.contextObjective,.65,2,5.8,2.1);card(s,'Dynamique',p.contextDynamics,6.85,2,5.8,2.1);text(s,p.context,.85,4.7,11.6,1.8,20);notes(s,[p.contextObjective,p.contextDynamics,p.context].filter(Boolean).join('\n\n'));
    s=base('L’adversaire',4);text(s,p.opponent,.8,1.8,11.8,1.05,20,{bold:true});card(s,'Forces',p.opponentStrengths,.65,3.15,3.75,3.1);card(s,'Faiblesses',p.opponentWeaknesses,4.8,3.15,3.75,3.1);card(s,'Animation',p.opponentAnimation||board.opponents?.formation,8.95,3.15,3.75,3.1);notes(s,[p.opponent,p.opponentStrengths,p.opponentWeaknesses,p.opponentAnimation].filter(Boolean).join('\n\n'));
    s=base('Nos idées fortes',5);const goals=p.objectives||[];
    for(let i=0;i<3;i++)card(s,'AXE '+(i+1),i===2?goals.slice(2).filter(Boolean).join('\n'):goals[i],.65+i*4.15,2.3,3.75,3.8);
    notes(s,goals.join('\n'));
    for(const [key,phase] of Object.entries(phases)) {
      s=base(phase.title,phase.slide);
      const assigned=board.causerieSlideAnimations;
      const sequences=assigned ? assigned[key]||[] : key==='defensive'?snapshot.demonstrations?.sequences||[]:[];
      const media=key==='defensive'?snapshot.demonstrations?.media||[]:[];
      const choices=[...sequences.map(entry=>({entry})),...media.map(media=>({media}))];
      const body=p[phase.field]||'';
      if(!choices.length) {text(s,body,.85,1.95,11.6,4.7,22);text(s,'Aucune animation sélectionnée pour cette phase',.85,6.65,11,.2,10,{color:MUTED});}
      else {
        text(s,body,.75,1.9,3.2,4.8,17);
        const cols=choices.length===1?1:2, rows=Math.ceil(choices.length/cols),gap=.22,w=(8.1-gap*(cols-1))/cols,h=(4.95-gap*(rows-1))/rows;
        choices.forEach((choice,i)=>{
          const x=4.45+(i%cols)*(w+gap),y=1.85+Math.floor(i/cols)*(h+gap);
          text(s,choice.entry?.title||choice.media?.name,x,y,w,.35,choices.length>4?10:13,{bold:true});
          const available=Math.max(.1,h-.45),pw=Math.min(w,available*16/9),ph=pw*9/16;
          hosts.push({...choice,slide:s,box:{x:x+(w-pw)/2,y:y+.42,w:pw,h:ph}});
        });
      }
      if(choices.length) text(s,board.causerieAnimationVariant==='gif'?'Démonstrations animées · GIF':'Cliquer pour lancer les animations',4.45,6.8,8.1,.18,9,{color:MUTED});
      notes(s,[body,...sequences.map(entry=>entry.title)].join('\n\n'));
    }
    s=base('CPA · Coups de pied arrêtés',10);card(s,'Offensifs',p.setPiecesFor,.65,2,5.8,3.5);card(s,'Défensifs',p.setPiecesAgainst,6.85,2,5.8,3.5);
    if(p.specific)text(s,p.specific,.85,5.85,11.6,.85,14);
    notes(s,[p.setPiecesFor,p.setPiecesAgainst,p.specific].filter(Boolean).join('\n\n'));
    s=base('Fin de causerie',11,true);text(s,'ENSEMBLE',.8,1.5,photos[11]?7.3:11.7,.5,15,{align:'center',color:RED,bold:true});text(s,p.closingMessage,.8,2.6,photos[11]?7.3:11.7,2.8,35,{align:'center',color:WHITE,bold:true});rect(s,photos[11]?4:6.25,6,.8,.045,RED);
    notes(s,[p.closingMessage,board.notes].filter(Boolean).join('\n\n'));
    if(slides.length!==11)throw Error('La présentation doit comporter exactement 11 slides.');
    return causerieAnimations.append(pptx,{sequences:hosts.filter(h=>h.entry).map(h=>h.entry),media:hosts.filter(h=>h.media).map(h=>h.media)},{hosts,variant:board.causerieAnimationVariant||'native'});
  }
  window.causerieEleven={build,fields,phases};
})();
