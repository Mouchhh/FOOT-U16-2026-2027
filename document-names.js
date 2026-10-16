let documentNameCallback=null;
function namedDocumentFilename(name,extension){const clean=String(name||'document').trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/\s+/g,' ').slice(0,100);return (clean||'document')+'.'+extension;}
function openDocumentName(heading,value,callback){documentNameCallback=callback;$('document-name-heading').textContent=heading;$('document-name-input').value=value;$('document-name-owner').textContent='Sauvegarde dans l’espace de '+activeCoach.name+'.';$('document-name-dialog').showModal();}
$('document-name-close').onclick=()=>$('document-name-dialog').close();
$('document-name-form').onsubmit=e=>{e.preventDefault();const name=$('document-name-input').value.trim();if(!name)return;$('document-name-dialog').close();documentNameCallback?.(name);};
function renameSavedComposition(index){
 const entry=saves[index];if(!entry)return;
 openDocumentName('Renommer la composition',entry.state.title||entry.state.team,name=>{
  const next=structuredClone(saves);next[index].state.title=name;
  try{coachStorageSet('vestiaire-saves',JSON.stringify(next));saves=next;if(entry.state.documentId&&state.documentId===entry.state.documentId){state.title=name;$('composition-title').value=name;persist();}renderSaves();notify('Composition renommée chez '+activeCoach.name+'.');}catch{notify('Impossible de renommer : stockage indisponible.');}
 });
}
