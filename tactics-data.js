/* Repères pédagogiques : attaque vers le haut du terrain. */
const formationNames=["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "3-4-3", "4-1-4-1", "4-4-1-1", "4-3-1-2", "4-1-2-1-2", "4-2-2-2", "4-3-2-1", "3-4-2-1", "3-4-1-2", "3-1-4-2", "3-3-3-1", "5-3-2", "5-4-1", "5-2-3", "4-2-4", "3-2-4-1", "2-3-5"];
const tacticsCatalogue=[
  {
    "category": "Défendre",
    "title": "Pressing haut",
    "formation": "4-3-3",
    "goal": "Récupérer près du but adverse.",
    "steps": [
      "Le 9 oriente la relance vers un côté.",
      "L’ailier sort sur le latéral, le milieu proche ferme la passe intérieure.",
      "Le bloc avance ensemble et le côté opposé se resserre."
    ],
    "attention": "Surveiller la profondeur si le premier rideau est éliminé.",
    "pattern": "press"
  },
  {
    "category": "Défendre",
    "title": "Bloc médian compact",
    "formation": "4-4-2",
    "goal": "Fermer l’axe avant de déclencher le pressing.",
    "steps": [
      "Les deux lignes de quatre restent proches.",
      "Les attaquants masquent les milieux adverses.",
      "Déclencher sur une passe latérale lente ou un contrôle manqué."
    ],
    "attention": "Ne pas laisser trop d’espace entre les lignes.",
    "pattern": "compact"
  },
  {
    "category": "Défendre",
    "title": "Bloc bas",
    "formation": "5-4-1",
    "goal": "Protéger la surface et limiter les occasions franches.",
    "steps": [
      "Reculer ensemble en gardant une distance de sortie.",
      "Les milieux protègent l’entrée de la surface.",
      "Garder une solution de sortie devant."
    ],
    "attention": "Éviter de subir sans pouvoir ressortir ; défendre les centres en retrait.",
    "pattern": "low"
  },
  {
    "category": "Défendre",
    "title": "Piège sur le côté",
    "formation": "4-4-2",
    "goal": "Enfermer le porteur près de la ligne de touche.",
    "steps": [
      "Orienter la relance vers le latéral adverse.",
      "L’ailier presse de l’intérieur vers l’extérieur.",
      "Le latéral avance et le milieu ferme le retour dans l’axe."
    ],
    "attention": "Le joueur opposé doit couvrir le renversement.",
    "pattern": "right"
  },
  {
    "category": "Défendre",
    "title": "Coulissement du bloc",
    "formation": "4-1-4-1",
    "goal": "Déplacer toute l’équipe du côté du ballon.",
    "steps": [
      "Le joueur proche ralentit le porteur.",
      "Les partenaires ferment les intervalles proches.",
      "Le côté opposé rentre pour garder un bloc compact."
    ],
    "attention": "Ne pas suivre seulement le ballon : garder les adversaires dans le champ de vision.",
    "pattern": "shift"
  },
  {
    "category": "Défendre",
    "title": "Couverture et défense de la profondeur",
    "formation": "4-4-2",
    "goal": "Sécuriser la sortie du défenseur qui intervient.",
    "steps": [
      "Un défenseur sort, son partenaire couvre derrière lui.",
      "La ligne recule si le porteur adverse n’est pas pressé.",
      "Le gardien ajuste sa position pour couvrir les ballons longs."
    ],
    "attention": "Le hors-jeu exige une coordination collective ; ne pas l’appliquer isolément.",
    "pattern": "cover"
  },
  {
    "category": "Construire",
    "title": "Relance courte avec le gardien",
    "formation": "4-3-3",
    "goal": "Créer une première supériorité à la relance.",
    "steps": [
      "Les centraux s’écartent et le gardien offre une solution de retour.",
      "Le 6 se rend disponible hors de l’ombre du pressing.",
      "Trouver un joueur libre plutôt que forcer une passe axiale."
    ],
    "attention": "Si la pression ferme tout, choisir une sortie plus directe.",
    "pattern": "build"
  },
  {
    "category": "Construire",
    "title": "Relance à trois",
    "formation": "3-4-2-1",
    "goal": "Étirer le premier rideau adverse.",
    "steps": [
      "Les trois défenseurs occupent la largeur.",
      "Un milieu vient en soutien, l’autre se place derrière le pressing.",
      "Les pistons offrent des sorties hautes sur les côtés."
    ],
    "attention": "Garder une couverture si un défenseur porte le ballon.",
    "pattern": "build"
  },
  {
    "category": "Construire",
    "title": "Sentinelle entre les centraux",
    "formation": "4-3-3",
    "goal": "Passer temporairement à trois à la relance.",
    "steps": [
      "Le 6 descend entre les deux centraux.",
      "Les latéraux montent pour donner de la largeur.",
      "Les relayeurs proposent une passe après le premier rideau."
    ],
    "attention": "Ne pas vider tout le milieu ; conserver un relais axial.",
    "pattern": "six"
  },
  {
    "category": "Construire",
    "title": "Jeu en triangle",
    "formation": "4-3-3",
    "goal": "Donner deux solutions au porteur.",
    "steps": [
      "Former un triangle avec des angles de passe différents.",
      "Jouer et se déplacer pour recréer une solution.",
      "Utiliser une remise si le partenaire est sous pression."
    ],
    "attention": "Éviter trois joueurs sur la même ligne.",
    "pattern": "triangle"
  },
  {
    "category": "Construire",
    "title": "Troisième homme",
    "formation": "4-2-3-1",
    "goal": "Trouver un joueur libre en passant par un appui.",
    "steps": [
      "A joue sur B qui attire la pression.",
      "B remet vers C déjà en mouvement.",
      "C reçoit face au jeu derrière le premier rideau."
    ],
    "attention": "Synchroniser la course et la remise ; le schéma illustre le principe, pas une séquence obligatoire.",
    "pattern": "triangle"
  },
  {
    "category": "Construire",
    "title": "Possession et patience",
    "formation": "4-3-3",
    "goal": "Déplacer l’adversaire pour ouvrir une ligne de passe.",
    "steps": [
      "Occuper largeur et profondeur.",
      "Revenir en soutien si la passe vers l’avant est fermée.",
      "Accélérer lorsque l’adversaire libère un espace."
    ],
    "attention": "La possession doit créer un avantage, pas seulement accumuler les passes.",
    "pattern": "switch"
  },
  {
    "category": "Attaquer",
    "title": "Renversement de jeu",
    "formation": "4-3-3",
    "goal": "Attaquer le côté laissé libre.",
    "steps": [
      "Fixer plusieurs adversaires sur un côté.",
      "Repasser par un soutien pour changer de côté.",
      "Le joueur opposé reste large puis attaque son duel."
    ],
    "attention": "Assurer la qualité de la passe et la couverture à la perte.",
    "pattern": "switch"
  },
  {
    "category": "Attaquer",
    "title": "Dédoublement du latéral",
    "formation": "4-3-3",
    "goal": "Créer un deux contre un sur l’aile.",
    "steps": [
      "L’ailier fixe le défenseur avec le ballon.",
      "Le latéral passe à l’extérieur au bon moment.",
      "Choisir la passe ou la conduite selon la réaction adverse."
    ],
    "attention": "Un milieu couvre la zone abandonnée par le latéral.",
    "pattern": "overlap"
  },
  {
    "category": "Attaquer",
    "title": "Appel intérieur du latéral",
    "formation": "4-2-3-1",
    "goal": "Attaquer l’intervalle à l’intérieur de l’ailier.",
    "steps": [
      "L’ailier garde la largeur et attire son adversaire.",
      "Le latéral attaque le demi-espace intérieur.",
      "Le milieu se déplace pour libérer le passage."
    ],
    "attention": "Ne pas occuper la même zone que le numéro 10.",
    "pattern": "underlap"
  },
  {
    "category": "Attaquer",
    "title": "Occupation des cinq couloirs",
    "formation": "3-2-4-1",
    "goal": "Répartir les joueurs sur toute la largeur offensive.",
    "steps": [
      "Un joueur occupe chaque couloir sur la ligne offensive.",
      "Échelonner les appuis pour garder des diagonales.",
      "Conserver des joueurs derrière le ballon."
    ],
    "attention": "Les cinq couloirs sont des repères : les permutations restent possibles.",
    "pattern": "five"
  },
  {
    "category": "Attaquer",
    "title": "Surcharge puis isolation",
    "formation": "4-2-3-1",
    "goal": "Attirer le bloc pour libérer un duel à l’opposé.",
    "steps": [
      "Combiner à plusieurs sur un côté.",
      "Le joueur opposé conserve la largeur.",
      "Renverser rapidement puis attaquer le défenseur isolé."
    ],
    "attention": "Éviter de perdre le ballon dans la surcharge.",
    "pattern": "switch"
  },
  {
    "category": "Attaquer",
    "title": "Appels croisés",
    "formation": "4-4-2",
    "goal": "Désorganiser la charnière avec deux courses différentes.",
    "steps": [
      "Un attaquant vient en appui.",
      "Le second attaque la profondeur dans l’espace libéré.",
      "Le porteur lève la tête avant de choisir la passe."
    ],
    "attention": "Rester attentif au hors-jeu et éviter de croiser sans espace.",
    "pattern": "cross"
  },
  {
    "category": "Attaquer",
    "title": "Faux neuf",
    "formation": "4-3-3",
    "goal": "Libérer l’axe par le décrochage de l’avant-centre.",
    "steps": [
      "Le 9 vient entre les lignes.",
      "Un ailier attaque l’espace derrière le défenseur attiré.",
      "Les milieux offrent des appuis pour combiner."
    ],
    "attention": "Un partenaire doit menacer la profondeur pendant le décrochage.",
    "pattern": "false9"
  },
  {
    "category": "Attaquer",
    "title": "Centre en retrait",
    "formation": "4-3-3",
    "goal": "Trouver un joueur lancé derrière la première ligne défensive.",
    "steps": [
      "Déborder jusqu’à une zone de centre favorable.",
      "Un attaquant fixe près du but et un autre arrive en retrait.",
      "Le porteur cherche une passe maîtrisée vers l’entrée de surface."
    ],
    "attention": "Les zones d’arrivée doivent être différentes, avec une couverture derrière.",
    "pattern": "cutback"
  },
  {
    "category": "Transitions",
    "title": "Contre-attaque rapide",
    "formation": "4-2-3-1",
    "goal": "Profiter du déséquilibre adverse après récupération.",
    "steps": [
      "La première passe sort de la pression.",
      "Un joueur attaque la profondeur, un autre accompagne.",
      "Si l’avantage disparaît, conserver et reconstruire."
    ],
    "attention": "Ne pas confondre vitesse d’exécution et précipitation.",
    "pattern": "counter"
  },
  {
    "category": "Transitions",
    "title": "Contre-pressing à la perte",
    "formation": "4-3-3",
    "goal": "Empêcher la première passe adverse après perte.",
    "steps": [
      "Le joueur le plus proche presse immédiatement si le groupe est proche.",
      "Les partenaires ferment les solutions courtes.",
      "Si le pressing est battu, se replier ensemble."
    ],
    "attention": "Ne pas poursuivre seul lorsque les distances sont trop grandes.",
    "pattern": "press"
  },
  {
    "category": "Transitions",
    "title": "Repli défensif",
    "formation": "4-4-2",
    "goal": "Retrouver une organisation derrière le ballon.",
    "steps": [
      "Le plus proche ralentit la progression adverse.",
      "Les autres reviennent vers l’axe et leur but.",
      "Retrouver les lignes avant de ressortir au pressing."
    ],
    "attention": "Protéger d’abord les zones dangereuses plutôt que courir directement vers le ballon.",
    "pattern": "retreat"
  },
  {
    "category": "Transitions",
    "title": "Sécurité derrière l’attaque",
    "formation": "3-2-4-1",
    "goal": "Préparer la défense de la transition adverse.",
    "steps": [
      "Garder une base de joueurs derrière le ballon.",
      "Surveiller les attaquants adverses disponibles.",
      "Réduire les distances pour contester une perte ou reculer ensemble."
    ],
    "attention": "Adapter le nombre de joueurs en sécurité aux adversaires restés devant.",
    "pattern": "cover"
  },
  {
    "category": "Phases arrêtées",
    "title": "Corner offensif · premier poteau",
    "formation": "4-4-2",
    "goal": "Attaquer une zone proche puis le second ballon.",
    "steps": [
      "Un joueur démarre vers le premier poteau.",
      "Les autres échelonnent leurs courses vers l’axe et le second poteau.",
      "Garder une solution courte et une couverture derrière."
    ],
    "attention": "Ne pas gêner irrégulièrement le gardien ou bloquer un défenseur.",
    "pattern": "corner"
  },
  {
    "category": "Phases arrêtées",
    "title": "Corner offensif · joué court",
    "formation": "4-3-3",
    "goal": "Créer un deux contre un avant le centre.",
    "steps": [
      "Un partenaire vient proposer une passe courte.",
      "Le receveur fixe puis combine ou centre.",
      "Les joueurs dans la surface adaptent leurs courses au délai."
    ],
    "attention": "Vérifier les distances et règles applicables à la compétition.",
    "pattern": "shortcorner"
  },
  {
    "category": "Phases arrêtées",
    "title": "Corner défensif · zone",
    "formation": "5-4-1",
    "goal": "Protéger les zones principales de la surface.",
    "steps": [
      "Répartir les responsabilités entre premier poteau, axe et second poteau.",
      "Attaquer le ballon dans sa zone avec communication.",
      "Prévoir la sortie sur un corner court et la gestion du second ballon."
    ],
    "attention": "Le schéma est une base pédagogique ; ajuster les missions aux qualités de vos joueurs.",
    "pattern": "defcorner"
  },
  {
    "category": "Phases arrêtées",
    "title": "Coup franc offensif · indirect",
    "formation": "4-2-3-1",
    "goal": "Coordonner la livraison et les courses dans la surface.",
    "steps": [
      "Identifier le tireur et la zone cible.",
      "Échelonner les départs pour arriver en mouvement.",
      "Placer un joueur au second ballon et conserver une couverture."
    ],
    "attention": "Respecter le signal arbitral et le hors-jeu.",
    "pattern": "freekick"
  },
  {
    "category": "Phases arrêtées",
    "title": "Coup franc défensif · mur et couverture",
    "formation": "4-4-2",
    "goal": "Organiser le mur et les joueurs qui protègent la surface.",
    "steps": [
      "Le gardien dirige le mur et sa propre position.",
      "Les autres défenseurs surveillent les appels et le second ballon.",
      "Sortir ensemble après le dégagement."
    ],
    "attention": "Respecter la distance réglementaire et les consignes de l’arbitre.",
    "pattern": "wall"
  },
  {
    "category": "Phases arrêtées",
    "title": "Touche · appui et profondeur",
    "formation": "4-3-3",
    "goal": "Offrir plusieurs sorties au lanceur.",
    "steps": [
      "Un joueur se démarque en appui court.",
      "Un deuxième menace l’espace derrière.",
      "Un troisième offre une solution de retour après la remise."
    ],
    "attention": "Respecter l’exécution réglementaire ; ne pas rester tous immobiles face au lanceur.",
    "pattern": "throw"
  }
];
