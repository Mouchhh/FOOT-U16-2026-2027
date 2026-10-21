// Local teaching cues. Distances describe this installation, never a universal norm.
function bibleDecisionGuide(exercise,group,options={},plan){
 const mechanism=bibleDiagramMechanism(exercise).type,template=group.template||bibleDiagramKnowledge(exercise).template;
 const design=typeof bibleExerciseDesign==='function'?bibleExerciseDesign(exercise,options.designIndex||0):null;
 // Trigger, choice and spatial organisation must describe the same football problem.
 const cues={
  third:['L’appui reçoit et attire son adversaire.','Le troisième joueur part pendant la remise, pour recevoir face au jeu.','Garder trois hauteurs et des angles de passe ; ne pas suivre tous le ballon.'],
  support:['Le défenseur masque la ligne vers le receveur.','Se décaler avant la passe pour devenir visible, puis préparer la solution suivante.','Créer un triangle autour du porteur plutôt qu’une ligne derrière le défenseur.'],
  back:['Le receveur est dos à la cible et sent la pression.','Protéger et remettre si tourner expose le ballon ; tourner seulement côté libre.','Un soutien décalé doit rester visible derrière le porteur.'],
  turn:['Le receveur prend l’information avant le contact.','Orienter le contrôle loin du défenseur ; conserver la remise si la sortie est fermée.','Le soutien et le receveur n’occupent pas la même ligne de pression.'],
  split:['Un intervalle s’ouvre entre les défenseurs.','Traverser seulement si le partenaire est accessible ; sinon, conserver autour.','Les soutiens extérieurs étirent la pression et gardent une solution derrière le ballon.'],
  pivot:['Le pivot regarde la pression avant de recevoir.','Se retourner si l’avant est libre ; remettre ou contourner si le défenseur ferme l’axe.','Le pivot se place entre les lignes, avec deux angles de soutien distincts.'],
  progress:['Le passeur peut regarder vers l’avant.','Passer dans l’intervalle ou conduire dans l’espace libre ; ne pas forcer un franchissement.','Échelonner porteur, relais et profondeur sans remplir la même zone.'],
  overlap:['Le porteur fixe le défenseur sur le côté.','Servir l’appel extérieur si le défenseur ferme l’intérieur ; garder le ballon si personne ne sort.','Le porteur et le coureur utilisent des couloirs différents ; le départ précède le service.'],
  underlap:['Le porteur garde la largeur et attire le défenseur.','Lancer le partenaire dans l’intervalle intérieur si le défenseur suit le ballon.','Partir de derrière le porteur, avec une course intérieure qui ne croise pas sa conduite.'],
  behind:['Le passeur est orienté et disponible pour jouer.','Déclencher dans le dos de la ligne ; différer l’appel si le passeur reste sous pression.','Un joueur étire en profondeur, un autre offre une solution courte.'],
  switch:['La pression se déplace vers le côté du ballon.','Trouver le côté opposé par un relais si la diagonale directe est fermée.','Garder un joueur éloigné large et un relais à une hauteur différente.'],
  isolate:['Le joueur large reçoit face à un défenseur.','Attaquer l’espace libre en duel ; revenir au soutien si une couverture ferme le côté.','Le soutien intérieur reste en retrait et ne vient pas enfermer le porteur.'],
  cover:['Le premier défenseur sort sur le porteur.','Le deuxième protège derrière et à l’intérieur ; il ne sort pas sur le même joueur.','Pression, couverture et équilibre occupent des hauteurs différentes.'],
  block:['Le ballon change de côté.','Coulisser ensemble sans libérer la passe axiale ; ne pas poursuivre chacun son adversaire.','Conserver des lignes reliées et un équilibre côté opposé.'],
  trap:['La passe adverse part vers le côté.','Orienter depuis l’intérieur, avec une couverture prête si le ballon ressort.','La touche aide à fermer un côté ; le deuxième défenseur protège l’axe.'],
  delay:['L’attaque dispose d’un joueur de plus.','Ralentir sans se jeter ; protéger la passe la plus dangereuse et gagner du temps.','Un défenseur intervient, l’autre reste derrière et à l’intérieur.'],
  depth:['Le passeur lève la tête et un attaquant démarre.','Reculer si la profondeur est menacée ; avancer seulement avec une pression réelle sur le passeur.','Voir simultanément ballon et course ; éviter une ligne figée.'],
  loss:['L’adversaire maîtrise le ballon après la perte.','Le proche freine ; les autres ferment les sorties. Si la pression est dépassée, protéger la cible.','Ne pas envoyer toute l’équipe sur le ballon ; garder couverture et profondeur.'],
  regain:['Le nouveau porteur maîtrise la récupération.','Chercher l’avant disponible ; sécuriser par un soutien si la pression ferme la progression.','Offrir rapidement une largeur, une profondeur et une sécurité à des angles différents.'],
  retreat:['L’adversaire sort de la première pression.','Ralentir le porteur pour permettre les retours, puis reformer un bloc relié.','Le proche reste entre ballon et cible ; les partenaires protègent d’abord l’axe.'],
  balance:['L’équipe progresse et des partenaires se projettent.','Accompagner sans abandonner la protection de la perte.','Conserver des joueurs derrière le ballon, décalés pour couvrir axe et profondeur.'],
  cutback:['Le centreur atteint une position favorable près du fond.','Chercher le partenaire en retrait si les défenseurs protègent leur but.','Échelonner premier attaquant, receveur en retrait et sécurité.'],
  farpost:['Le centreur se prépare à servir.','Arriver au second poteau pendant le centre, sans y attendre immobile.','Des courses complémentaires occupent des zones différentes de la surface.'],
  combine:['Un soutien reçoit près du porteur.','Utiliser la remise pour ouvrir un angle de frappe ; tirer directement si cet angle existe déjà.','Garder un triangle, un déplacement après la passe et une sécurité derrière.'],
  rebound:['La frappe part et peut être repoussée.','Anticiper le second ballon sans courir dans l’axe du tireur ou du gardien.','Un soutien reste derrière le tir, d’autres protègent la perte.'],
  defendcross:['Le centreur peut servir et les attaquants démarrent.','Protéger l’intérieur, suivre les courses et communiquer avec le gardien.','Se répartir ballon, adversaires et zones de retombée plutôt que regarder seulement le centre.'],
  throw:['Le lanceur est prêt sur la ligne.','Proposer court puis un soutien intérieur ; changer d’option si le défenseur suit le premier appel.','Créer deux angles depuis la touche ; le lanceur reste sur la ligne avant la remise.'],
  keeperpass:['Le gardien maîtrise le ballon et observe la pression.','Choisir le partenaire qui peut enchaîner ; revenir au gardien si la sortie est fermée.','Les soutiens se placent de chaque côté à des angles distincts.'],
  reinforcements:['Un renfort est autorisé à entrer dans la vague.','Reconnaître le nouveau rapport de force avant de choisir conduite, passe ou temporisation.','Seuls les acteurs de la vague occupent l’aire de jeu ; les suivants attendent hors de l’action.']
 };
 const fallback={
  build:['La première ligne de pression se déplace vers le ballon.','Trouver un relais accessible, revenir si nécessaire puis exploiter l’autre côté.','Relanceurs larges, relais à une autre hauteur et sécurité derrière le ballon.'],
  press:['La passe adverse déclenche la sortie.','Presser si la couverture suit ; se reconnecter si la ligne est dépassée.','Le proche intervient, les partenaires ferment les lignes intérieures et la profondeur.'],
  endzones:['Un partenaire peut recevoir au-delà de la pression.','Servir son appel si la fenêtre est libre ; conserver avant de réessayer sinon.','Un soutien court, un relais et un appel dans la zone cible restent à des hauteurs différentes.'],
  transition:['Une équipe perd ou récupère la maîtrise du ballon.','Changer immédiatement de rôle ; reconnaître si progresser ou sécuriser est possible.','À la récupération, s’écarter ; à la perte, garder un joueur proche et une couverture.'],
  'wide-finish':['Le joueur large peut regarder vers la surface.','Choisir le centre, le retrait ou le retour selon les défenseurs et les courses.','Un appel proche, une arrivée éloignée et un soutien en retrait occupent des zones distinctes.'],
  keeper:['Le tireur ou le gardien maîtrise le ballon.','Lire l’angle de frappe ou la distribution disponible, sans anticiper un résultat garanti.','Les soutiens restent hors de la ligne de frappe et proposent des angles de relance.'],
  combination:['L’appui et le poste suivant sont prêts.','Remettre dans le tempo puis servir la course ; conserver les numéros pendant les rotations.','Séparer la combinaison, le prochain départ et les retours par l’agilité.'],
  circuit:['Le partenaire et le poste suivant sont prêts.','Doser pour permettre l’enchaînement ; ralentir avant d’imposer moins de touches.','Conserver les angles des postes et séparer le retour de la nouvelle action.'],
  rondo:['Un défenseur ferme une ligne de passe.','Jouer le soutien visible ; traverser seulement si la fenêtre existe réellement.','Occuper le pourtour et changer d’angle sans venir tous au centre.'],
  corner:['Le tireur donne son signal et prépare le service.','Coordonner les courses ; lire la retombée plutôt que considérer le premier duel gagné.','Séparer les zones de course, le second ballon et la sécurité.'],
  finish:['Le porteur peut attaquer le but.','Choisir frappe, conduite ou dernière passe selon le défenseur et le gardien.','Échelonner les attaquants ; ne pas rejoindre tous le finisseur.'],
  keep:['La pression ferme une solution proche.','Conserver par un autre angle, puis exploiter l’espace libéré.','Donner de la largeur et de la profondeur, sans se regrouper autour du porteur.']
 };
 let values=cues[mechanism]||fallback[template]||fallback.keep;
 if(['warm','cool'].includes(exercise.id))values=exercise.id==='warm'?['Un signal demande une nouvelle prise d’information.','Lever la tête avant de changer de direction, à une allure maîtrisée.','Répartir les joueurs dans toute la zone, sans file ni attroupement.']:['Le groupe termine son effort.','Marcher, échanger doucement et formuler un apprentissage de la séance.','Répartir les petits groupes sans relancer une opposition.'];
 if(exercise.id==='rondo-expand')values=['Les deux bleus récupèrent dans le petit carré.','Trouver un extérieur disponible, puis accompagner dans le grand carré.','Les huit bleus étirent le grand espace ; les cinq rouges changent immédiatement de rôle.'];
 if(exercise.id==='possession-quadrants')values=['Le centre ou le quadrant voisin devient disponible.','Passer par l’appui ou contourner selon la pression, en gardant une sécurité.','Chaque joueur reste dans son secteur ; les angles changent à l’intérieur du quadrant.'];
 if(exercise.id==='press-goalkick')values=['Le gardien sert un partenaire court.','Le premier défenseur sort ; la couverture ferme l’intérieur. Si la sortie est battue, se reconnecter.','Le gardien et son grand but sont derrière la relance ; les mini-buts matérialisent ses sorties.'];
 const scenario=typeof bibleCoachScenario==='function'?bibleCoachScenario(exercise,group,options.sequenceIndex):null;
 const variant=scenario&&typeof bibleDesignCoaching==='function'?bibleDesignCoaching(exercise,options.designIndex||0,scenario):null;
 const moments=[];
 if(plan)for(const step of plan.steps){
  if(!['pass','carry','recovery','shot','clearance'].includes(step.action))continue;
  const flight=step.motions.find(m=>m.kind==='ball'),time=step.start+(step.action==='pass'||step.action==='shot'?Math.max(0,(flight?.delay||0)-.03):Math.min(step.duration*.3,.55));
  if(time>.08&&(!moments.length||time-moments.at(-1).time>.15)){const questions={pass:'Avant la passe du '+step.from+' vers le '+step.to+' : le receveur est-il accessible et quelle solution garde-t-il ensuite ?',carry:'Le joueur '+step.from+' a-t-il un espace à attaquer, ou doit-il conserver une solution de passe ?',recovery:'Qui réagit à la récupération : qui propose une sortie et qui protège la perte ?',shot:'L’angle de frappe est-il ouvert ? Qui anticipe un éventuel ballon repoussé ?',clearance:'Quelle zone reçoit le dégagement et qui peut y arriver sans abandonner la sécurité ?'};moments.push({time,step:step.index,title:step.title,question:questions[step.action]});}
 }
 return {trigger:values[0],choice:design&&design.demo!=='base'?design.rule:values[1],spacing:values[2],question:variant?.observation||scenario?.look||values[1],correction:variant?.correction||scenario?.intervene||values[2],moments};
}
