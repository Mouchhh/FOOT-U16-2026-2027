// Virtual folders use existing authorized metadata and versioned documents, not a second library.
const clubDocumentFolders={training:{label:'Séances',hint:'Préparations et exercices de séance'},report:{label:'Bilans',hint:'Rapports et suivis après-match'},causeries:{label:'Causeries',hint:'Messages et plan de jeu du match'},composition:{label:'Compositions',hint:'Équipes, systèmes et placements'},tactics:{label:'Tactique',hint:'Plans de jeu et situations tactiques'},explanation:{label:'Animations',hint:'Situations de jeu, sorties de balle, pions et flèches'},squad:{label:'Effectifs',hint:'Répertoires de joueurs'}};
const clubCompositionFolders=['composition','causeries','explanation','tactics'];
const clubFolderNormal=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
function clubFolderForSource(kind,payload){
 if(kind==='training'||kind==='report')return kind;
 if(payload.squadDirectory)return 'squad';if(payload.pionExplanation)return 'explanation';if(payload.clubFolder==='build')return 'explanation';
 if(clubCompositionFolders.includes(payload.clubFolder))return payload.clubFolder;
 const title=clubFolderNormal(payload.title);if(/sorties? de balle|ressortir le ballon/.test(title))return 'explanation';if(/^causerie\b/.test(title))return 'causeries';
 if(payload.boardKind==='plan')return 'tactics';const p=payload.matchPreparation;
 if(p&&(['context','opponent','defensive','offensive','specific'].some(k=>p[k]?.trim())||p.objectives?.some(v=>v.trim())))return 'causeries';
 return 'composition';
}
function clubFolderForRow(row){
 if(row.kind==='training'||row.kind==='report')return row.kind;
 const title=String(row.title||'');if(title.startsWith('Effectif · '))return 'squad';if(title.startsWith('Explication · ')||title.startsWith('Animation · '))return 'explanation';
 if(title.startsWith('Composition · '))return 'composition';if(title.startsWith('Causerie · '))return 'causeries';if(title.startsWith('Sortie de balle · '))return 'explanation';
 if(/sorties? de balle|ressortir le ballon/.test(clubFolderNormal(title)))return 'explanation';if(/^causerie\b/.test(clubFolderNormal(title)))return 'causeries';if(title.startsWith('Plan de jeu · '))return 'tactics';return 'composition';
}
const clubFolderOriginalSource=clubNetworkSource;
clubNetworkSource=function(kind,payload){const source=clubFolderOriginalSource(kind,payload);if(!source||kind!=='composition'||payload.squadDirectory)return source;if(payload.pionExplanation)return source;
 const prefix={composition:'Composition',causeries:'Causerie',explanation:'Animation',tactics:'Plan de jeu'}[clubFolderForSource(kind,payload)],name=source.title.replace(/^(?:(?:Composition|Causerie|Sortie de balle|Animation|Plan de jeu) · )+/,'');source.title=(prefix+' · '+name).slice(0,150);return source;};
const clubFolderOriginalKind=clubNetworkKindMatches;
clubNetworkKindMatches=function(row,kind){return kind?.startsWith('folder:')?clubFolderForRow(row)===(kind.slice(7)==='build'?'explanation':kind.slice(7)):clubFolderOriginalKind(row,kind);};
function clubFoldersCanSearch(){return !!$('club-network-author')?.value&&!!$('club-network-kind')?.value;}
function clubFoldersVisibleRows(rows){return clubFoldersCanSearch()?rows:[];}
document.addEventListener('DOMContentLoaded',()=>{
 const author=$('club-network-author'),kind=$('club-network-kind'),root=$('club-network-list'),page=workspaceFlows.club.pages[1],filters=page.querySelector('.club-network-filters');
 author.setAttribute('aria-label','Choisir l’éducateur');author.closest('label').firstChild.textContent='1 · Choisir l’éducateur';kind.closest('label').firstChild.textContent='2 · Choisir un dossier';kind.setAttribute('aria-label','Choisir un dossier');
 const oldKind=kind.value;kind.replaceChildren(new Option('Choisir un dossier…',''));for(const [id,folder]of Object.entries(clubDocumentFolders))kind.append(new Option(folder.label,'folder:'+id));for(const [id,label]of [['training','Séances'],['report','Bilans'],['composition','Tous les tableaux'],['explanation','Animations']]){const option=new Option(label,id);option.hidden=true;kind.append(option);}kind.value=oldKind;
 const path=el('div','club-folder-path');path.id='club-document-path';path.setAttribute('aria-label','Dossier consulté');const grid=el('div','club-folder-grid');grid.id='club-document-folder-grid';const count=el('p','hint');count.id='club-document-folder-count';count.setAttribute('role','status');filters.after(path,grid);root.before(count);
 const search=$('club-document-title').closest('label'),advanced=$('club-document-filters').parentElement;let key='',selectedAuthor=author.value,selectedKind=kind.value;
 const baseRender=clubNetworkRenderRows;clubNetworkRenderRows=function(){
  if(!clubNetworkBound()){root.replaceChildren();grid.replaceChildren();path.replaceChildren();count.textContent='';return;}
  const signature=JSON.stringify([author.value,kind.value,$('club-document-title').value,clubDocumentSearch]);if(signature!==key){clubNetworkPageSize=12;key=signature;}
  baseRender();if(author.options[0])author.options[0].textContent='Choisir un éducateur…';kind.disabled=!author.value;
  const coach=author.value,folder=kind.value,label=folder.startsWith('folder:')?clubDocumentFolders[folder.slice(7)]?.label:folder?{training:'Séances',report:'Bilans',composition:'Tableaux',explanation:'Animations'}[folder]:null;
  const back=el('button','export',coach?'Changer d’éducateur':'Choisir un éducateur');back.type='button';back.onclick=()=>{author.value='';kind.value='';author.dispatchEvent(new Event('change'));author.focus();};path.replaceChildren(back);if(coach){const folders=el('button','export','Dossiers de '+clubNetworkAuthor(coach));folders.type='button';folders.onclick=()=>{kind.value='';kind.dispatchEvent(new Event('change'));};path.append(folders);if(label)path.append(el('strong','',label));}
  const ready=!!coach&&!!folder;for(const node of [search,advanced,count,$('club-reference-status')])if(node)node.hidden=!ready;
  grid.replaceChildren();grid.hidden=!coach||!!folder;
  if(!coach){root.replaceChildren(el('p','report-panel','Choisissez l’éducateur dont vous souhaitez consulter les documents.'));$('club-network-more').hidden=true;return;}
  if(!folder){root.replaceChildren();$('club-network-more').hidden=true;const rows=clubNetworkRows.filter(r=>r.owner_id===coach);for(const [id,definition]of Object.entries(clubDocumentFolders)){const n=rows.filter(r=>clubFolderForRow(r)===id).length,button=el('button','club-folder-card');button.type='button';button.dataset.folder=id;button.append(el('strong','',definition.label),el('span','',n+' document'+(n>1?'s':'')),el('small','',definition.hint));button.onclick=()=>{kind.value='folder:'+id;kind.dispatchEvent(new Event('change'));};grid.append(button);}return;}
  const rows=clubNetworkRows.filter(r=>r.owner_id===coach&&clubNetworkKindMatches(r,folder)&&clubDocumentTitleMatches(r)&&clubDocumentMatches(r));count.textContent=Math.min(rows.length,clubNetworkPageSize)+' / '+rows.length+' document(s) affichés · '+clubNetworkAuthor(coach)+' · '+label;
 };
 author.addEventListener('change',()=>{if(author.value!==selectedAuthor){selectedAuthor=author.value;kind.value='';selectedKind='';$('club-document-title').value='';clubDocumentReset();}if(clubNetworkBound())workspaceFlows.club.go(1);clubNetworkRenderRows();});
 kind.addEventListener('change',()=>{if(kind.value!==selectedKind){selectedKind=kind.value;$('club-document-title').value='';clubDocumentReset();}clubNetworkPageSize=12;clubNetworkRenderRows();});$('club-network-more').onclick=()=>{clubNetworkPageSize+=12;clubNetworkRenderRows();};
 const baseClear=clubNetworkClear;clubNetworkClear=function(){key='';selectedAuthor='';selectedKind='';kind.value='';grid.replaceChildren();path.replaceChildren();count.textContent='';baseClear();};
 // Selection edits only the open draft. The normal Save action retains version/conflict protection.
 const folderLabel=el('label','report-field club-save-folder','Dossier dans les documents partagés'),folderSelect=el('select');folderSelect.id='club-save-folder';folderSelect.setAttribute('aria-label','Dossier dans les documents partagés');folderSelect.append(new Option('Classement automatique',''));for(const id of clubCompositionFolders)folderSelect.append(new Option(clubDocumentFolders[id].label,id));folderLabel.append(folderSelect);const folderDetails=el('details','club-save-folder-options'),folderSummary=el('summary');folderDetails.append(folderSummary,folderLabel);$('terrain-page-2').prepend(folderDetails);
 function target(){return terrainBoardKind==='plan'?getGamePlanBoard():getCompositionBoard();}
 function renderFolder(){const board=target();folderDetails.hidden=document.body.classList.contains('simple-mode');folderSummary.textContent=(board?.clubFolder?'Dossier : ':'Classement automatique : ')+(board?clubDocumentFolders[clubFolderForSource('composition',board)]?.label:'Compositions');folderSelect.value=board?.clubFolder||'';folderSelect.options[0].textContent='Automatique · '+(board?clubDocumentFolders[clubFolderForSource('composition',board)]?.label:'Compositions');}
 folderSelect.onchange=()=>{const board=target();if(!board)return;const had=Object.hasOwn(board,'clubFolder'),previous=board.clubFolder;if(folderSelect.value)board.clubFolder=folderSelect.value;else delete board.clubFolder;if(!persistTerrainWorkspace()){if(had)board.clubFolder=previous;else delete board.clubFolder;notify('Classement non conservé. Votre réglage précédent est maintenu.');}renderFolder();};
 document.addEventListener('click',renderFolder);new MutationObserver(renderFolder).observe(document.body,{attributes:true,attributeFilter:['class']});const heading=()=>{$('club-network-heading').textContent=['Les éducateurs du club','Documents partagés','Mon compte'][workspaceFlows.club.index()];};new MutationObserver(heading).observe(workspaceFlows.club.root,{attributes:true,attributeFilter:['data-step']});heading();renderFolder();clubNetworkRenderRows();
});
