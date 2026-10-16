// Profil commun au terrain et aux nouveaux rapports ; catégories libres pour les équipes à 11.
const clubCategorySuggestions=['U14','U15','U16','U17','U18','U19','U20','Seniors','Vétérans','Loisirs'];
function validClubProfile(s){return ['category','squad','matchDuration','section'].every(k=>s[k]===undefined||typeof s[k]==='string')&&(s.category===undefined||s.category.length<=30)&&(s.squad===undefined||s.squad.length<=30)&&(s.section===undefined||['Masculine','Féminine','Mixte'].includes(s.section))&&(s.matchDuration===undefined||s.matchDuration===''||(/^\d{1,3}$/.test(s.matchDuration)&&Number(s.matchDuration)>=1&&Number(s.matchDuration)<=180));}
function hydrateClubProfile(s){
 if(s.category===undefined){const found=s.team.match(/\bU(?:1[4-9]|20)\b/i);s.category=found?found[0].toUpperCase():/s[eé]niors?/i.test(s.team)?'Seniors':/v[eé]t[eé]rans?/i.test(s.team)?'Vétérans':'';}
 if(s.section===undefined)s.section='Masculine';if(s.squad===undefined)s.squad='';if(s.matchDuration===undefined)s.matchDuration='';
 return s;
}
function clubTeamName(s){return ['Stade Mayennais',s.category,s.section==='Masculine'?'':s.section,s.squad].filter(Boolean).join(' ').slice(0,50);}
function renderClubProfile(){
 const values={'club-category':state.category,'club-section':state.section,'club-squad':state.squad,'club-duration':state.matchDuration,'club-team':state.team};
 for(const [id,value] of Object.entries(values))if(document.getElementById(id).value!==value)document.getElementById(id).value=value;
 document.getElementById('club-profile-summary').textContent=(state.category||'Choisir une catégorie')+(state.squad?' · '+state.squad:'')+' · Football à 11';
 document.querySelector('.brand small').textContent='FOOTBALL À 11'+(state.category?' · '+state.category:'');
}
for(const category of clubCategorySuggestions){const option=document.createElement('option');option.value=category;document.getElementById('club-category-list').append(option);}
for(const [id,key] of [['club-category','category'],['club-section','section'],['club-squad','squad'],['club-duration','matchDuration']]){
 document.getElementById(id).addEventListener('input',e=>{
  if(key==='matchDuration'){const value=e.target.value;if(value!==''&&(!/^\d{1,3}$/.test(value)||Number(value)<1||Number(value)>180)){e.target.setCustomValidity('Saisissez une durée entre 1 et 180 minutes.');e.target.reportValidity();return;}e.target.setCustomValidity('');}
  const generated=clubTeamName(state);state[key]=e.target.value;
  if(key!=='matchDuration'&&(state.team===generated||state.team==='Stade Mayennais'))state.team=clubTeamName(state);
  document.getElementById('team').value=state.team;renderClubProfile();persist();
 });
}
document.getElementById('club-team').oninput=e=>{state.team=e.target.value;document.getElementById('team').value=state.team;renderClubProfile();persist();};
