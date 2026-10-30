// A direct entry to the existing, coach-owned directory; no second player store.
document.addEventListener('DOMContentLoaded',()=>{
 const nav=$('workspace-navigation'),button=el('button','workspace-squad-entry','Votre effectif');button.id='workspace-squad-entry';button.type='button';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','coach-squad-dialog');button.setAttribute('aria-expanded','false');
 button.onclick=()=>{if(!workspaceNavigationCanLeave())return;workspaceMenus.close();$('coach-squad-title').textContent='Votre effectif';openCoachSquad();button.setAttribute('aria-expanded','true');};
 $('coach-squad-dialog').addEventListener('close',()=>button.setAttribute('aria-expanded','false'));
 button.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const buttons=[...nav.querySelectorAll(':scope>button')],index=buttons.indexOf(button);buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:buttons.length-1))%buttons.length].focus();};
 nav.insertBefore(button,$('view-club-network'));
});
