// Essential facts first; every existing detailed section remains available.
let reportQuickDetailed=false;
function renderReportQuick(){
 if(reportTab!=='general')return;const root=$('report-content'),original=[...root.children],panel=reportSection('Le bilan essentiel','Quelques faits pour préparer la suite. Les évaluations détaillées restent facultatives.');panel.id='report-quick-panel';
 const toggle=el('button','export',reportQuickDetailed?'Revenir au bilan essentiel':'Renseigner tous les détails du match');toggle.type='button';toggle.onclick=()=>{reportQuickDetailed=!reportQuickDetailed;renderReportContent();};panel.append(toggle);
 if(!reportQuickDetailed){const grid=el('div','completion-quick-grid');for(const key of ['date','opponent','goalsFor','goalsAgainst']){grid.append(reportField(reportInfo[key],currentReport.info[key],v=>currentReport.info[key]=v,{type:key==='date'?'date':key.startsWith('goals')?'number':'text'}));}
  for(const [section,key,label]of [['analysis','topAttack','Un point fort avec le ballon'],['plan','priority','La priorité à travailler'],['plan','success','Comment observer les progrès ?']]){const field=reportField(label,currentReport[section][key],v=>currentReport[section][key]=v,{area:true,rows:2});field.classList.add('wide');grid.append(field);}panel.append(grid);
  const next=el('button','primary','Choisir les exercices pour la prochaine séance');next.type='button';next.onclick=openReportTraining;panel.append(next,el('p','hint','Brouillon sur cet appareil. Cliquez sur « Enregistrer le rapport » pour le conserver dans les rapports partagés.'));
 }
 original.forEach(node=>node.hidden=!reportQuickDetailed);root.prepend(panel);
}
document.addEventListener('DOMContentLoaded',()=>{const before=renderReportContent;renderReportContent=function(){before();renderReportQuick();};if(reportTab==='general')renderReportContent();});
