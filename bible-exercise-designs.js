// Trois problèmes de jeu par fiche ; indépendants des séquences chronométrées.
// Adaptations originales du club : les sources de chaque fiche restent explicites.
const bibleExerciseDesigns={
 "warm": [
  {
   "title": "Conduite et espaces libres",
   "rule": "Chacun conduit son ballon et change de direction vers un espace libre.",
   "demo": "base"
  },
  {
   "title": "Changer de surface",
   "rule": "Sur signal visuel, contourner un partenaire sans contact puis repartir avec l’autre pied.",
   "demo": "individual"
  },
  {
   "title": "Regarder avant de repartir",
   "rule": "Arrêter son ballon, annoncer une couleur visible puis repartir dans une direction différente.",
   "demo": "individual-stop"
  }
 ],
 "cool": [
  {
   "title": "Marcher et échanger",
   "rule": "Passes douces et bilan sans opposition.",
   "demo": "base"
  },
  {
   "title": "Expliquer une réussite",
   "rule": "En binôme à l’arrêt, montrer une orientation du corps utile puis échanger doucement.",
   "demo": "quiet"
  },
  {
   "title": "Expliquer une décision",
   "rule": "Un joueur montre un soutien disponible ; le partenaire explique quand l’utiliser en match.",
   "demo": "quiet-return"
  }
 ],
 "passes": [
  {
   "title": "Contrôler puis passer",
   "rule": "Dans chaque triangle, contrôler vers le prochain poste puis suivre sa passe.",
   "demo": "base"
  },
  {
   "title": "Remise au soutien",
   "rule": "Le deuxième poste remet au premier qui sert le troisième ; tourner après l’action.",
   "demo": "technical-return"
  },
  {
   "title": "Trouver le troisième",
   "rule": "Le premier sert le troisième directement si la ligne est libre ; les postes restent décalés.",
   "demo": "technical-direct"
  }
 ],
 "rondo": [
  {
   "title": "Offrir deux angles",
   "rule": "Conserver autour des défenseurs avec touches libres.",
   "demo": "base"
  },
  {
   "title": "Ressortir de la pression",
   "rule": "Le défenseur ferme le voisin ; utiliser le soutien de l’autre côté plutôt que forcer.",
   "demo": "recycle"
  },
  {
   "title": "Franchir si ouvert",
   "rule": "Chercher le partenaire opposé seulement quand la trajectoire entre les défenseurs est ouverte.",
   "demo": "split"
  }
 ],
 "triangle": [
  {
   "title": "Appui remise troisième",
   "rule": "Donner à l’appui, accompagner la remise et servir le troisième lancé.",
   "demo": "base"
  },
  {
   "title": "Appui marqué",
   "rule": "Si le défenseur ferme l’appui, conserver avec un soutien puis chercher le troisième.",
   "demo": "bypass"
  },
  {
   "title": "Appui qui se retourne",
   "rule": "Si la pression ne vient pas dans son dos, l’appui contrôle vers l’avant et progresse.",
   "demo": "turn"
  }
 ],
 "build": [
  {
   "title": "Sortir par un côté",
   "rule": "Depuis le départ, créer un angle court et un relais plus haut.",
   "demo": "base"
  },
  {
   "title": "Axe fermé",
   "rule": "Contourner le premier rideau par un soutien extérieur ; ne pas imposer le pivot.",
   "demo": "bypass"
  },
  {
   "title": "Pression attirée",
   "rule": "Revenir au soutien bas puis ressortir du côté libéré.",
   "demo": "recycle"
  }
 ],
 "press": [
  {
   "title": "Pression coordonnée",
   "rule": "Sur passe latérale, le proche sort et le partenaire couvre l’intérieur.",
   "demo": "base"
  },
  {
   "title": "Passe de retour",
   "rule": "Le défenseur de couverture coulisse pendant que le premier accompagne le retour du ballon.",
   "demo": "press-return"
  },
  {
   "title": "Premier rideau dépassé",
   "rule": "Si la passe élimine le premier défenseur, revenir à l’intérieur au lieu de poursuivre seul.",
   "demo": "press-beaten"
  }
 ],
 "trap": [
  {
   "title": "Orienter vers la touche",
   "rule": "Presser de l’intérieur vers l’extérieur avec une couverture derrière.",
   "demo": "base"
  },
  {
   "title": "Le porteur ressort",
   "rule": "Si le porteur revient en soutien, coulisser sans ouvrir l’axe.",
   "demo": "press-return"
  },
  {
   "title": "Le piège est évité",
   "rule": "Le ballon sort du côté fermé ; reformer la couverture avant une nouvelle sortie.",
   "demo": "press-beaten"
  }
 ],
 "cover": [
  {
   "title": "Pression et couverture",
   "rule": "Un défenseur ralentit le porteur, le second protège derrière et à l’intérieur.",
   "demo": "base"
  },
  {
   "title": "Changer le premier défenseur",
   "rule": "Sur passe adverse, inverser pression et couverture sans sortir à deux sur le ballon.",
   "demo": "press-return"
  },
  {
   "title": "Duel perdu",
   "rule": "Le second ralentit le nouveau porteur et le premier revient couvrir l’axe.",
   "demo": "press-beaten"
  }
 ],
 "block": [
  {
   "title": "Bloc compact",
   "rule": "Coulisser vers le ballon en conservant des hauteurs différentes.",
   "demo": "base"
  },
  {
   "title": "Renversement adverse",
   "rule": "Pendant la circulation, fermer le côté opposé ensemble sans suivre chacun son adversaire.",
   "demo": "press-return"
  },
  {
   "title": "Passe entre les lignes",
   "rule": "Le joueur proche ralentit, les autres ferment l’axe et se reconnectent.",
   "demo": "press-beaten"
  }
 ],
 "transition": [
  {
   "title": "Réagir à la perte",
   "rule": "Le proche intervient, les partenaires ferment les sorties proches.",
   "demo": "base"
  },
  {
   "title": "Le premier pressing est sorti",
   "rule": "Protéger l’axe et reculer ensemble si la récupération immédiate est impossible.",
   "demo": "retreat"
  },
  {
   "title": "Récupérer puis sécuriser",
   "rule": "Après récupération réelle, trouver une passe de sécurité hors de la densité.",
   "demo": "regain-safe"
  }
 ],
 "counter": [
  {
   "title": "Première passe vers l’avant",
   "rule": "Après récupération, trouver un partenaire avancé puis accompagner.",
   "demo": "base"
  },
  {
   "title": "Axe fermé",
   "rule": "Sortir par le joueur large et accompagner sans courir dans le même couloir.",
   "demo": "wide"
  },
  {
   "title": "Avantage refermé",
   "rule": "Si le retour adverse ferme la progression, revenir au soutien et reconstruire.",
   "demo": "recycle"
  }
 ],
 "switch": [
  {
   "title": "Attirer et renverser",
   "rule": "Fixer un côté puis relier le partenaire éloigné par un relais.",
   "demo": "base"
  },
  {
   "title": "Renversement fermé",
   "rule": "Conserver du côté du ballon si la grande passe est interceptable.",
   "demo": "recycle"
  },
  {
   "title": "Changer de relais",
   "rule": "Utiliser un soutien bas avant de trouver le côté faible, sans diagonale forcée.",
   "demo": "switch-low"
  }
 ],
 "overlap": [
  {
   "title": "Dédoublement extérieur",
   "rule": "Fixer puis servir l’appel extérieur si le défenseur ferme l’intérieur.",
   "demo": "base"
  },
  {
   "title": "Appel intérieur",
   "rule": "Le soutien passe dans le demi-espace quand le défenseur protège le couloir extérieur.",
   "demo": "underlap"
  },
  {
   "title": "Défenseur qui accompagne",
   "rule": "Si l’appel est suivi, le porteur conserve et progresse dans l’espace libéré.",
   "demo": "carry"
  }
 ],
 "finish": [
  {
   "title": "Préparer sa frappe",
   "rule": "Le dernier contrôle ouvre un angle de frappe sans imposer une touche.",
   "demo": "base"
  },
  {
   "title": "Remise avant le tir",
   "rule": "Si le défenseur ferme la frappe directe, remettre au soutien décalé qui finit.",
   "demo": "finish-layoff"
  },
  {
   "title": "Décaler le gardien",
   "rule": "Le porteur fixe puis sert un partenaire de l’autre côté pour finir dans le but disponible.",
   "demo": "finish-square"
  }
 ],
 "cutback": [
  {
   "title": "Arriver en retrait",
   "rule": "Le centreur atteint le fond, un soutien arrive derrière la première ligne.",
   "demo": "base"
  },
  {
   "title": "Zone en retrait fermée",
   "rule": "Le centreur conserve avec un soutien si le receveur est marqué ; rejouer vers le fond.",
   "demo": "recycle"
  },
  {
   "title": "Premier poteau libre",
   "rule": "Si le défenseur protège le retrait, un attaquant attaque le premier poteau au bon moment.",
   "demo": "nearpost"
  }
 ],
 "duel": [
  {
   "title": "Fixer en un contre un",
   "rule": "Attaquer l’espace libre en gardant le ballon hors de portée.",
   "demo": "base"
  },
  {
   "title": "Utiliser le soutien",
   "rule": "Si le défenseur ferme la conduite, remettre puis se déplacer pour recevoir de nouveau.",
   "demo": "return"
  },
  {
   "title": "Défenseur en recul",
   "rule": "Avancer avec maîtrise jusqu’à ce que le défenseur s’engage ; changer alors de direction.",
   "demo": "carry"
  }
 ],
 "support": [
  {
   "title": "Sortir de l’ombre",
   "rule": "Le receveur se décale hors de la ligne ballon–défenseur avant la passe.",
   "demo": "base"
  },
  {
   "title": "Soutien suivi",
   "rule": "Si le défenseur accompagne le premier soutien, utiliser un autre angle disponible.",
   "demo": "bypass"
  },
  {
   "title": "Remise et nouvel angle",
   "rule": "Recevoir sous pression, remettre puis sortir à nouveau de l’ombre.",
   "demo": "return"
  }
 ],
 "cpa-attack": [
  {
   "title": "Courses coordonnées",
   "rule": "Déclencher les courses sur le signal du tireur, sans tous attaquer la même zone.",
   "demo": "base"
  },
  {
   "title": "Corner court",
   "rule": "Jouer court, déplacer le premier défenseur puis servir la surface si la ligne s’ouvre.",
   "demo": "corner-short"
  },
  {
   "title": "Second ballon",
   "rule": "Après dégagement défensif, un soutien hors surface récupère pendant que la sécurité reste en place.",
   "demo": "second-ball"
  }
 ],
 "cpa-defence": [
  {
   "title": "Voir ballon et adversaire",
   "rule": "Protéger les zones annoncées et accompagner les courses sans bloquer irrégulièrement.",
   "demo": "base"
  },
  {
   "title": "Corner court adverse",
   "rule": "Un défenseur sort au court, un partenaire garde la couverture de sa zone.",
   "demo": "corner-def-short"
  },
  {
   "title": "Après le dégagement",
   "rule": "Ressortir ensemble sur le second ballon sans abandonner un adversaire resté dans la surface.",
   "demo": "second-ball-def"
  }
 ],
 "keeper-feet": [
  {
   "title": "Deux angles de relance",
   "rule": "Le gardien observe et choisit le soutien accessible.",
   "demo": "base"
  },
  {
   "title": "Côté fermé",
   "rule": "Un défenseur ferme la première sortie ; le gardien utilise le soutien de l’autre côté.",
   "demo": "keeper-switch"
  },
  {
   "title": "Remise au gardien",
   "rule": "Le soutien pressé revient au gardien, qui change l’angle de la sortie.",
   "demo": "keeper-return"
  }
 ],
 "keeper-duel": [
  {
   "title": "Réduire l’angle",
   "rule": "Le gardien se place dans l’axe ballon–but et ajuste sa sortie au contrôle du porteur.",
   "demo": "base"
  },
  {
   "title": "Contrôle long",
   "rule": "Le gardien avance sur un ballon qui s’échappe réellement du porteur.",
   "demo": "keeper-close"
  },
  {
   "title": "Attaquant excentré",
   "rule": "Le gardien coulisse dans son angle et protège son premier poteau ; pas de sortie imposée.",
   "demo": "keeper-angle"
  }
 ],
 "touch": [
  {
   "title": "Court puis soutien",
   "rule": "Proposer une solution courte et une solution intérieure dès la touche.",
   "demo": "base"
  },
  {
   "title": "Court marqué",
   "rule": "Servir le soutien décalé si le partenaire proche est suivi.",
   "demo": "bypass"
  },
  {
   "title": "Retour au lanceur",
   "rule": "Après la touche, le lanceur entre sur le terrain pour offrir une passe de retour.",
   "demo": "return"
  }
 ],
 "freegame": [
  {
   "title": "Observer le principe choisi",
   "rule": "Jeu libre avec un objectif de séance annoncé ; décisions laissées aux joueurs.",
   "demo": "base"
  },
  {
   "title": "Sortie sous pression",
   "rule": "Exemple de reconstruction : revenir au soutien et déplacer la pression.",
   "demo": "recycle"
  },
  {
   "title": "Attaque d’un espace libre",
   "rule": "Exemple de progression : avancer si le porteur n’est pas attaqué puis servir un appel.",
   "demo": "carry"
  }
 ],
 "scan-receive": [
  {
   "title": "Voir avant la réception",
   "rule": "Regarder avant la passe et contrôler vers le prochain poste.",
   "demo": "base"
  },
  {
   "title": "Soutien fermé",
   "rule": "Scanner puis remettre au passeur si l’orientation prévue n’est pas disponible.",
   "demo": "technical-return"
  },
  {
   "title": "Orientation opposée",
   "rule": "Changer le sens de circulation sur signal annoncé avant la passe, sans geste précipité.",
   "demo": "technical-direct"
  }
 ],
 "wall-pass": [
  {
   "title": "Remise et appel",
   "rule": "Donner à l’appui, remettre au soutien puis servir la course ; retours séparés.",
   "demo": "base"
  },
  {
   "title": "Appui plus haut",
   "rule": "L’appui démarre plus haut : ajuster le dosage et la distance de soutien pour conserver une remise accessible.",
   "demo": "reference-wide"
  },
  {
   "title": "Remise vers l’autre angle",
   "rule": "Le soutien se déplace de l’autre côté du piquet ; la remise et l’appel s’adaptent.",
   "demo": "reference-angle"
  }
 ],
 "receive-back": [
  {
   "title": "Protéger et remettre",
   "rule": "Recevoir dos à la cible et remettre quand le défenseur ferme le retournement.",
   "demo": "base"
  },
  {
   "title": "Retourner côté libre",
   "rule": "Si le défenseur reste à distance, orienter le contrôle vers l’avant.",
   "demo": "turn"
  },
  {
   "title": "Appui suivi",
   "rule": "Le passeur devient soutien décalé pour éviter une remise dans l’axe du défenseur.",
   "demo": "return"
  }
 ],
 "escape-turn": [
  {
   "title": "Premier contact hors pression",
   "rule": "Regarder le côté libre avant de recevoir et s’en échapper.",
   "demo": "base"
  },
  {
   "title": "Retournement fermé",
   "rule": "Protéger puis remettre au soutien ; le retournement n’est jamais obligatoire.",
   "demo": "return"
  },
  {
   "title": "Défenseur déséquilibré",
   "rule": "Faire croire à la remise puis conduire du côté libéré si l’espace existe.",
   "demo": "turn"
  }
 ],
 "rondo-direction": [
  {
   "title": "Fenêtre ouverte",
   "rule": "Une passe traversante vaut un point si elle rejoint un partenaire maîtrisant le ballon.",
   "demo": "base"
  },
  {
   "title": "Fenêtre fermée",
   "rule": "Conserver autour, déplacer la pression puis réévaluer la passe intérieure.",
   "demo": "recycle"
  },
  {
   "title": "Trouver un autre intervalle",
   "rule": "Utiliser le soutien opposé avant une nouvelle tentative de franchissement.",
   "demo": "split"
  }
 ],
 "possession-neutral": [
  {
   "title": "Relais libre",
   "rule": "Le joker offre un angle différent des partenaires et joue avec l’équipe en possession.",
   "demo": "base"
  },
  {
   "title": "Joker suivi",
   "rule": "Le porteur utilise un partenaire extérieur si le joker est enfermé.",
   "demo": "bypass"
  },
  {
   "title": "Remise du joker",
   "rule": "Le joker sous pression remet face au jeu à un soutien décalé.",
   "demo": "return"
  }
 ],
 "possession-endzones": [
  {
   "title": "Arriver dans la cible",
   "rule": "Recevoir dans l’en-but sur un appel, sans y attendre en permanence.",
   "demo": "base"
  },
  {
   "title": "Profondeur fermée",
   "rule": "Revenir au soutien, attirer la ligne puis relancer un appel dans la cible.",
   "demo": "recycle"
  },
  {
   "title": "Appel opposé",
   "rule": "Le porteur fixe un côté et sert l’appel du côté éloigné.",
   "demo": "depth-wide"
  }
 ],
 "break-lines": [
  {
   "title": "Passe qui franchit",
   "rule": "Repérer une ligne ouverte au-delà du premier rideau.",
   "demo": "base"
  },
  {
   "title": "Conduite qui fixe",
   "rule": "Si personne ne sort sur le porteur, conduire pour attirer avant de transmettre.",
   "demo": "carry"
  },
  {
   "title": "Ligne fermée",
   "rule": "Utiliser le soutien et changer l’angle ; ne pas imposer une passe entre les défenseurs.",
   "demo": "recycle"
  }
 ],
 "attract-release": [
  {
   "title": "Fixer puis libérer",
   "rule": "Attirer un adversaire pour libérer un partenaire éloigné.",
   "demo": "base"
  },
  {
   "title": "Pression qui attend",
   "rule": "Si personne ne sort, avancer avec le ballon au lieu de multiplier des passes inutiles.",
   "demo": "carry"
  },
  {
   "title": "Passe lointaine fermée",
   "rule": "Passer par le soutien bas pour déplacer la pression avant le renversement.",
   "demo": "switch-low"
  }
 ],
 "build-three": [
  {
   "title": "Première ligne ouverte",
   "rule": "Offrir des hauteurs et des largeurs complémentaires depuis la relance.",
   "demo": "base"
  },
  {
   "title": "Un côté enfermé",
   "rule": "Revenir au soutien bas pour sortir par le côté opposé.",
   "demo": "switch-low"
  },
  {
   "title": "Porteur libre",
   "rule": "Le joueur bas conduit jusqu’à fixer le premier adversaire puis transmet.",
   "demo": "carry"
  }
 ],
 "build-pivot": [
  {
   "title": "Pivot accessible",
   "rule": "Recevoir de profil ou remettre selon la pression dans le dos.",
   "demo": "base"
  },
  {
   "title": "Pivot marqué",
   "rule": "Utiliser le partenaire extérieur plutôt que forcer la passe axiale.",
   "demo": "bypass"
  },
  {
   "title": "Pivot libre de tourner",
   "rule": "Le pivot regarde puis contrôle vers l’avant si personne ne vient dans son dos.",
   "demo": "turn"
  }
 ],
 "build-switch": [
  {
   "title": "Trouver la sortie libre",
   "rule": "Identifier sortie axiale ou latérale selon la pression.",
   "demo": "base"
  },
  {
   "title": "Retour par la base",
   "rule": "Le soutien bas relie les côtés lorsque la passe directe est fermée.",
   "demo": "switch-low"
  },
  {
   "title": "Sortie directe disponible",
   "rule": "Avancer par la conduite si le porteur dispose d’un espace sans adversaire.",
   "demo": "carry"
  }
 ],
 "thirdman-depth": [
  {
   "title": "Appui remise profondeur",
   "rule": "Le troisième démarre pendant la remise pour recevoir lancé.",
   "demo": "base"
  },
  {
   "title": "Appui fermé",
   "rule": "Jouer avec un soutien latéral avant de rechercher le troisième.",
   "demo": "bypass"
  },
  {
   "title": "Profondeur fermée",
   "rule": "Le troisième reste en soutien si la défense recule ; conserver plutôt que forcer.",
   "demo": "return"
  }
 ],
 "forward-runs": [
  {
   "title": "Départ sur passeur disponible",
   "rule": "Déclencher la course quand le passeur peut réellement jouer devant.",
   "demo": "base"
  },
  {
   "title": "Passeur sous pression",
   "rule": "Reporter l’appel et revenir en soutien pour conserver.",
   "demo": "recycle"
  },
  {
   "title": "Appel diagonal",
   "rule": "Changer de couloir pendant l’appel pour sortir de l’alignement du défenseur.",
   "demo": "depth-wide"
  }
 ],
 "wide-isolate": [
  {
   "title": "Servir le joueur large",
   "rule": "Écarter le receveur et maintenir un soutien intérieur.",
   "demo": "base"
  },
  {
   "title": "Prise à deux",
   "rule": "Revenir au soutien intérieur si un deuxième défenseur ferme le duel.",
   "demo": "return"
  },
  {
   "title": "Duel favorable",
   "rule": "Recevoir puis conduire vers l’espace libre si le défenseur est isolé.",
   "demo": "carry"
  }
 ],
 "underlap": [
  {
   "title": "Course intérieure",
   "rule": "Le soutien attaque le demi-espace quand le porteur fixe le défenseur extérieur.",
   "demo": "base"
  },
  {
   "title": "Intérieur protégé",
   "rule": "Le soutien reste disponible derrière le porteur pour conserver.",
   "demo": "return"
  },
  {
   "title": "Porteur libre à l’extérieur",
   "rule": "L’appel intérieur entraîne le défenseur ; le porteur progresse dans le couloir libéré.",
   "demo": "carry"
  }
 ],
 "box-combine": [
  {
   "title": "Remise pour ouvrir le tir",
   "rule": "Créer un angle de frappe avec un appui et un déplacement.",
   "demo": "base"
  },
  {
   "title": "Tir direct ouvert",
   "rule": "Le porteur finit sans imposer la combinaison quand la ligne de tir est libre.",
   "demo": "finish-direct"
  },
  {
   "title": "Dernière passe",
   "rule": "Le porteur fixe le défenseur et décale un partenaire hors de la ligne du tir.",
   "demo": "finish-square"
  }
 ],
 "finish-opposition": [
  {
   "title": "Finir sous pression",
   "rule": "Lire le défenseur et le gardien avant le dernier contact.",
   "demo": "base"
  },
  {
   "title": "Frappe fermée",
   "rule": "Remettre au soutien pour déplacer le défenseur puis finir.",
   "demo": "finish-layoff"
  },
  {
   "title": "Partenaire mieux placé",
   "rule": "Décaler le partenaire de l’autre côté si le gardien s’engage sur le porteur.",
   "demo": "finish-square"
  }
 ],
 "far-post": [
  {
   "title": "Arrivée second poteau",
   "rule": "Le joueur éloigné attaque le second poteau pendant le centre.",
   "demo": "base"
  },
  {
   "title": "Premier poteau ouvert",
   "rule": "Un attaquant démarre devant le défenseur pendant que l’autre garde une course complémentaire.",
   "demo": "nearpost"
  },
  {
   "title": "Centre impossible",
   "rule": "Conserver avec le soutien intérieur si le centreur est bloqué.",
   "demo": "recycle"
  }
 ],
 "finish-rebound": [
  {
   "title": "Préparer le second ballon",
   "rule": "Un soutien reste derrière la frappe sans venir dans la même zone que le finisseur.",
   "demo": "base"
  },
  {
   "title": "Tir bloqué",
   "rule": "Le finisseur remet au soutien avant la frappe plutôt que forcer.",
   "demo": "finish-layoff"
  },
  {
   "title": "Frappe ouverte",
   "rule": "Finir directement et garder le soutien prêt ; un rebond n’est jamais garanti.",
   "demo": "finish-direct"
  }
 ],
 "press-goalkick": [
  {
   "title": "Fermer une première sortie",
   "rule": "Déclencher ensemble sur la relance et couvrir la passe intérieure.",
   "demo": "base"
  },
  {
   "title": "Retour au gardien",
   "rule": "Accompagner le retour sans ouvrir l’autre sortie de la première ligne.",
   "demo": "press-return"
  },
  {
   "title": "Relance qui dépasse le pressing",
   "rule": "Protéger l’axe et se reconnecter si le premier rideau est éliminé.",
   "demo": "press-beaten"
  }
 ],
 "press-cover-three": [
  {
   "title": "Pression couverture équilibre",
   "rule": "Le proche presse, le deuxième couvre, le troisième protège le côté faible.",
   "demo": "base"
  },
  {
   "title": "Ballon de l’autre côté",
   "rule": "Redistribuer les trois rôles sur la passe adverse.",
   "demo": "press-return"
  },
  {
   "title": "Premier défenseur éliminé",
   "rule": "La couverture ralentit pendant que le premier revient fermer l’intérieur.",
   "demo": "press-beaten"
  }
 ],
 "block-two-lines": [
  {
   "title": "Deux lignes liées",
   "rule": "Garder l’espace entre les lignes protégé pendant le déplacement du ballon.",
   "demo": "base"
  },
  {
   "title": "Circulation latérale",
   "rule": "Coulisser les deux lignes ensemble, sans sortir un milieu trop loin du bloc.",
   "demo": "press-return"
  },
  {
   "title": "Réception entre les lignes",
   "rule": "Le proche intervient, la ligne derrière protège la profondeur.",
   "demo": "press-beaten"
  }
 ],
 "defend-depth": [
  {
   "title": "Voir passeur et appel",
   "rule": "Ajuster la hauteur à la pression réelle sur le passeur.",
   "demo": "base"
  },
  {
   "title": "Passeur libre",
   "rule": "Reculer en gardant ballon et appel dans le champ visuel.",
   "demo": "retreat"
  },
  {
   "title": "Passeur fermé",
   "rule": "Avancer ensemble pendant le retour du ballon sans déclencher un hors-jeu artificiel.",
   "demo": "press-return"
  }
 ],
 "defend-cross": [
  {
   "title": "Protéger l’intérieur",
   "rule": "Un joueur freine le centre, les autres voient ballon et adversaires dans la surface.",
   "demo": "base"
  },
  {
   "title": "Centre en retrait",
   "rule": "Le défenseur intérieur garde un angle pour fermer le retrait, sans tous reculer sur le gardien.",
   "demo": "cross-cutback"
  },
  {
   "title": "Centreur bloqué",
   "rule": "Accompagner le retour intérieur et ressortir de manière coordonnée.",
   "demo": "press-return"
  }
 ],
 "defend-outnumbered": [
  {
   "title": "Temporiser en infériorité",
   "rule": "Ralentir et protéger l’accès direct au but sans se jeter.",
   "demo": "base"
  },
  {
   "title": "Porteur excentré",
   "rule": "Orienter vers l’extérieur pendant que le second défenseur ferme la passe intérieure.",
   "demo": "press-return"
  },
  {
   "title": "Premier défenseur dépassé",
   "rule": "La couverture temporise à son tour pendant le retour du partenaire.",
   "demo": "press-beaten"
  }
 ],
 "recovery-firstpass": [
  {
   "title": "Sortir par la première passe",
   "rule": "À la récupération, trouver une solution utile hors de la pression proche.",
   "demo": "base"
  },
  {
   "title": "Vers l’avant disponible",
   "rule": "Le nouveau porteur sert un soutien haut et accompagne à une autre hauteur.",
   "demo": "wide"
  },
  {
   "title": "Vers l’avant fermé",
   "rule": "Conserver avec une passe de sécurité avant de reconstruire.",
   "demo": "regain-safe"
  }
 ],
 "counter-wide": [
  {
   "title": "Écarter la contre-attaque",
   "rule": "Un appel large libère la progression du porteur dans l’axe.",
   "demo": "base"
  },
  {
   "title": "Axe fermé",
   "rule": "Servir l’appel large puis accompagner dans un couloir différent.",
   "demo": "wide"
  },
  {
   "title": "Retour adverse réussi",
   "rule": "Freiner l’attaque et revenir au soutien pour conserver.",
   "demo": "recycle"
  }
 ],
 "secure-regain": [
  {
   "title": "Reconnaître l’avantage",
   "rule": "Après récupération, lire les solutions avant de choisir projection ou sécurité.",
   "demo": "base"
  },
  {
   "title": "Sécurité d’abord",
   "rule": "Trouver le soutien derrière le ballon quand les passes devant sont fermées.",
   "demo": "regain-safe"
  },
  {
   "title": "Projection disponible",
   "rule": "Servir le partenaire avancé puis soutenir sans vider la zone derrière.",
   "demo": "wide"
  }
 ],
 "counterpress-escape": [
  {
   "title": "Fermer les sorties proches",
   "rule": "Après perte, le proche ralentit et les partenaires ferment les passes accessibles.",
   "demo": "base"
  },
  {
   "title": "Première sortie adverse réussie",
   "rule": "Renoncer à une poursuite isolée et protéger l’intérieur en repli.",
   "demo": "retreat"
  },
  {
   "title": "Récupération obtenue",
   "rule": "Sortir de la densité avec un soutien puis écarter.",
   "demo": "regain-safe"
  }
 ],
 "rest-defence": [
  {
   "title": "Équilibre derrière l’attaque",
   "rule": "Deux soutiens protègent l’axe et la profondeur pendant l’action offensive.",
   "demo": "base"
  },
  {
   "title": "Perte pendant l’attaque",
   "rule": "Le joueur de sécurité proche ralentit, l’autre garde la profondeur.",
   "demo": "retreat"
  },
  {
   "title": "Adversaire bloqué",
   "rule": "Revenir à la base pour conserver l’équilibre et changer de côté.",
   "demo": "switch-low"
  }
 ],
 "retreat-delay": [
  {
   "title": "Ralentir puis protéger",
   "rule": "Le proche ralentit le contre, les autres reviennent côté intérieur.",
   "demo": "base"
  },
  {
   "title": "Passe adverse latérale",
   "rule": "Profiter du temps de passe pour resserrer l’axe et changer le joueur qui intervient.",
   "demo": "press-return"
  },
  {
   "title": "Repli réussi",
   "rule": "Une fois le bloc reformé, retrouver pression et couverture sans se jeter.",
   "demo": "press-beaten"
  }
 ],
 "throw-progression": [
  {
   "title": "Solution courte et soutien",
   "rule": "Créer deux solutions accessibles dès la touche.",
   "demo": "base"
  },
  {
   "title": "Court suivi",
   "rule": "Utiliser la solution intérieure plus éloignée si la passe courte est fermée.",
   "demo": "bypass"
  },
  {
   "title": "Retour au lanceur",
   "rule": "Le lanceur entre après sa remise pour créer un nouveau soutien.",
   "demo": "return"
  }
 ],
 "corner-secondball": [
  {
   "title": "Préparer la zone de chute",
   "rule": "Un soutien reste à la sortie de surface et un autre protège la transition.",
   "demo": "base"
  },
  {
   "title": "Récupérer le dégagement",
   "rule": "Le soutien contrôle le ballon dégagé puis trouve une solution hors pression.",
   "demo": "second-ball"
  },
  {
   "title": "Dégagement récupéré adverse",
   "rule": "La sécurité ralentit pendant que les attaquants reviennent à l’intérieur.",
   "demo": "second-ball-def"
  }
 ],
 "freekick-restart": [
  {
   "title": "Jouer quand c’est disponible",
   "rule": "Reconnaître une relance courte autorisée et une option plus haute.",
   "demo": "base"
  },
  {
   "title": "Option rapide fermée",
   "rule": "Prendre le temps de replacer les soutiens avant de repartir court.",
   "demo": "return"
  },
  {
   "title": "Adversaire compact",
   "rule": "Utiliser le soutien large au lieu d’imposer la passe dans le bloc.",
   "demo": "bypass"
  }
 ],
 "keeper-distribute": [
  {
   "title": "Arrêt puis relance",
   "rule": "Le gardien stabilise le ballon et repère un soutien libre.",
   "demo": "base"
  },
  {
   "title": "Première sortie fermée",
   "rule": "Le gardien conserve un temps d’observation puis sert le soutien opposé.",
   "demo": "keeper-switch"
  },
  {
   "title": "Soutien sous pression",
   "rule": "Le receveur revient au gardien si nécessaire, puis offrir une nouvelle sortie.",
   "demo": "keeper-return"
  }
 ],
 "duel-renforts": [
  {
   "title": "Entrées annoncées",
   "rule": "Un bleu puis un rouge rejoignent le duel au signal ; un seul ballon reste en jeu.",
   "demo": "base"
  },
  {
   "title": "Renfort côté libre",
   "rule": "Le deuxième bleu entre large et donne un angle au porteur avant le retour rouge.",
   "demo": "reinforce-wide"
  },
  {
   "title": "Retour défensif intérieur",
   "rule": "Le rouge entrant protège l’axe avant d’attaquer le ballon ; le bleu conserve un soutien.",
   "demo": "reinforce-cover"
  }
 ]
};
function bibleExerciseDesign(exercise,index=0){return bibleExerciseDesigns[exercise.id]?.[Math.max(0,Math.min(2,Number(index)||0))]||null;}
// Full-team occupation. The first actors retain the authored problem; supporting
// roles use the whole useful area, while defenders protect interior and depth.
function bibleDesignedPlacement(exercise,group,field,tokens,index){
 const design=bibleExerciseDesign(exercise,index);if(!design)return;
 const template=group.template||bibleDiagramKnowledge(exercise).template,m=bibleDiagramMechanism(exercise).type;
 const {fx,fy,fw,fh,scale}=field,teams=team=>tokens.filter(p=>p.team===team&&!p.rotation&&(!p.keeper||p.fieldKeeper)),blue=teams('blue'),red=teams('red'),neutral=teams('neutral');
 const set=(p,x,y,role)=>{if(!p)return;Object.assign(p,{x:fx+x*fw,y:fy+y*fh,long:x*group.length,wide:y*group.width,role});};
 if(exercise.id==='rondo-expand'){
  red.forEach((p,i)=>{const angle=-Math.PI/2+i*2*Math.PI/5;set(p,.5+.225*Math.cos(angle),.5+.225*Math.sin(angle),'Conserver dans le petit carré');});
  blue.slice(0,2).forEach((p,i)=>set(p,.45+i*.12,index===1?.55:.46+i*.1,'Défendre le 5v2'));
  blue.slice(2).forEach((p,i)=>{const angle=-Math.PI/2+i*2*Math.PI/6;set(p,.5+.43*Math.cos(angle),.5+.43*Math.sin(angle),'Solution extérieure pour le 8v5');});return;
 }
 if(exercise.id==='possession-quadrants'){
  blue.forEach((p,i)=>set(p,i%2?.72:.23,i<2?.24:.76,'Bleu · secteur '+(i+1)));
  red.forEach((p,i)=>set(p,i%2?.82:.35,i<2?.15:.85,'Rouge · secteur '+(i+1)));
  set(neutral[0],.045,.5,'Appui de départ');set(neutral[1],.955,.5,'Appui opposé');set(neutral[2],.5,.5,'Appui central protégé');
  if(index===1){set(blue[2],.24,.84,'Autre angle dans le secteur 3');set(red[0],.38,.37,'Fermer le centre');}
  if(index===2){set(blue[0],.35,.25,'Soutien dans le secteur 1');set(blue[2],.18,.67,'Nouvel angle dans le secteur 3');}return;
 }

 if(template==='circuit'){
  if(exercise.id==='warm'||exercise.id==='cool')return;
  if(index>0)for(const station of bibleCircuitStations(group,field)){const ids=tokens.filter(p=>p.number>station.offset&&p.number<=station.offset+station.players);ids.slice(0,3).forEach((p,i)=>{const anchors=index===1?[[.17,.7],[.48,.2],[.83,.66]]:[[.2,.73],[.76,.65],[.5,.18]],a=anchors[i];Object.assign(p,{x:station.x+station.w*a[0],y:station.y+station.h*a[1]});p.long=(p.x-fx)/scale;p.wide=(p.y-fy)/scale;});}return;
 }
 if(template==='rondo'){
  if(index>0){blue.forEach((p,i)=>{const angle=-Math.PI/2+i*2*Math.PI/blue.length+(index===2?.16:0);set(p,.5+.39*Math.cos(angle),.5+.38*Math.sin(angle),'Soutien extérieur');});red.forEach((p,i)=>set(p,.43+(i%2)*.13,.27+(i+1)*.46/(red.length+1),'Fermer une ligne de passe'));}return;
 }
 if(m==='reinforcements'){
  if(index===0&&['finish','keeper'].includes(template)){set(blue[0],.43,.22,'Service / soutien');set(blue[1],.68,.48,'Finisseur');set(blue[2],.39,.8,'Soutien complémentaire');set(red[0],.8,.37,'Défenseur proche');set(red[1],.86,.68,'Couverture');}
  if(index>0){set(blue[1],.12,index===1?.82:.2,'Renfort offensif au signal');set(red[1],.21,index===2?.51:.81,'Renfort défensif au signal');}return;
 }
 // Keep the short, deliberately local structure of corners, finishing and goalkeeper duels.
 if(['corner','finish','wide-finish','keeper'].includes(template)){
  if(template==='corner'){blue.slice(3).forEach((p,i)=>set(p,.57+(i%2)*.09,.23+(i+1)*.62/(Math.max(1,blue.length-3)+1),'Second ballon / sécurité'));red.slice(2).forEach((p,i)=>set(p,.84+(i%2)*.05,.22+(i+1)*.58/(Math.max(1,red.length-2)+1),'Protéger la surface'));}
  else{blue.slice(3).forEach((p,i)=>set(p,.28+(i%2)*.13,.16+(i+1)*.68/(Math.max(1,blue.length-3)+1),'Soutien / prochain départ'));red.slice(2).forEach((p,i)=>set(p,.76+(i%2)*.08,.22+(i+1)*.58/(Math.max(1,red.length-2)+1),'Protéger le but'));}
  if(index>0){set(blue[1],template==='corner'?.81:.63,index===1?.24:.72,'Soutien décalé');set(blue[2],.77,index===1?.69:.37,'Course complémentaire');}return;
 }
 const keep=['possession','four-goals'].includes(template),end=template==='endzones'&&!((group.material.goals||0)+(group.material.gates||0)+(group.material.miniGoals||0)),zone=end?group.zoneDimensions?.[1]:null;
 const sx=x=>zone?(zone.x+x*zone.length)/group.length:x;
 // Additional attackers: widths and staggered heights, not a second compact grid.
 const extraBlue=[[.12,.51],[.47,.13],[.55,.87],[.79,.66],[.26,.33],[.73,.32],[.39,.66],[.85,.16]],extraRed=[[.76,.85],[.87,.29],[.47,.83],[.33,.52],[.74,.15],[.59,.47],[.88,.71],[.43,.17]];
 blue.slice(3).forEach((p,i)=>{const a=extraBlue[i%extraBlue.length];set(p,sx(a[0]),Math.max(.08,Math.min(.92,a[1]+Math.floor(i/extraBlue.length)*.045)),['Soutien bas','Relais entre les lignes','Largeur / profondeur'][i%3]);});
 red.slice(3).forEach((p,i)=>{const a=extraRed[i%extraRed.length];set(p,sx(a[0]),Math.max(.08,Math.min(.92,a[1]-Math.floor(i/extraRed.length)*.045)),i%2?'Couverture / profondeur':'Fermer un intervalle');});
 neutral.forEach((p,i)=>set(p,sx(i===0?.48:(i%2?.17:.83)),i===0?.51:(i%2?.13:.87),'Appui de l’équipe en possession'));

 if(index===0){
  const fullGame=!m,anchors=keep?[[.19,.15],[.23,.85],[.72,.17]]:template==='press'?[[.2,.15],[.34,.84],[.73,.52]]:[[.17,.17],[.33,.83],[.69,.37]];
  if(fullGame&&template==='transition'){
   const occupation=(team,start,end)=>{const count=team.length,pattern={1:[1],2:[2],3:[1,2],4:[2,2],5:[2,2,1],6:[2,2,2],7:[2,3,2],8:[3,3,2],9:[3,3,3],10:[3,4,3]}[count]||Array.from({length:Math.ceil(count/4)},(_,i)=>Math.floor(count/Math.ceil(count/4))+(i<count%Math.ceil(count/4)?1:0));let cursor=0;for(let line=0;line<pattern.length;line++){const size=pattern[line],x=start+(end-start)*(pattern.length===1?.5:line/(pattern.length-1)),inset=size===2?.16+line*.045:.12;for(let rank=0;rank<size;rank++){const y=size===1?.48:inset+rank*(1-2*inset)/(size-1)+(team===red?.025:-.015)*(line%2?1:-1);set(team[cursor++],sx(x),y,line===0?'Base / sécurité':line===pattern.length-1?'Largeur et profondeur':'Relais');}}};occupation(blue,.15,.73);occupation(red,.86,.29);return;
  }
  if(fullGame){blue.slice(0,3).forEach((p,i)=>set(p,sx(anchors[i][0]),anchors[i][1],['Porteur / départ','Soutien décalé','Solution plus haute'][i]));
   const defend=template==='press'?[[.51,.27],[.69,.51],[.63,.79]]:[[.43,.32],[.58,.69],[.78,.45]];red.slice(0,3).forEach((p,i)=>set(p,sx(defend[i][0]),defend[i][1],i===0?'Pression':'Couverture / équilibre'));
  }
  return;
 }

 const code=design.demo;
 if(['return','recycle','switch-low','regain-safe'].includes(code)){set(blue[0],sx(.37),.35,'Porteur');set(blue[1],sx(.18),.67,'Soutien de sécurité');set(blue[2],sx(.68),.82,'Solution éloignée');set(red[0],sx(.55),.36,'Fermer le jeu vers l’avant');set(red[1],sx(.62),.61,'Couverture intérieure');}
 if(['bypass','split','wide','depth-wide'].includes(code)){set(blue[0],sx(.2),.49,'Porteur');set(blue[1],sx(.49),.3,'Relais surveillé');set(blue[2],sx(.72),.8,'Autre angle / largeur');set(red[0],sx(.51),.41,'Fermer le relais');set(red[1],sx(.61),.62,'Couverture');}
 if(['carry','turn','underlap'].includes(code)){set(blue[0],sx(.3),.3,'Porteur');set(blue[1],sx(.49),.68,'Soutien / appel');set(blue[2],sx(.76),.19,'Profondeur');set(red[0],sx(.61),.39,'Défenseur du porteur');set(red[1],sx(.76),.64,'Couverture');}
 if(code==='press-return'||code==='press-beaten'){set(blue[0],sx(.23),.23,'Porteur adverse');set(blue[1],sx(.43),.75,'Receveur adverse');set(blue[2],sx(.73),.38,'Solution adverse plus haute');red.forEach((p,i)=>set(p,sx(.52+(i%2)*.16),.19+(i+1)*.62/(red.length+1),i===0?'Pression':i===1?'Couverture intérieure':'Équilibre du bloc'));}
}

bibleExerciseDesigns['rondo-expand']=[{title:'Sortir dès la récupération',rule:'Deux bleus récupèrent puis trouvent un extérieur ; le 8v5 occupe le grand carré.',demo:'expand-direct'},{title:'Première sortie fermée',rule:'Le premier extérieur est pressé : conserver avec un soutien du côté opposé avant de ressortir.',demo:'expand-safe'},{title:'Changer de côté après la sortie',rule:'Après la première passe extérieure, les huit bleus déplacent la pression vers le côté éloigné.',demo:'expand-switch'}];
bibleExerciseDesigns['possession-quadrants']=[{title:'Passer par l’appui central',rule:'Connecter l’appui protégé puis le partenaire du quadrant suivant sans quitter son secteur.',demo:'quadrant-central'},{title:'Contourner le centre',rule:'Si la passe axiale est fermée, relier un autre quadrant avant l’appui de bout.',demo:'quadrant-around'},{title:'Revenir pour progresser',rule:'Revenir à l’appui de départ puis changer de quadrant pour déplacer la pression.',demo:'quadrant-return'}];
// Extra reading stays optional. Evaluation concerns the decision, never completion
// of the displayed pass sequence at any cost.
function bibleDesignCoaching(exercise,index,scenario){
 const d=bibleExerciseDesign(exercise,index);if(!d)return null;
 const cues={
  return:['Le soutien est visible avant la réception et se replace après sa remise.','Décaler le soutien pour éviter une remise dans la ligne du défenseur ; rejouer le même service.'],
  recycle:['Le retour conserve une possibilité de progresser à la passe suivante.','Faire repérer l’option fermée puis montrer une nouvelle ligne ; ne pas imposer un retour si l’avant est libre.'],
  bypass:['Le porteur reconnaît le relais marqué et trouve un autre angle.','Présenter une fois le relais libre, une fois marqué ; laisser le porteur comparer ses deux choix.'],
  'switch-low':['Le soutien bas reçoit avec le côté opposé dans son champ de vision.','Replacer le soutien derrière la pression, à une autre hauteur que le porteur.'],
  turn:['Le receveur a regardé dans son dos avant de choisir le contrôle vers l’avant.','Changer la distance du défenseur ; accepter la remise si la pression interdit de tourner.'],
  carry:['La conduite attire un adversaire avant de libérer la passe.','Faire identifier qui sort sur le ballon. Si personne ne sort, laisser avancer ; si le duel est fermé, utiliser un soutien.'],
  split:['La passe traverse un intervalle ouvert au moment où elle part.','Figer avant la transmission : la fenêtre existe-t-elle encore ? Sinon, conserver autour.'],
  underlap:['Le porteur et le soutien utilisent deux couloirs et deux temps de course différents.','Décaler le départ du soutien et demander au porteur de regarder avant de servir.'],
  'press-return':['Le rôle de premier défenseur change avec la circulation adverse.','Figer sur la passe, faire nommer pression, couverture et équilibre puis rejouer.'],
  'press-beaten':['La couverture protège la cible pendant que le joueur dépassé revient dans l’axe.','Réduire la poursuite individuelle : replacer le premier joueur à l’intérieur et reconnecter les distances.'],
  retreat:['Le proche ralentit sans se jeter ; les autres reviennent entre le ballon et leur cible.','Repérer le danger le plus direct et attribuer une mission différente à chaque défenseur.'],
  'regain-safe':['La première passe éloigne le ballon de la pression et laisse une deuxième solution.','Proposer une solution de sécurité décalée plutôt qu’une passe en retrait dans l’axe du presseur.'],
  'finish-layoff':['La remise crée un angle de frappe et ne ramène pas le ballon dans le duel.','Déplacer le soutien hors de la ligne porteur–défenseur et autoriser un contrôle.'],
  'finish-square':['La dernière passe atteint un partenaire mieux placé avant que le gardien se rééquilibre.','Échelonner les deux attaquants ; ne pas imposer la passe si le porteur a déjà une frappe favorable.'],
  nearpost:['Le receveur arrive devant le défenseur au moment du service, sans attendre au poteau.','Rejouer plus lentement le signal du centreur ; garder une autre course complémentaire.'],
  'technical-return':['La remise reste accessible au soutien, qui voit déjà le troisième poste.','Autoriser un contrôle, ralentir les départs et corriger les distances avant de limiter les touches.'],
  'technical-direct':['Le changement de sens conserve des angles et un poste suivant prêt.','Faire nommer le receveur avant la passe puis conserver le numéro de chaque joueur pendant la rotation.']
 };
 let observation=scenario.look,correction=scenario.intervene;
 if(cues[d.demo])[observation,correction]=cues[d.demo];
 if(d.demo.startsWith('quadrant-')){observation='Le receveur change son angle dans son quadrant et conserve une passe de sécurité ; aucun joueur ne traverse une frontière pour réussir le circuit montré.';correction='Figer avant la réception, montrer le défenseur et deux angles possibles à l’intérieur du secteur, puis rejouer.';}
 if(d.demo.startsWith('expand-')){observation='Dès l’interception, les huit bleus offrent des angles dans le grand carré et les cinq rouges défendent ; les extérieurs ne viennent pas tous au ballon.';correction='Rejouer l’instant de récupération et faire montrer une sortie de chaque côté avant de reprendre librement.';}
 return {title:d.title,observation,correction};
}
