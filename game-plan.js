// Deux documents de terrain indépendants. Le state actif sert au rendu et à l'export existants.
// Le brouillon historique reste toujours la composition, même quand un plan est affiché.
let compositionBoard=state,gamePlanBoard=null,terrainBoardKind='composition',terrainKnownState=state;
try{const saved=JSON.parse(coachStorageGet('vestiaire-gameplan-draft')||'null');if(valid(saved)&&saved.boardKind==='plan')gamePlanBoard=saved;}catch{}
function getCompositionBoard(){return compositionBoard;}
function getGamePlanBoard(){return gamePlanBoard;}
function getTerrainDraftFor(payload){return payload.boardKind==='plan'?gamePlanBoard:compositionBoard;}
function terrainHasDraftId(id){return !!id&&(compositionBoard.documentId===id||gamePlanBoard?.documentId===id);}
function captureTerrainState(){
 const kind=state.boardKind==='plan'?'plan':'composition';
 if(kind==='plan')gamePlanBoard=state;else compositionBoard=state;
 terrainBoardKind=kind;terrainKnownState=state;
}
function persistTerrainWorkspace(){
 captureTerrainState();try{
  coachStorageSet('vestiaire-draft',JSON.stringify(compositionBoard));
  if(gamePlanBoard)coachStorageSet('vestiaire-gameplan-draft',JSON.stringify(gamePlanBoard));
  coachStorageSet('vestiaire-terrain-mode',JSON.stringify(terrainBoardKind));return true;
 }catch{notify('Brouillon non enregistré : exportez votre composition et votre plan si le stockage est plein.');return false;}
}
persist=persistTerrainWorkspace;
function renderTerrainMode(){
 const plan=terrainBoardKind==='plan',simple=document.body.classList.contains('simple-mode');document.body.classList.toggle('game-plan-mode',plan&&!simple);
 document.body.classList.toggle('focus-mode',plan&&!simple);$('game-plan-context').hidden=!plan||simple;$('mode-focus').classList.toggle('active',plan&&!simple);$('mode-focus').setAttribute('aria-pressed',String(plan&&!simple));$('mode-team').classList.toggle('active',!plan&&!simple);$('mode-team').setAttribute('aria-pressed',String(!plan&&!simple));
 $('save').textContent=plan?'Enregistrer la vue épurée ↗':'Enregistrer la compo ↗';
 if(plan)$('game-plan-title').value=state.title||'';
 if(typeof beforeTactic!=='undefined')$('undo-tactic').hidden=!(beforeTactic&&beforeTactic.documentId===state.documentId);
}
const renderBeforeTerrainWorkspace=render;
render=function(){
 const external=state!==terrainKnownState;captureTerrainState();
 if(external){document.body.classList.remove('simple-mode');$('simple-board').hidden=true;$('mode-simple').classList.remove('active');$('mode-simple').setAttribute('aria-pressed','false');}
 renderBeforeTerrainWorkspace();renderTerrainMode();
};
function newGamePlan(){
 const source=compositionBoard,starters=source.players.filter(p=>p.role!=='sub');
 if(starters.length!==11){notify('Votre composition doit contenir exactement 11 titulaires pour créer le plan.');return null;}
 const plan=structuredClone(source);plan.boardKind='plan';plan.documentId=crypto.randomUUID();plan.title=('Plan de jeu · '+(source.title||source.team)).slice(0,100);plan.players=structuredClone(starters);plan.arrows=[];delete plan.opponents;plan.notes='';plan.benchVisible=false;
 if(source.documentId)plan.sourceCompositionId=source.documentId;return plan;
}
const setSimpleModeBeforeTerrain=setSimpleMode;
function activateTerrainBoard(kind){
 captureTerrainState();if(kind==='plan'&&!gamePlanBoard){gamePlanBoard=newGamePlan();if(!gamePlanBoard)return false;}
 if(!persistTerrainWorkspace())return false;
 setSimpleModeBeforeTerrain(false);state=kind==='plan'?gamePlanBoard:compositionBoard;captureTerrainState();render();persistTerrainWorkspace();
 // Revenir au déplacement : le choix des adversaires et les flèches restent propres au document.
 $('move').click();return true;
}
setSimpleMode=function(on){if(on&&!activateTerrainBoard('composition'))return;setSimpleModeBeforeTerrain(on);renderTerrainMode();};
$('mode-team').onclick=()=>activateTerrainBoard('composition');
$('mode-focus').onclick=()=>activateTerrainBoard('plan');
$('game-plan-sync').onclick=()=>{
 const starters=compositionBoard.players.filter(p=>p.role!=='sub');if(starters.length!==11)return notify('La composition doit avoir exactement 11 titulaires.');
 if(!confirm('Reprendre le placement et les numéros des 11 titulaires de la composition ? Les positions bleues du plan seront remplacées ; ses flèches et ses adversaires seront conservés.'))return;
 gamePlanBoard.players=structuredClone(starters);gamePlanBoard.formation=compositionBoard.formation;if(compositionBoard.documentId)gamePlanBoard.sourceCompositionId=compositionBoard.documentId;
 if(terrainBoardKind==='plan'){state=gamePlanBoard;render();}persistTerrainWorkspace();notify('Les 11 joueurs de la vue épurée reprennent la composition.');
};
$('game-plan-title').oninput=e=>{if(terrainBoardKind!=='plan')return;state.title=e.target.value;$('composition-title').value=state.title;persistTerrainWorkspace();};
$('game-plan-save').onclick=()=>$('save').click();$('game-plan-export').onclick=()=>$('composition-export').click();
// Les pions du plan héritent de l'identité et du numéro ; la fiche joueur se modifie dans Composition.
$('pitch').addEventListener('dblclick',event=>{if(terrainBoardKind==='plan'){event.preventDefault();event.stopImmediatePropagation();notify('Modifiez les joueurs dans Composition, puis reprenez vos 11 dans la vue épurée.');}},true);
try{if(gamePlanBoard&&JSON.parse(coachStorageGet('vestiaire-terrain-mode')||'null')==='plan')state=gamePlanBoard;}catch{}
captureTerrainState();render();
