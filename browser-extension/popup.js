const $=id=>document.getElementById(id);
$('prepare').onclick=async()=>{
 try{
  $('status').textContent='Préparation…';const [tab]=await chrome.tabs.query({active:true,currentWindow:true});const url=new URL(tab.url||'');
  if(url.protocol!=='https:'||url.hostname!=='mouchhh.github.io'||!url.pathname.startsWith('/FOOT-U16-2026-2027/'))throw Error('Ouvrez d’abord votre séance sur le site du Stade Mayennais.');
  const response=await fetch(chrome.runtime.getURL('club-project.json'));if(!response.ok)throw Error('Référentiel manquant dans le dossier de l’extension.');const reference=await response.json();
  const result=await chrome.scripting.executeScript({target:{tabId:tab.id},world:'MAIN',func:reference=>{if(!window.stadeMayennaisChatGPT)throw Error('Actualisez le site pour charger l’assistant.');return window.stadeMayennaisChatGPT.prepare(reference);},args:[reference]});
  $('prompt').value=result[0].result.prompt;$('open').disabled=false;$('status').textContent='Demande prête. Le résumé du projet et l’objectif saisi seront transmis seulement quand vous les collerez dans ChatGPT.';
 }catch(error){$('status').textContent=error.message||'Impossible de préparer la demande.';}
};
$('open').onclick=async()=>{try{await navigator.clipboard.writeText($('prompt').value);await chrome.tabs.create({url:'https://chatgpt.com/'});$('status').textContent='Collez avec Ctrl+V, envoyez la demande, puis rapportez le JSON sur le site.';}catch{$('prompt').focus();$('prompt').select();$('status').textContent='Copiez le texte avec Ctrl+C, puis ouvrez ChatGPT dans un nouvel onglet.';}};
