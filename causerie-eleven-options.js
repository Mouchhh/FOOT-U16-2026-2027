// Phase assignments are snapshots, scoped to this match and included in its archive.
document.addEventListener('DOMContentLoaded', () => {
  const phases=causerieEleven.phases;
  const previousValid=valid;
  valid=function(board){return previousValid(board) && (board.causerieAnimationVariant===undefined||['native','gif'].includes(board.causerieAnimationVariant)) && (board.causerieSlideAnimations===undefined || board.causerieSlideAnimations && typeof board.causerieSlideAnimations==='object' && Object.keys(phases).every(key=>Array.isArray(board.causerieSlideAnimations[key])&&board.causerieSlideAnimations[key].length<=20&&board.causerieSlideAnimations[key].every(simpleSequenceValid)));};
  const panel=el('details','causerie-eleven-options');panel.id='causerie-eleven-options';panel.append(el('summary','','Présentation · 11 slides'));
  const fields=el('div','causerie-eleven-fields');const inputs=new Map();
  const status=el('p','hint');status.setAttribute('role','status');
  function save(change) {
    const board=getCompositionBoard(), before=structuredClone(board);
    change(board);
    if(!valid(board)||!persistTerrainWorkspace()) {
      for(const key of ['matchPreparation','causerieSlideAnimations','causerieAnimationVariant']) {
        if(before[key]===undefined)delete board[key];else board[key]=before[key];
      }
      status.textContent='Modification non enregistrée. Réessayez.';paint();return false;
    }
    documentCompletionBeginEdit('causerie',board);status.textContent='Réglages prêts · validez la causerie pour les conserver avec ce match.';return true;
  }
  for(const [key,title] of Object.entries(causerieEleven.fields)) {
    const label=el('label','report-field',title), input=el(['round','venue'].includes(key)?'input':'textarea');
    input.maxLength=4000;input.setAttribute('aria-label',title);if(input.tagName==='TEXTAREA')input.rows=3;
    input.oninput=()=>save(board=>board.matchPreparation[key]=input.value);label.append(input);fields.append(label);inputs.set(key,input);
  }
  const formatLabel=el('label','report-field','Format des animations'),format=el('select');format.setAttribute('aria-label','Format des animations des 11 slides');format.append(new Option('PowerPoint · trajectoires natives','native'),new Option('Canva · GIF intégrés','gif'));formatLabel.append(format);format.onchange=()=>save(board=>board.causerieAnimationVariant=format.value);
  const assignments=el('div','causerie-eleven-phases');panel.append(fields,formatLabel,el('p','hint','Choisissez plusieurs animations par phase. Les quatre phases restent sur les slides 6 à 9 ; privilégiez 1 à 4 schémas par slide pour la lisibilité.'),assignments,status);$('task-causerie').append(panel);
  function paint() {
    const board=getCompositionBoard();
    for(const [key,input] of inputs)if(document.activeElement!==input)input.value=board.matchPreparation?.[key]||'';
    format.value=board.causerieAnimationVariant||'native';assignments.replaceChildren();
    const entries=[...tacticalAnimationLibrary.entries()];
    const saved=[...(board.causerieAnimations||[]),...Object.values(board.causerieSlideAnimations||{}).flat()];
    for(const entry of saved)if(!entries.some(row=>row.entry.id===entry.id))entries.push({entry,local:false});
    for(const [key,phase] of Object.entries(phases)) {
      const section=el('section'), heading=el('h4','','Slide '+phase.slide+' · '+phase.title);section.append(heading);
      for(const {entry} of entries) {
        const label=el('label','causerie-phase-choice'),check=el('input');check.type='checkbox';check.setAttribute('aria-label',phase.title+' · '+entry.title);
        check.checked=(board.causerieSlideAnimations?.[key] || (!board.causerieSlideAnimations && key==='defensive'?board.causerieAnimations:[]) || []).some(e=>e.id===entry.id);
        check.onchange=()=>{
          save(target=>{
            const map=structuredClone(target.causerieSlideAnimations || Object.fromEntries(Object.keys(phases).map(k=>[k,k==='defensive'?target.causerieAnimations||[]:[]])));
            map[key]=check.checked?[...map[key].filter(e=>e.id!==entry.id),structuredClone(entry)]:map[key].filter(e=>e.id!==entry.id);
            target.causerieSlideAnimations=map;
          });
        };
        label.append(check,document.createTextNode(entry.title));section.append(label);
      }
      if(!entries.length)section.append(el('p','hint','Enregistrez une animation dans Tactique pour la sélectionner ici.'));
      assignments.append(section);
    }
  }
  const before=renderMatchPreparation;renderMatchPreparation=function(...args){const value=before.apply(this,args);paint();return value;};
  const library=renderSaves;renderSaves=function(...args){const value=library.apply(this,args);paint();return value;};
  paint();
});
