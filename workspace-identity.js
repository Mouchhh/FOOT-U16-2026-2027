// A direct entry to the existing, coach-owned directory; no second player store.
(()=>{
 const nav=document.querySelector('.app-navigation'),button=el('button','workspace-squad-entry','Votre effectif');button.id='workspace-squad-entry';button.type='button';button.setAttribute('aria-controls','coach-squad-dialog');
 window.squadWorkspace={open(){if(!workspaceNavigationCanLeave())return false;window.workspaceMenus?.close();document.body.classList.remove('home-mode','training-mode','reports-mode','coach-agenda-mode','club-network-mode');document.body.classList.add('squad-mode');$('coach-squad-dialog').hidden=false;$('coach-squad-title').textContent='Votre effectif';window.scrollTo({top:0,behavior:'instant'});return true;}};
 button.onclick=()=>openCoachSquad();
 document.addEventListener('click',event=>{const target=event.target.closest('#workspace-navigation>button,.brand');if(!target||target===button||!document.body.classList.contains('squad-mode')||!workspaceNavigationCanLeave())return;document.body.classList.remove('squad-mode');$('coach-squad-dialog').hidden=true;},true);
 button.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const buttons=[...nav.querySelectorAll(':scope>button')],index=buttons.indexOf(button);buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:buttons.length-1))%buttons.length].focus();};
 nav.insertBefore(button,$('view-club-network'));
})();
