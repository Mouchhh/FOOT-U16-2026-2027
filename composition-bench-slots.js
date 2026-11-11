// Empty substitute slots stay visual until a real directory player is assigned.
document.addEventListener('DOMContentLoaded', () => {
  const original = compositionEmptySlots;
  compositionEmptySlots = function(board) {
    const slots = original(board);
    if (board.benchVisible === false) return slots;
    const subs = board.players.filter(p => p.role === 'sub');
    const count = Math.max(subs.length, Math.min(6, Math.max(0, Number(board.benchSlotCount) || 0)));
    const used = new Set(subs.map((p,i) => Number.isInteger(p.subSlot) ? p.subSlot : i));
    for (let i=0; i<count; i++) if (!used.has(i)) slots.push({id:'empty-sub-slot-'+i,subSlot:i,role:'sub',x:92,y:20+i*12,benchX:92,benchY:20+i*12,name:'',number:'',photo:''});
    return slots;
  };
  const bar = el('div', 'composition-bench-choice');
  bar.id = 'composition-bench-choice';
  bar.hidden = true;
  bar.setAttribute('role','group');
  bar.setAttribute('aria-label','Nombre d’impacteurs / finisseurs');
  bar.append(el('span','','Impacteurs / Finisseurs'));
  const toggle = $('bench-toggle');
  toggle.setAttribute('aria-controls',bar.id);
  toggle.setAttribute('aria-expanded','false');
  function editable() {
    return terrainBoardKind === 'composition' && (!documentCompletionIsCompleted('causerie',getCompositionBoard()) || documentCompletionIsEditing('causerie',getCompositionBoard()));
  }
  for (let i=1;i<=6;i++) {
    const button = el('button','',String(i));button.type='button';
    button.setAttribute('aria-label',i+' impacteur'+(i>1?'s':'')+' / finisseur'+(i>1?'s':''));
    button.onclick=()=>{
      if (!editable()) return notify('Reprenez la modification de cette composition.');
      const board=getCompositionBoard();
      if (board.players.filter(p=>p.role==='sub').length>i) return notify('Retirez d’abord les joueurs en trop du banc.');
      board.benchSlotCount=i;board.benchVisible=true;persist();render();
      bar.hidden=true;toggle.setAttribute('aria-expanded','false');
    };
    bar.append(button);
  }
  document.querySelector('.board-toolbar').after(bar);
  function open() {
    if(!editable())return notify('Reprenez la modification de cette composition.');
    bar.hidden=!bar.hidden;toggle.setAttribute('aria-expanded',String(!bar.hidden));
  }
  toggle.onclick=open;
  // In a composition the button creates/chooses a profile; the bench toggle keeps the count bar.
  $('add-sub').onclick=()=>{if(window.compositionPlayerPicker?.openNew('sub'))return;bar.hidden=false;toggle.setAttribute('aria-expanded','true');bar.scrollIntoView({block:'nearest'});};
  const renderBefore=render;
  render=function(...args){const value=renderBefore.apply(this,args);for(const node of $('players').querySelectorAll('[data-id^="empty-sub-slot-"]')){node.classList.add('player-empty-sub');node.setAttribute('aria-label','Impacteur / Finisseur libre : choisir un joueur');}return value;};
  render();
});
