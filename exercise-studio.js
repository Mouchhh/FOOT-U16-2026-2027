// Présentation de l’atelier ; les données restent gérées par l’éditeur d’exercices.
document.addEventListener('DOMContentLoaded',()=>{
 const dialog=$('custom-training-dialog'),form=$('custom-training-form'),editor=form.querySelector('.exercise-editor'),heading=form.querySelector('.section-heading'),submit=form.querySelector('button[type="submit"]');
 const intro=el('div','studio-intro');intro.append(el('span','studio-kicker','L’ATELIER DU COACH'));const title=heading.querySelector('h2');title.before(intro);intro.append(title);
 const tabs=el('div','studio-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Créer mon exercice');
 const sheet=el('section','studio-sheet');sheet.id='exercise-studio-sheet';sheet.setAttribute('role','tabpanel');sheet.setAttribute('aria-labelledby','studio-tab-sheet');
 const fields=[...form.children].filter(node=>node!==heading&&node!==editor&&node!==submit);fields.forEach(node=>sheet.append(node));
 const oldHint=sheet.querySelector('p.hint');if(oldHint)oldHint.textContent='Décrivez votre exercice, puis dessinez-le dans Terrain. Tous les champs de consignes sont facultatifs.';
 heading.after(tabs,sheet);editor.id='exercise-studio-board';editor.setAttribute('role','tabpanel');
 const editorHeading=editor.querySelector('.section-heading');editorHeading.querySelector('h3').textContent='Dessinez votre exercice';
 const hint=editor.querySelector('p.hint');hint.textContent='Choisissez un accessoire, puis placez-le sur le terrain. Sélectionnez-le pour ajuster son orientation.';
 const palette=$('exercise-palette'),canvas=$('exercise-board-canvas'),settings=canvas.nextElementSibling,rotation=editor.querySelector('.exercise-rotation-presets'),objectActions=$('exercise-delete').parentElement,animation=$('exercise-frame').closest('.exercise-board-actions');
 animation.classList.add('studio-animation');
 const layout=el('div','studio-board-layout'),tools=el('aside','studio-tools'),stage=el('div','studio-stage'),inspector=el('details','studio-inspector');
 tools.append(el('h4','','Joueurs & matériel'),palette);const summary=el('summary','','Réglages de l’élément');inspector.append(summary,settings,rotation,objectActions);inspector.open=true;
 canvas.before(layout);stage.append(canvas,inspector);layout.append(tools,stage);editor.append(animation);
 const footer=el('div','studio-footer');footer.append(el('span','','Votre exercice reste modifiable après validation.'),submit);form.append(footer);submit.textContent='Valider mon exercice';
 const buttons={};let mode='sheet';
 function activate(next,focus=false){mode=next;sheet.hidden=next!=='sheet';editor.hidden=next==='sheet';animation.hidden=next!=='animation';editor.setAttribute('aria-labelledby','studio-tab-'+next);hint.textContent=next==='animation'?'Ajoutez une étape, déplacez les joueurs, puis lancez la lecture. Vos trajets se dessinent automatiquement.':'Choisissez un accessoire, puis placez-le sur le terrain. Sélectionnez-le pour ajuster son orientation.';for(const [key,button]of Object.entries(buttons)){button.setAttribute('aria-selected',String(key===next));button.tabIndex=key===next?0:-1;}if(focus)buttons[next].focus();dialog.scrollTop=0;}
 for(const [key,title,number]of [['sheet','L’exercice','01'],['board','Terrain','02'],['animation','Animation','03']]){const button=el('button','studio-tab');button.type='button';button.id='studio-tab-'+key;button.setAttribute('role','tab');button.setAttribute('aria-controls',key==='sheet'?sheet.id:editor.id);button.append(el('span','studio-tab-number',number),el('span','',title));button.onclick=()=>activate(key);button.onkeydown=event=>{const keys=Object.keys(buttons),index=keys.indexOf(key);if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();activate(keys[event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3],true);}};buttons[key]=button;tabs.append(button);}
 form.addEventListener('invalid',event=>{if(sheet.contains(event.target))activate('sheet');},true);
 const original=openCustomTrainingExercise;openCustomTrainingExercise=function(block=null){original(block);if(dialog.open)activate('sheet');};activate('sheet');
 // Retour visuel bref à l’ajout, sans bloquer les déplacements sur le terrain.
 palette.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;button.classList.remove('studio-added');void button.offsetWidth;button.classList.add('studio-added');setTimeout(()=>button.classList.remove('studio-added'),350);});
});
