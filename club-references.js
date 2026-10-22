// Approval comes exclusively from the server and is bound to a document revision.
let clubReferenceState='idle',clubReferenceCanReview=false,clubReferenceRows=new Map(),clubReferenceRun=0;
function clubReferenceEntry(row){const entry=clubReferenceRows.get(row.id);return clubReferenceState==='ready'&&entry?.revision===row.revision?entry:null;}
function clubReferenceStatus(row){if(clubReferenceState!=='ready')return 'unknown';const entry=clubReferenceRows.get(row.id);if(entry&&entry.revision!==row.revision)return 'unknown';return entry?(entry.reviewer_id?'approved':'proposed'):'shared';}
function clubReferenceMatches(row,filter){return !filter||clubReferenceStatus(row)===filter;}
function clubReferenceRenderStatus(){const status=$('club-reference-status');if(!status)return;status.textContent=clubReferenceState==='ready'?'Partagé · proposé par un éducateur · validé par un responsable sportif. Toute nouvelle version doit être revalidée.':clubReferenceState==='loading'?'Vérification des repères du club…':clubReferenceState==='missing'?'La validation sportive nécessite l’installation Supabase « club-references.sql ». Les documents restent consultables et copiables.':'Validation sportive indisponible : aucun statut validé ne peut être confirmé. Réessayez avec Actualiser.';}
async function clubReferenceRefresh(){
 if(!clubNetworkBound())return false;const run=++clubReferenceRun,generation=clubNetworkGeneration,account=clubNetworkSession.user.id;clubReferenceState='loading';clubReferenceCanReview=false;clubReferenceRows.clear();clubReferenceRenderStatus();
 try{const data=await clubNetworkRequest('/rest/v1/rpc/club_reference_overview',{method:'POST',body:{}});if(run!==clubReferenceRun||generation!==clubNetworkGeneration||account!==clubNetworkSession?.user.id)return false;
  if(!data||typeof data.can_review!=='boolean'||!Array.isArray(data.references)||!data.references.every(r=>r&&typeof r.document_id==='string'&&Number.isInteger(r.revision)&&r.revision>0&&(r.reviewer_id===null||typeof r.reviewer_id==='string')&&(r.reviewed_at===null||typeof r.reviewed_at==='string')))throw Error('Réponse de validation invalide');
  clubReferenceRows=new Map(data.references.map(r=>[r.document_id,r]));clubReferenceCanReview=data.can_review;clubReferenceState='ready';
 }catch(error){if(run!==clubReferenceRun||generation!==clubNetworkGeneration||account!==clubNetworkSession?.user.id)return false;clubReferenceState=['PGRST202','42883'].includes(error.code)?'missing':'error';clubReferenceCanReview=false;clubReferenceRows.clear();}
 clubReferenceRenderStatus();if($('club-network-preview')?.open&&clubNetworkPreview){$('club-reference-preview')?.remove();clubReferencePreview(clubNetworkPreview);}return clubReferenceState==='ready';
}
function clubReferenceDecorate(card,row){
 const kind=clubReferenceStatus(row),entry=clubReferenceEntry(row),badge=el('p','hint club-reference-badge');badge.dataset.state=kind;
 badge.textContent=kind==='approved'?'Repère validé · '+clubNetworkAuthor(entry.reviewer_id)+' · version '+row.revision:kind==='proposed'?'Repère proposé par '+clubNetworkAuthor(row.owner_id):kind==='shared'?'Document partagé':card.dataset.proposed==='true'?'Repère proposé par '+clubNetworkAuthor(row.owner_id)+' · validation sportive non confirmée':'Validation sportive non confirmée';
 card.firstElementChild.append(badge);
}
function clubReferencePreview(row){
 const root=$('club-network-preview-content'),panel=el('section','report-panel');panel.id='club-reference-preview';const kind=clubReferenceStatus(row),entry=clubReferenceEntry(row);
 panel.append(el('strong','',kind==='approved'?'Repère validé par '+clubNetworkAuthor(entry.reviewer_id)+' · version '+row.revision:kind==='proposed'?'Repère proposé · en attente de validation sportive':kind==='shared'?'Document partagé · hors repères':'Validation sportive non confirmée'));
 if(entry?.reviewed_at)panel.append(el('p','hint','Validation du '+new Date(entry.reviewed_at).toLocaleString('fr-FR',{timeZone:'Europe/Paris'})));
 panel.append(el('p','hint','Lecture seule. Une copie devient votre propre document ; la validation de l’original ne lui est pas transmise.'));
 if(clubReferenceCanReview&&['approved','proposed'].includes(kind)){const button=el('button','export',kind==='approved'?'Retirer la validation sportive':'Valider cette version comme repère');button.type='button';button.onclick=()=>clubNetworkRun(async()=>{
  if(clubNetworkPreview?.id!==row.id||clubNetworkPreview.revision!==row.revision)return;
  if(!confirm((kind==='approved'?'Retirer la validation de':'Valider comme repère du club')+' « '+row.title+' » · version '+row.revision+' ?'))return;
  button.disabled=true;try{await clubNetworkRequest('/rest/v1/rpc/club_review_reference',{method:'POST',body:{p_document_id:row.id,p_expected_revision:row.revision,p_approve:kind!=='approved'}});await clubReferenceRefresh();clubNetworkRenderRows();notify('Décision confirmée par le serveur.');}catch(error){panel.append(el('p','hint','Décision non confirmée. Actualisez et consultez la dernière version avant de réessayer.'));throw error;}finally{button.disabled=false;}
 });panel.append(button);}root.prepend(panel);
}
document.addEventListener('DOMContentLoaded',()=>{
 const parent=$('club-network-list');if(!parent)return;const status=el('p','hint');status.id='club-reference-status';status.setAttribute('role','status');parent.before(status);clubReferenceRenderStatus();
 const decorate=clubDocumentDecorate;clubDocumentDecorate=function(card,row){decorate(card,row);clubReferenceDecorate(card,row);};
 const open=clubNetworkOpen;clubNetworkOpen=async function(row,previewOnly=false){await open(row,previewOnly);if($('club-network-preview').open&&clubNetworkPreview?.id===row.id)clubReferencePreview(clubNetworkPreview);};
 const clear=clubNetworkClear;clubNetworkClear=function(){clubReferenceRun++;clubReferenceState='idle';clubReferenceCanReview=false;clubReferenceRows.clear();clear();clubReferenceRenderStatus();};
});
