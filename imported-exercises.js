// Original exercise content and scripts, with a presentation-only club stylesheet.
const suppliedExerciseIds=['banide-proteger','banide-joker','banide-ludique','banide-pressing','banide-appuis','banide-base','banide-contre'];
renderBibleCatalogue=function(){
 ensureBibleCatalogue();const root=$('training-catalogue');root.parentElement.classList.add('supplied-exercises-catalogue');if(root.querySelector('#supplied-exercises-frame'))return;
 bibleDisposeDiagrams(root);root.replaceChildren();const frame=document.createElement('iframe');frame.id='supplied-exercises-frame';frame.title='Exercices fournis · classement et fiches animées';frame.src='imported-exercises-view.html?v=folders-148';frame.style.cssText='display:block;width:100%;height:max(680px,calc(100dvh - 170px));border:0;border-radius:14px;background:#f2f5f9';root.append(frame);
};
// Existing saved copies remain readable; revisiting their source opens the supplied sheet.
const reuseBeforeImportedExercises=trainingReuseExercise;
trainingReuseExercise=function(block,source,label){const index=suppliedExerciseIds.indexOf(block.custom?.importedExerciseId);if(index<0)return reuseBeforeImportedExercises(block,source,label);$('training-personal-library')?.close();$('task-training-bible').click();renderBibleCatalogue();const frame=$('supplied-exercises-frame');const open=()=>{frame.contentWindow.location.hash=String(index);};if(frame.contentDocument?.readyState==='complete'&&frame.contentDocument.querySelector('.b-home,.f-card'))open();else frame.addEventListener('load',open,{once:true});};
