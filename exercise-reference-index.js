// Index interne : aucun contenu pédagogique n'est réécrit.
(() => {
 const data=window.exerciseReferenceData,normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const byId=new Map(data.entries.map(e=>[e.id,Object.freeze(e)])),byView=new Map(data.entries.map(e=>[e.source_id+':'+e.source_view,e]));
 const sizes={quarter:[34,52],half:[52,68],full:[68,105]};
 function find({intention='',phase='',effectif=null,surface='',niveau='',gardiens=null,query=''}={}){
  const room=sizes[surface],age=Number(String(niveau).match(/U(\d+)/i)?.[1]||(/senior/i.test(niveau)?18:0));
  return [...byId.values()].filter(e=>{
   const dims=[...e.dimensions].sort((a,b)=>a-b),refAge=Number(String(e.niveau_reference||'').match(/U(\d+)/i)?.[1]||0);
   return (!intention||e.intention===intention&&!e.classification_a_verifier&&!e.effectif_a_verifier)&&(!phase||e.phase===phase)&&(effectif===null||effectif>=e.effectif_min&&effectif<=e.effectif_max)&&(!room||dims[0]<=room[0]&&dims[1]<=room[1])&&(gardiens===null||e.gardiens<=gardiens)&&(!age||!refAge||age>=refAge)&&(!query||normal(e.mots_cles.join(' ')).includes(normal(query)));
  });
 }
 const resolve=id=>{const meta=byId.get(id);return meta?suppliedExerciseEngine.getExercise(meta.source_id,meta.source_view):null;};
 window.exerciseReferenceIndex={version:data.version,entries:Object.freeze([...byId.values()]),get:id=>byId.get(id)||null,forExercise:e=>byView.get(e.id+':'+suppliedExerciseEngine.viewIndex(e))||null,resolve,find,recommend(options={}){
  const seen=new Set();return find(options).filter(e=>!e.classification_a_verifier&&!e.effectif_a_verifier).filter(e=>{if(seen.has(e.source_id))return false;seen.add(e.source_id);return true;}).sort((a,b)=>Math.abs((options.effectif||a.effectif_reference)-a.effectif_reference)-Math.abs((options.effectif||b.effectif_reference)-b.effectif_reference)||a.id.localeCompare(b.id)).slice(0,options.limit||4);
 }};
})();
