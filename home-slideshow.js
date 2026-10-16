// Fond photographique de l'accueil : aucun chargement de compte ou traceur Instagram.
let homeSlideImages=[],homeSlideIndex=0,homeSlideTimer=null;
const homeSlideMotion=matchMedia('(prefers-reduced-motion: reduce)');
let homeSlidePaused=homeSlideMotion.matches;
function homeSlideVisible(){return document.body.classList.contains('home-mode')&&!document.hidden;}
function renderHomeSlide(){
 homeSlideImages.forEach((img,index)=>img.classList.toggle('active',index===homeSlideIndex));
 $('home-slide-position').textContent='Photo '+(homeSlideIndex+1)+' / '+homeSlideImages.length;
 $('home-slide-pause').textContent=homeSlidePaused?'Reprendre le défilement':'Mettre en pause';$('home-slide-pause').setAttribute('aria-pressed',String(homeSlidePaused));
 for(const id of ['home-slide-previous','home-slide-next','home-slide-pause'])$(id).disabled=homeSlideImages.length<2;
}
function updateHomeSlideTimer(){
 clearInterval(homeSlideTimer);homeSlideTimer=null;
 if(homeSlideImages.length>1&&!homeSlidePaused&&homeSlideVisible())homeSlideTimer=setInterval(()=>changeHomeSlide(1),6000);
}
function changeHomeSlide(direction){if(!homeSlideImages.length)return;homeSlideIndex=(homeSlideIndex+direction+homeSlideImages.length)%homeSlideImages.length;renderHomeSlide();}
$('home-slide-previous').onclick=()=>{changeHomeSlide(-1);updateHomeSlideTimer();};$('home-slide-next').onclick=()=>{changeHomeSlide(1);updateHomeSlideTimer();};
$('home-slide-pause').onclick=()=>{homeSlidePaused=!homeSlidePaused;renderHomeSlide();updateHomeSlideTimer();};
homeSlideMotion.addEventListener('change',event=>{if(event.matches){homeSlidePaused=true;renderHomeSlide();updateHomeSlideTimer();}});
document.addEventListener('visibilitychange',updateHomeSlideTimer);
new MutationObserver(updateHomeSlideTimer).observe(document.body,{attributes:true,attributeFilter:['class']});
async function initializeHomeSlides(){
 const configured=Array.isArray(window.CLUB_HOME_SLIDES)?window.CLUB_HOME_SLIDES:[],seen=new Set();
 const candidates=configured.filter(photo=>{if(!photo||typeof photo.src!=='string'||!/^assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:jpe?g|png|webp)$/i.test(photo.src)||seen.has(photo.src))return false;seen.add(photo.src);return true;}).slice(0,12);
 const loaded=await Promise.all(candidates.map(async photo=>{const img=new Image();img.alt='';img.decoding='async';img.src=photo.src;try{await img.decode();return img;}catch{return null;}}));
 homeSlideImages=loaded.filter(Boolean);if(!homeSlideImages.length)return;
 $('home-backdrop').replaceChildren(...homeSlideImages);$('home-backdrop').hidden=false;$('home-slideshow-controls').hidden=false;document.body.classList.add('home-has-slides');
 // Le fond remplace le bloc d'attente des photos de l'accueil.
 document.querySelector('.home-club-life').hidden=true;renderHomeSlide();updateHomeSlideTimer();
}
const homeSlidesReady=initializeHomeSlides();
