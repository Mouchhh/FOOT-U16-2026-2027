// Guide facultatif : ouvre les parcours existants sans créer ni remplacer de document.
document.addEventListener('DOMContentLoaded',()=>{
 const open=el('button','export coach-quickstart-open','Mode d’emploi');open.id='coach-quickstart-open';open.type='button';open.setAttribute('aria-haspopup','dialog');
 const row=el('div','coach-quickstart-entry');row.append(el('span','','Les repères pour préparer votre semaine'),open);$('home-work-quick').after(row);
 open.onclick=()=>{
  const old=$('coach-quickstart-dialog');if(old?.open)return;old?.remove();
  const dialog=el('dialog','completion-dialog coach-quickstart-dialog');dialog.id='coach-quickstart-dialog';dialog.setAttribute('aria-labelledby','coach-quickstart-title');
  const head=el('div','section-heading'),title=el('h2','','Les repères du coach'),close=el('button','export','Fermer');title.id='coach-quickstart-title';close.type='button';close.onclick=()=>dialog.close();head.append(title,close);dialog.append(head,el('p','hint','Ces raccourcis reprennent votre travail actuel. Ils ne créent pas de nouvelle fiche.'));
  const items=[
   ['Séances · préparer le terrain',['Renseignez le groupe, l’objectif, les présents et le rendez-vous.','Dans Le déroulé, cherchez les exercices dans la Bible et adaptez leurs variantes.','Vérifiez le temps total, le matériel et les rôles, puis enregistrez.'],'Reprendre ma séance','view-training',()=>{$('training-prepare-tab').click();trainingWizard.go(0);}],
   ['Match · préparer la causerie',['Composition : placez les titulaires et les impacteurs / finisseurs.','Tactique : travaillez le placement ou les pions et animations.','Causerie : notez vos objectifs et consignes ; le cadre Canva propose la connexion et le transfert.'],'Reprendre mon match','view-pitch',()=>{if(activateTerrainBoard('composition'))workspaceFlows.terrain.go(0);}],
   ['Bilans · préparer la suite',['Depuis la causerie, utilisez Préparer le bilan de ce match pour reprendre ses objectifs.','Après le match, renseignez vos observations et choisissez une ou deux priorités.','Dans Plan d’action, préparez les exercices de la prochaine séance.'],'Reprendre mon bilan','view-reports',()=>{reportTab='general';renderReportTabs();renderReportContent();}],
   ['Sauvegarde · retrouver son travail',['Brouillon local : le travail est conservé dans ce navigateur.','Enregistré ici : la version se trouve dans vos documents sur cet appareil. Le partage au club a un état distinct.','Dans Agenda, retrouvez les séances enregistrées. Le bouton de sauvegarde donne aussi accès aux brouillons remplacés.'],'Voir mon agenda','view-coach-agenda',()=>workspaceFlows.agenda.go(1)]
  ];
  for(const [heading,steps,label,parent,run]of items){const section=el('section','coach-quickstart-section');section.append(el('h3','',heading));const list=el('ol');steps.forEach(step=>list.append(el('li','',step)));const button=el('button','export',label);button.type='button';button.dataset.destination=parent;button.onclick=()=>{dialog.close();workspaceNavigation.run(parent,run);};section.append(list,button);dialog.append(section);}
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
 };
});
