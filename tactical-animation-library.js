// Reuse canonical explanation documents and the club's existing authenticated library/outbox.
const animationCompositionValid = valid;
valid = function(board) {
  return animationCompositionValid(board) && (board.causerieAnimations === undefined ||
    Array.isArray(board.causerieAnimations) && board.causerieAnimations.length <= 20 && board.causerieAnimations.every(simpleSequenceValid));
};
document.addEventListener('DOMContentLoaded', () => {
  const scenario = $('simple-scenario');
  scenario.closest('label').hidden = true;
  $('simple-objective').hidden = true;
  $('simple-step-text').hidden = true;
  $('simple-sequence-name').placeholder = 'Nom de votre animation';
  $('simple-sequence-save').textContent = 'Enregistrer l’animation';
  const savedLabel = $('simple-library').closest('label');
  if(savedLabel.firstChild.nodeType === Node.TEXT_NODE) savedLabel.firstChild.textContent = 'Mes animations';
  const titleLabel = $('simple-sequence-name').closest('label');
  if (titleLabel.firstChild.nodeType === Node.TEXT_NODE) titleLabel.firstChild.textContent = 'Nom de l’animation';
  function freeTitle() {
    $('simple-title').textContent = simpleState.sequenceTitle?.trim() || 'Animation sans titre';
    $('simple-step-title').textContent = 'Étape ' + (simpleState.step + 1);
    [...$('simple-steps').children].forEach((button,index) => button.setAttribute('aria-label','Étape ' + (index + 1)));
  }
  const renderBefore = renderSimple;
  renderSimple = function(...args) { const value=renderBefore.apply(this,args);freeTitle();return value; };
  $('simple-sequence-name').oninput = event => {simpleState.sequenceTitle=event.target.value;freeTitle();saveSimple();};
  function createAnimation() {
    createCustomSequence();
    delete simpleState.sequenceId;
    simpleState.sequenceTitle='';
    renderSimple();saveSimple();
    documentEntry.perform(()=>workspaceNavigation.run('view-pitch',()=>{$('mode-simple').click();workspaceFlows.terrain.go(0);}));
    $('simple-sequence-name').focus();
  }
  const fresh=el('button','export','+ Nouvelle animation');fresh.id='tactical-animation-new';fresh.type='button';fresh.onclick=createAnimation;
  $('simple-sequence-save').parentElement.prepend(fresh);
  const shelf=document.querySelector('.simple-library-panel');
  const shelfMore=el('details','tactical-library-more');shelfMore.append(el('summary','','Mes animations enregistrées'));
  for(const child of [...shelf.children]) if(!child.contains($('simple-sequence-name')) && !child.contains($('simple-sequence-save'))) shelfMore.append(child);
  shelfMore.append($('simple-sequence-copy'),$('simple-sequence-club'));
  shelf.append(shelfMore);$('simple-board').prepend(shelf);
  const enter=$('mode-simple').onclick;
  $('mode-simple').onclick=function(...args) {
    const result=enter.apply(this,args);
    if(!simpleState.sequenceId && simpleState.scenario!=='custom') {
      createCustomSequence();simpleState.sequenceTitle='';renderSimple();saveSimple();
    }
    return result;
  };
  const eleven=$('simple-eleven').onclick;
  $('simple-eleven').onclick=function(...args){const result=eleven?.apply(this,args);createCustomSequence();simpleState.sequenceTitle='';renderSimple();saveSimple();return result;};
  function entries() {
    simpleRefreshLibrary();
    const rows=simpleLibrary.map(entry=>({entry,local:true}));
    for(const row of clubNetworkRows) if(row.kind==='composition' && simpleExplanationValid(row.payload) && !rows.some(r=>r.entry.id===row.payload.pionExplanation.id)) rows.push({entry:row.payload.pionExplanation,local:false});
    return rows;
  }
  function attach(entry, message) {
    if(!simpleSequenceValid(entry))return;
    const board=getCompositionBoard(), before=board.causerieAnimations;
    if((before?.length||0)>=20 && !before?.some(e=>e.id===entry.id)) return notify('20 animations maximum par causerie.');
    board.causerieAnimations=[...(before||[]).filter(e=>e.id!==entry.id),structuredClone(entry)];
    if(!persistTerrainWorkspace()) {
      if(before===undefined)delete board.causerieAnimations;else board.causerieAnimations=before;
      return notify('Animation non associée : la causerie précédente est conservée.');
    }
    documentCompletionBeginEdit('causerie',board);
    message.textContent='Animation ajoutée · validez la causerie pour l’enregistrer avec ce match.';
    paintAttachment();
  }
  const attachment=el('section','tactical-animation-attach'), label=el('label','report-field','Animation enregistrée'), picker=el('select');
  picker.setAttribute('aria-label','Animation à ajouter à la causerie');label.append(picker);
  const add=el('button','export','Ajouter à la causerie'), create=el('button','export','Créer une animation'), info=el('p','hint'), attached=el('div','tactical-attached');
  add.type=create.type='button';add.onclick=()=>{const entry=entries().find(r=>r.entry.id===picker.value)?.entry;if(entry)attach(entry,info);};create.onclick=createAnimation;
  attachment.append(el('h3','','Animations tactiques'),label,add,create,attached,info);$('task-causerie').append(attachment);
  function paintAttachment() {
    const previous=picker.value;
    picker.replaceChildren(new Option('Choisir une animation…',''),...entries().map(r=>new Option(r.entry.title,r.entry.id)));
    if([...picker.options].some(o=>o.value===previous))picker.value=previous;
    add.disabled=!picker.value;
    attached.replaceChildren();
    for(const entry of getCompositionBoard().causerieAnimations||[]) {
      const row=el('div','tactical-attached-row'), remove=el('button','export','Retirer');remove.type='button';remove.setAttribute('aria-label','Retirer l’animation '+entry.title);
      remove.onclick=()=>{
        const board=getCompositionBoard(),before=board.causerieAnimations;
        board.causerieAnimations=before.filter(e=>e.id!==entry.id);
        if(!persistTerrainWorkspace()){board.causerieAnimations=before;return notify('Modification non enregistrée.');}
        documentCompletionBeginEdit('causerie',board);paintAttachment();
      };
      row.append(el('span','',entry.title),remove);attached.append(row);
    }
  }
  picker.onchange=()=>add.disabled=!picker.value;
  const panel=el('section','club-animation-library');panel.id='club-animation-library';
  const search=el('input');search.type='search';search.placeholder='Rechercher une animation';search.setAttribute('aria-label','Rechercher une animation');
  const list=el('div','club-animation-rows');panel.append(el('h2','','Animations du club'),search,list);workspaceFlows.club.pages[1].append(panel);
  function paintClub() {
    list.replaceChildren();
    for(const {entry,local} of entries().filter(r=>r.entry.title.toLocaleLowerCase('fr').includes(search.value.toLocaleLowerCase('fr')))) {
      const row=el('article','club-animation-row'), open=el('button','export',local?'Ouvrir':'Créer ma copie'), use=el('button','export','Ajouter à ma causerie'), status=el('p','hint');open.type=use.type='button';
      open.onclick=()=>{
        let copy=structuredClone(entry);
        if(!local) {
          copy.id=crypto.randomUUID();copy.state.sequenceId=copy.id;copy.updatedAt=new Date().toISOString();
          try{simpleCommitLibrary([copy,...simpleLibrary]);}catch{return notify('Copie non enregistrée. Réessayez.');}
        }
        documentEntry.perform(()=>simpleExplanationOpen(copy));
      };
      use.onclick=()=>attach(entry,status);
      row.append(el('strong','',entry.title),open,use,status);list.append(row);
    }
    if(!list.children.length)list.append(el('p','hint','Aucune animation enregistrée pour cette recherche.'));
  }
  search.oninput=paintClub;
  let openingAnimations=false;
  const clubGo=workspaceFlows.club.go;
  workspaceFlows.club.go=function(...args){if(!openingAnimations)document.body.classList.remove('club-animations-mode');return clubGo.apply(this,args);};
  window.clubAnimationsOpen=()=>{
    if(!clubNetworkBound())return clubNetworkRequestPrivate();
    document.body.classList.add('club-animations-mode');openingAnimations=true;
    try { workspaceFlows.club.go(1); } finally { openingAnimations=false; }
    paintClub();
  };
  window.tacticalAnimationLibrary={entries,render:()=>{paintClub();paintAttachment();}};
  $('simple-sequence-club').textContent='Animations du club';
  $('simple-sequence-club').onclick=()=>workspaceNavigation.run('view-club-network',()=>clubAnimationsOpen());
  const savesBefore=renderSaves;
  renderSaves=function(...args){const value=savesBefore.apply(this,args);paintClub();paintAttachment();return value;};
  const boardBefore=render;
  render=function(...args){const value=boardBefore.apply(this,args);paintAttachment();return value;};
  const clubBefore=clubNetworkRenderRows;
  clubNetworkRenderRows=function(...args){const value=clubBefore.apply(this,args);paintClub();paintAttachment();return value;};
  freeTitle();paintClub();paintAttachment();
});
