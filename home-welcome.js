// A single personal greeting and a verifiable local save date, never a draft timestamp.
function homeLastSavedLabel(){
 try{
  const groups=[['vestiaire-training-library',trainingValid,'updatedAt'],['vestiaire-reports',reportValid,'updatedAt'],['vestiaire-saves',r=>r&&valid(r.state),'date']],times=[];
  for(const [key,check,field]of groups){const rows=JSON.parse(coachStorageGet(key)||'[]');if(!Array.isArray(rows))throw Error('library');for(const row of rows)if(check(row)){const time=Date.parse(row[field]||'');if(Number.isFinite(time)&&time<=Date.now()+60000)times.push(time);}}
  if(!times.length)return 'Aucun document enregistré sur cet appareil pour le moment.';
  const date=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(Math.max(...times)));return 'Dernier enregistrement sur cet appareil : '+date+'.';
 }catch{return 'Dernier enregistrement indisponible : vérifiez le stockage de cet appareil.';}
}
document.addEventListener('DOMContentLoaded',()=>{
 const hero=document.querySelector('.home-hero'),copy=hero.firstElementChild;copy.classList.add('home-welcome-copy');hero.append($('home-slideshow-controls'));
 const subtitle=copy.querySelector('p:not(#home-date)');subtitle.textContent='Préparez votre semaine : séances, match, causerie et bilan.';subtitle.classList.add('home-welcome-intro');copy.querySelector('.eyebrow').textContent='LE VESTIAIRE · STADE MAYENNAIS';
 const latest=el('p','home-last-saved');latest.id='home-last-saved';latest.setAttribute('role','status');$('home-greeting').after(latest);
 const players=el('span');players.append(el('strong','','0'),document.createTextNode(' joueurs'));players.firstChild.id='home-player-count';hero.querySelector('.home-stats').append(players);
 const settings=el('details','home-profile-settings');settings.id='home-profile-settings';settings.append(el('summary','','Mon profil et ma connexion'));
 const local=el('div','home-local-coach-controls'),account=el('div','home-account-actions');local.append($('coach-select').closest('label'),$('coach-add'),$('coach-rename'));local.querySelector('label').firstChild.textContent='Profil sur cet appareil';account.append($('club-account-library'),$('club-account-signout'));settings.append(local,account);$('home-tools').append(settings);
 for(const id of ['coach-profile','club-account-bar'])$(id).style.setProperty('display','none','important');
 const original=renderClubHomeStats;renderClubHomeStats=function(){original();const name=(clubNetworkBound()?clubNetworkMember?.display_name:null)||activeCoach.name;const greeting=/^Coach principal\s*·/.test(name)?'Bonjour coach.':'Bonjour '+name.trim()+'.';$('home-greeting').textContent=greeting;$('home-greeting').title=greeting;$('home-date').textContent=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());latest.textContent=homeLastSavedLabel();$('home-player-count').textContent=String(squadPlayers().length);};
 let frame=0;const refresh=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(document.body.classList.contains('home-mode'))renderClubHomeStats();});};
 for(const event of ['click','change','club-session-ready'])document.addEventListener(event,refresh);window.addEventListener('storage',refresh);new MutationObserver(refresh).observe(document.body,{attributes:true,attributeFilter:['class']});renderClubHomeStats();
});
