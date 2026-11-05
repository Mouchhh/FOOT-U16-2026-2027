// Personal images stay in this browser's export staging area, never in club documents.
document.addEventListener('DOMContentLoaded',()=>{
  const club=[['celebration-equipe','Célébration de l’équipe'],['celebration-jeunes','Célébration des jeunes'],['cercle-equipe','Rassemblement'],['groupe-piste','Groupe sur la piste'],['groupe-rouge','Groupe du club'],['action-ballon','Action avec ballon'],['atelier-entrainement','Entraînement'],['course-match','Course en match'],['duel-match','Duel'],['echange-joueurs','Échange entre joueurs'],['encadrement','Encadrement'],['entree-terrain','Entrée sur le terrain']].map(([id,name])=>({id:'club:'+id,name,url:'assets/photos/'+id+'.jpg',personal:false}));
  const sessions=new Map();let generation=0,opened='';
  const key=()=>activeCoach.id+':'+activeCoachTeam.id+':'+getCompositionBoard().documentId;
  function current(){const k=key();if(!sessions.has(k))sessions.set(k,{items:[],choices:{1:club[0].id,11:'club:cercle-equipe'}});return sessions.get(k);}
  const panel=el('section','causerie-photo-export');panel.id='causerie-photo-export';panel.hidden=true;
  panel.append(el('h3','','Photos du PowerPoint'),el('p','hint','Photos du club ou photos personnelles, sans changer les 11 slides. Couverture et conclusion : colonne photo. Autres slides : encart en haut à droite. Les photos personnelles sont réservées à cet export.'));
  const fileLabel=el('label','report-field','Ajouter mes photos'),files=el('input');files.type='file';files.accept='image/jpeg,image/png,image/webp';files.multiple=true;files.setAttribute('aria-label','Ajouter mes photos au PowerPoint');fileLabel.append(files);panel.append(fileLabel);
  const rows=el('div','causerie-photo-rows'),status=el('p','hint');status.setAttribute('role','status');
  const actions=el('div','report-actions'),download=el('button','primary','Télécharger les 11 slides'),close=el('button','export','Annuler');download.type=close.type='button';actions.append(download,close);panel.append(rows,status,actions);document.querySelector('.causerie-direct-actions').after(panel);
  const titles=['Infos match','Composition','Contexte','Adversaire','Nos idées fortes','Animation Défensive','Transition OFF / DEF','Animation Offensive','Transition DEF / OFF','CPA','Fin de causerie'];
  function sources(){return [...club,...current().items];}
  function paint(){
    rows.replaceChildren();const state=current(),options=sources();
    titles.forEach((title,index)=>{
      const n=index+1,row=el('div','causerie-photo-row'),label=el('label','report-field','Slide '+n+' · '+title),select=el('select'),image=el('img');
      image.alt='Aperçu de la photo de la slide '+n;image.loading='lazy';select.setAttribute('aria-label','Photo slide '+n);
      select.append(new Option('Sans photo',''));
      for(const personal of [false,true]){const group=el('optgroup');group.label=personal?'Mes photos':'Photos du club';for(const item of options.filter(s=>s.personal===personal))group.append(new Option(item.name,item.id));if(group.children.length)select.append(group);}
      select.value=state.choices[n]||'';
      function preview(){const source=options.find(s=>s.id===select.value);image.hidden=!source;if(source)image.src=source.data||source.url;}
      select.onchange=()=>{state.choices[n]=select.value;preview();};preview();label.append(select);row.append(label,image);rows.append(row);
    });
  }
  async function decode(url){const image=new Image();image.src=url;await image.decode();return image;}
  function crop(image,ratio,contain=false){
    const canvas=document.createElement('canvas');canvas.width=ratio<1?780:1440;canvas.height=Math.round(canvas.width/ratio);const ctx=canvas.getContext('2d');ctx.fillStyle='#09182A';ctx.fillRect(0,0,canvas.width,canvas.height);
    const factor=(contain?Math.min:Math.max)(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight),w=image.naturalWidth*factor,h=image.naturalHeight*factor;
    ctx.drawImage(image,(canvas.width-w)/2,contain?(canvas.height-h)/2:(canvas.height-h)*.3,w,h);return canvas.toDataURL('image/jpeg',.88);
  }
  files.onchange=async()=>{
    const context=key(),epoch=generation,state=current(),picked=[...files.files];
    if(state.items.length+picked.length>10){status.textContent='Ajoutez au maximum 10 photos personnelles par export.';files.value='';return;}
    files.disabled=download.disabled=true;status.textContent='Préparation des photos…';
    try{
      const batch=[];
      for(const file of picked){
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw Error('Utilisez une photo JPG, PNG ou WebP de moins de 20 Mo.');
        const url=URL.createObjectURL(file);
        try{const image=await decode(url),canvas=document.createElement('canvas');const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);batch.push({id:crypto.randomUUID(),name:file.name.slice(0,100),data:canvas.toDataURL('image/jpeg',.88),personal:true});}finally{URL.revokeObjectURL(url);}
      }
      if(generation!==epoch||context!==key())return;
      state.items.push(...batch);paint();status.textContent='Photos prêtes. Choisissez leur slide dans la liste.';
    }catch(error){if(context===key())status.textContent=error.message||'Cette photo ne peut pas être ouverte.';}
    finally{files.value='';files.disabled=download.disabled=false;}
  };
  const original=causerieExport.downloadCurrent;
  function open(){opened=key();panel.hidden=false;status.textContent='';paint();const heading=panel.querySelector('h3');heading.tabIndex=-1;heading.focus({preventScroll:true});panel.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  $('causerie-download').onclick=()=>open();
  download.onclick=async()=>{
    if(opened!==key()){open();status.textContent='Le match a changé. Vérifiez les photos de cette causerie.';return;}
    download.disabled=true;
    try{const result=await original();if(result)panel.hidden=true;else status.textContent=$('causerie-ppt-status').textContent;}finally{download.disabled=false;}
  };
  close.onclick=()=>{panel.hidden=true;$('causerie-download').focus();};
  document.addEventListener('workspace-draft-changed',()=>{if(opened&&opened!==key()){panel.hidden=true;rows.replaceChildren();status.textContent='';}});
  window.causerieExportPhotos={
    open,
    capture(){const state=current();return {choices:{...state.choices},items:state.items.map(item=>({...item}))};},
    async resolve(snapshot){
      const spec=snapshot||{choices:{1:club[0].id,11:'club:cercle-equipe'},items:[]},all=[...club,...(spec.items||[])],result={};
      const selected=Object.entries(spec.choices).filter(([n,id])=>Number(n)>=1&&Number(n)<=11&&id);
      const loaded=new Map();
      for(const [n,id] of selected){const source=all.find(item=>item.id===id);if(!source)throw Error('Une photo sélectionnée n’est plus disponible. Choisissez-la à nouveau.');if(!loaded.has(id)){const image=await decode(source.data||source.url);loaded.set(id,{portrait:crop(image,4.433333/7.5,source.personal),landscape:crop(image,2.4/1.3,source.personal)});}result[n]=loaded.get(id);}
      return result;
    }
  };
  const clear=clubNetworkClear;clubNetworkClear=function(...args){generation++;sessions.clear();panel.hidden=true;rows.replaceChildren();return clear.apply(this,args);};
});
