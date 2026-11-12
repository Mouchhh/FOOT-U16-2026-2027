// Entry follows server authorization; showing the button is never the access control.
(() => {
 const nav=document.querySelector('.app-navigation');if(!nav)return;
 const button=document.createElement('button');button.id='view-management';button.type='button';button.hidden=true;button.textContent='Responsable';button.setAttribute('aria-label','Ouvrir l’espace Responsable');nav.append(button);
 const demo=!window.CLUB_CLOUD_CONFIG?.url&&new URLSearchParams(location.search).get('mode')==='local';
 button.onclick=()=>{if(typeof workspaceNavigationCanLeave==='function'&&!workspaceNavigationCanLeave())return;if(typeof flushCoachWorkspace==='function'&&!flushCoachWorkspace())return;location.href=demo?'manager.html?demo=1':'manager.html';};
 if(demo){button.hidden=false;return;}
 async function refreshAccess(){button.hidden=true;if(typeof clubNetworkBound!=='function'||!clubNetworkBound())return;try{const access=await clubNetworkRequest('/rest/v1/rpc/club_management_access_info',{method:'POST',body:{}});button.hidden=access?.allowed!==true;}catch{/* Not installed or unauthorized: keep the entry hidden. */}}
 document.addEventListener('club-session-ready',refreshAccess);refreshAccess();
})();
