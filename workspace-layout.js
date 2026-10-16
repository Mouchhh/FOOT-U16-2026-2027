// Un espace de travail compact ; les informations de compte restent dans l’accueil.
document.addEventListener('DOMContentLoaded',()=>{
 const nav=document.querySelector('.app-navigation'),profile=$('club-profile'),training=$('training-space');nav.id='workspace-navigation';nav.after(profile);
 const toggle=el('button','workspace-menu-toggle','Masquer le menu ↑');toggle.id='workspace-menu-toggle';toggle.type='button';toggle.setAttribute('aria-controls',nav.id);toggle.setAttribute('aria-expanded','true');document.querySelector('.header-actions').prepend(toggle);
 let expanded=true,frame=0,home=document.body.classList.contains('home-mode');
 function measure(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{frame=0;if(!document.body.classList.contains('training-mode')||training.hidden)return;let top=0;for(let node=training;node;node=node.offsetParent)top+=node.offsetTop;training.style.setProperty('--training-top',Math.ceil(top)+'px');});}
 function setMenu(on){expanded=on;nav.classList.toggle('workspace-menu-collapsed',!on);toggle.setAttribute('aria-expanded',String(on));toggle.textContent=on?'Masquer le menu ↑':'Menu ↓';measure();}
 toggle.onclick=()=>setMenu(!expanded);nav.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();setMenu(false);toggle.focus();}});
 new MutationObserver(()=>{const next=document.body.classList.contains('home-mode');if(next&&!home)setMenu(true);home=next;measure();}).observe(document.body,{attributes:true,attributeFilter:['class']});
 const observer=new ResizeObserver(measure);for(const target of [document.querySelector('header'),nav,profile])observer.observe(target);window.addEventListener('resize',measure);measure();
});
