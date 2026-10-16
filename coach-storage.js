// Espaces locaux nominatifs. Le profil historique conserve les clés existantes, sans migration destructive.
const coachLegacyProfile={id:'legacy',name:'Coach principal · données existantes'};
function validCoachProfile(p){return p&&typeof p.id==='string'&&/^(legacy|[a-zA-Z0-9-]{1,80})$/.test(p.id)&&typeof p.name==='string'&&p.name.trim().length>0&&p.name.length<=70;}
let coachProfiles=[coachLegacyProfile],selectedCoachId='legacy';
try{const list=JSON.parse(localStorage.getItem('vestiaire-coach-profiles')||'null');if(Array.isArray(list)&&list.length&&list.length<=100&&list.every(validCoachProfile)&&new Set(list.map(p=>p.id)).size===list.length)coachProfiles=list;const id=localStorage.getItem('vestiaire-active-coach');if(coachProfiles.some(p=>p.id===id))selectedCoachId=id;}catch{}
// Identité figée pour la durée de la page : pagehide continue d’écrire dans le bon espace.
let accountCoachBinding=null;
try{if(new URLSearchParams(location.search).get('mode')!=='local'){
 const base=String(window.CLUB_CLOUD_CONFIG?.url||'').replace(/\/$/,'');
 const saved=JSON.parse(sessionStorage.getItem('vestiaire-private-session:'+base)||'null');
 const binding=JSON.parse(sessionStorage.getItem('vestiaire-account-binding:'+base)||'null');
 if(binding&&saved?.session?.user?.id===binding.userId&&validCoachProfile(binding.coach)&&binding.coach.id==='account-'+binding.userId)accountCoachBinding=binding;
}}catch{}
const activeCoach=Object.freeze(accountCoachBinding?{...accountCoachBinding.coach}:{...coachProfiles.find(p=>p.id===selectedCoachId)});
function coachStorageKey(key,id=activeCoach.id){return id==='legacy'?key:'vestiaire-coach:'+id+':'+key;}
function coachStorageGet(key){return localStorage.getItem(coachStorageKey(key));}
function coachStorageSet(key,value){localStorage.setItem(coachStorageKey(key),value);}
