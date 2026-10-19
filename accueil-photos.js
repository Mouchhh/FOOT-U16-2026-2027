// Même sélection locale de photos que sur l’accueil des éducateurs.
(async()=>{
 const root=document.querySelector('.welcome-photos'),button=document.querySelector('#welcome-photo-pause');
 if(!root||!button)return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let paused=motion.matches,index=0,timer=null;
 const seen=new Set();
 const photos=(Array.isArray(window.CLUB_HOME_SLIDES)?window.CLUB_HOME_SLIDES:[]).filter(photo=>{
  if(!photo||typeof photo.src!=='string'||!/^assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:jpe?g|png|webp)$/i.test(photo.src)||seen.has(photo.src))return false;
  seen.add(photo.src);return true;
 }).slice(0,12);
 const images=(await Promise.all(photos.map(async photo=>{
  const img=new Image();img.alt='';img.decoding='async';img.src=photo.src;
  try{await img.decode();return img;}catch{return null;}
 }))).filter(Boolean);
 if(!images.length)return; // Conserver le fond initial en cas d’erreur de chargement.
 images[0].classList.add('active');root.replaceChildren(...images);
 function update(){
  clearInterval(timer);timer=null;
  button.textContent=paused?'Reprendre les photos':'Mettre les photos en pause';
  button.setAttribute('aria-pressed',String(paused));
  if(images.length>1&&!paused&&!document.hidden)timer=setInterval(()=>{
   images[index].classList.remove('active');index=(index+1)%images.length;images[index].classList.add('active');
  },6000);
 }
 button.hidden=images.length<2;button.onclick=()=>{paused=!paused;update();};
 document.addEventListener('visibilitychange',update);
 motion.addEventListener('change',event=>{if(event.matches){paused=true;update();}});
 update();
})();
