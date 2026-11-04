// One lightweight disclosure; edits use the existing guarded form directly in the agenda.
document.addEventListener('DOMContentLoaded', () => {
  const trigger=$('agenda-week-template-open');
  const wrap=el('div','agenda-week-menu');
  trigger.before(wrap);wrap.append(trigger);
  const menu=el('div','agenda-week-dropdown');menu.id='agenda-week-dropdown';menu.hidden=true;
  const edit=el('button','', 'Modifier ma semaine type');edit.type='button';menu.append(edit);wrap.append(menu);
  trigger.setAttribute('aria-controls',menu.id);trigger.setAttribute('aria-expanded','false');
  function close(focus=false){menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus();}
  function open(){menu.hidden=false;trigger.setAttribute('aria-expanded','true');}
  let hovered=false,timer;
  trigger.onclick=()=>{if(hovered&&!menu.hidden){hovered=false;return;}menu.hidden?open():close();};
  edit.onclick=()=>{close();agendaRecurringConfigure({inline:true});};
  wrap.addEventListener('pointerenter',e=>{clearTimeout(timer);if(e.pointerType==='mouse'&&matchMedia('(hover:hover)').matches){open();hovered=true;}});
  wrap.addEventListener('pointerleave',()=>{timer=setTimeout(()=>{if(!wrap.contains(document.activeElement))close();},160);});
  wrap.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close(true);}else if(e.key==='ArrowDown'){e.preventDefault();open();edit.focus();}});
  wrap.addEventListener('focusout',e=>{if(!wrap.contains(e.relatedTarget))close();});
  document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))close();});
});
