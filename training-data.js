// Fiches éditoriales du club ; pas des exercices homologués ou classés par diplôme FFF.
const trainingExercises=[
  {
    "id": "warm",
    "title": "Activation avec ballon",
    "theme": "Activation",
    "method": "Exercice",
    "kind": "circuit",
    "target": 6,
    "width": 20,
    "length": 20,
    "goal": "Préparer le groupe avec ballon et prises d’informations.",
    "rules": [
      "Conduire librement puis changer de direction au signal.",
      "Passer à un partenaire disponible puis occuper un espace libre.",
      "Augmenter progressivement le rythme."
    ],
    "cues": [
      "Lever la tête avant de recevoir.",
      "Faire varier les surfaces de contact."
    ],
    "easier": "Réduire le rythme, supprimer les contraintes de pied.",
    "harder": "Ajouter une prise d’information sur une couleur avant la passe.",
    "success": "Chaque joueur est en mouvement avec une maîtrise du ballon adaptée au rythme."
  },
  {
    "id": "cool",
    "title": "Retour au calme et bilan",
    "theme": "Retour au calme",
    "method": "Exercice",
    "kind": "circuit",
    "target": 8,
    "width": 20,
    "length": 20,
    "goal": "Faire redescendre progressivement l’intensité et recueillir un apprentissage.",
    "rules": [
      "Marcher puis échanger le ballon à faible intensité.",
      "Chaque joueur formule une réussite et un point à reprendre.",
      "Ranger le matériel ensemble."
    ],
    "cues": [
      "Écouter les perceptions du groupe.",
      "Garder un bilan court et concret."
    ],
    "easier": "Questionner le groupe par binômes.",
    "harder": "Faire reformuler un principe de jeu par un joueur.",
    "success": "Le groupe peut citer le principe travaillé sans ajouter de charge physique."
  },
  {
    "id": "passes",
    "title": "Passer et se déplacer",
    "theme": "Technique",
    "method": "Exercice",
    "kind": "circuit",
    "target": 5,
    "width": 20,
    "length": 18,
    "goal": "Enchaîner passe, contrôle orienté et replacement.",
    "rules": [
      "Créer plusieurs appuis autour de la zone.",
      "Après chaque passe, rejoindre un autre poste.",
      "Alterner les sens et les distances."
    ],
    "cues": [
      "Présenter un angle de passe.",
      "Orienter le premier contrôle vers la suite."
    ],
    "easier": "Autoriser plusieurs touches et raccourcir les passes.",
    "harder": "Introduire un défenseur passif puis actif en adaptant le circuit.",
    "success": "Le receveur peut jouer la passe suivante sans se retourner inutilement."
  },
  {
    "id": "rondo",
    "title": "Conserver sous pression",
    "theme": "Conservation",
    "method": "Jeu",
    "kind": "possession",
    "target": 6,
    "width": 20,
    "length": 20,
    "goal": "Garder des solutions autour du porteur.",
    "rules": [
      "Les joueurs extérieurs conservent dans la zone.",
      "Les défenseurs cherchent à récupérer sans contact excessif.",
      "À la récupération ou à la sortie, permuter les rôles à la série suivante."
    ],
    "cues": [
      "Se déplacer hors de l’ombre du défenseur.",
      "Proposer une passe de retour."
    ],
    "easier": "Agrandir la zone et autoriser toutes les touches.",
    "harder": "Réduire légèrement la zone ou ajouter un défenseur après réussite.",
    "success": "Le porteur dispose régulièrement de deux solutions visibles."
  },
  {
    "id": "triangle",
    "title": "Trouver le troisième homme",
    "theme": "Relance",
    "method": "Situation",
    "kind": "duel",
    "target": 6,
    "width": 24,
    "length": 22,
    "goal": "Utiliser une remise pour trouver un joueur face au jeu.",
    "rules": [
      "L’équipe cherche un appui entre les lignes.",
      "Un partenaire se rend disponible pour la remise.",
      "Permuter les rôles à chaque série, avec opposition progressive."
    ],
    "cues": [
      "Regarder avant de recevoir.",
      "Synchroniser l’appel et la remise."
    ],
    "easier": "Défenseur retardé et appui libre.",
    "harder": "Opposition libre avec point bonus si le troisième homme progresse.",
    "success": "La remise trouve un partenaire orienté vers la cible."
  },
  {
    "id": "build",
    "title": "Sortir de la pression",
    "theme": "Relance",
    "method": "Situation",
    "kind": "game",
    "target": 8,
    "width": 34,
    "length": 30,
    "goal": "Progresser depuis une zone de départ vers une porte.",
    "rules": [
      "Démarrer près du but ou de la ligne de fond.",
      "Chercher la porte libre avec des appuis écartés.",
      "Si la première passe est fermée, conserver une solution derrière."
    ],
    "cues": [
      "Le porteur choisit selon la pression.",
      "Maintenir largeur et soutien."
    ],
    "easier": "Laisser une supériorité à la relance avec un appui.",
    "harder": "Départ sous pression immédiate et transition à la récupération.",
    "success": "Une sortie maîtrisée dépasse la première ligne sans passe forcée."
  },
  {
    "id": "press",
    "title": "Déclencher le pressing ensemble",
    "theme": "Pressing",
    "method": "Situation",
    "kind": "duel",
    "target": 6,
    "width": 26,
    "length": 24,
    "goal": "Coordonner la sortie du premier défenseur et la fermeture des passes.",
    "rules": [
      "L’équipe avec ballon cherche une porte de sortie.",
      "Déclencher sur passe lente, contrôle manqué ou réception dos au jeu.",
      "Si le premier rideau est battu, se replier vers l’axe."
    ],
    "cues": [
      "Orienter avant d’intervenir.",
      "Ne pas presser seul si les partenaires sont trop loin."
    ],
    "easier": "Réduire les solutions de relance adverses.",
    "harder": "Ajouter une porte opposée pour obliger le bloc à couvrir.",
    "success": "La sortie du premier défenseur s’accompagne d’une fermeture des relais."
  },
  {
    "id": "trap",
    "title": "Enfermer sur le côté",
    "theme": "Pressing",
    "method": "Jeu",
    "kind": "game",
    "target": 8,
    "width": 32,
    "length": 26,
    "goal": "Orienter le jeu adverse vers une zone latérale.",
    "rules": [
      "Les équipes marquent en franchissant une porte.",
      "Le défenseur proche ferme l’axe et oriente vers la touche.",
      "À la récupération, sortir de la zone par une passe contrôlée."
    ],
    "cues": [
      "Coulisser à plusieurs.",
      "Surveiller le renversement."
    ],
    "easier": "Définir une seule porte de sortie.",
    "harder": "Autoriser plusieurs sorties et changer le côté de départ.",
    "success": "Le porteur est ralenti sans ouvrir une passe directe dans l’axe."
  },
  {
    "id": "cover",
    "title": "Cadrer, couvrir et coulisser",
    "theme": "Défense",
    "method": "Situation",
    "kind": "duel",
    "target": 6,
    "width": 26,
    "length": 24,
    "goal": "Échelonner les défenseurs pour protéger l’espace derrière le duel.",
    "rules": [
      "Le défenseur proche ralentit le porteur.",
      "Le partenaire couvre en retrait et ferme l’intérieur.",
      "Permuter les rôles et les côtés à chaque série."
    ],
    "cues": [
      "Défendre de profil.",
      "Ajuster la couverture à la vitesse du porteur."
    ],
    "easier": "Attaque à vitesse réduite.",
    "harder": "Ajouter un appel dans le dos, puis un appui offensif.",
    "success": "Un défenseur couvre effectivement la sortie du partenaire."
  },
  {
    "id": "block",
    "title": "Défendre l’axe en bloc",
    "theme": "Défense",
    "method": "Jeu",
    "kind": "game",
    "target": 10,
    "width": 40,
    "length": 32,
    "goal": "Réduire les intervalles dans un bloc compact.",
    "rules": [
      "Marquer dans des portes placées derrière la ligne adverse.",
      "Le bloc défensif se déplace du côté du ballon.",
      "À la récupération, chercher une sortie sécurisée."
    ],
    "cues": [
      "Distances entre partenaires.",
      "Voir le ballon et la menace directe."
    ],
    "easier": "Utiliser une cible axiale unique.",
    "harder": "Ajouter une cible extérieure pour travailler le coulissement.",
    "success": "Les passes axiales dangereuses sont limitées sans abandonner la profondeur."
  },
  {
    "id": "transition",
    "title": "Réagir à la perte",
    "theme": "Transitions",
    "method": "Jeu",
    "kind": "possession",
    "target": 6,
    "width": 22,
    "length": 22,
    "goal": "Choisir entre pression immédiate et protection de l’axe.",
    "rules": [
      "Conserver dans la zone.",
      "À chaque perte, les plus proches ferment les solutions courtes.",
      "Si le groupe est trop étiré, revenir protéger la cible."
    ],
    "cues": [
      "Regarder les distances, pas seulement le ballon.",
      "Se parler au changement de possession."
    ],
    "easier": "Agrandir l’espace et laisser une passe de sécurité.",
    "harder": "Ajouter une porte à attaquer après récupération.",
    "success": "La réaction à la perte est collective plutôt qu’une course isolée."
  },
  {
    "id": "counter",
    "title": "Se projeter à la récupération",
    "theme": "Transitions",
    "method": "Situation",
    "kind": "game",
    "target": 8,
    "width": 36,
    "length": 28,
    "goal": "Profiter d’un avantage après changement de possession.",
    "rules": [
      "À la récupération, identifier la cible libre.",
      "Un joueur attaque la profondeur, un autre accompagne.",
      "Si l’avantage disparaît, conserver."
    ],
    "cues": [
      "Première passe hors de la pression.",
      "Éviter la précipitation."
    ],
    "easier": "Donner un départ en supériorité temporaire.",
    "harder": "Rendre la récupération aléatoire dans un jeu continu.",
    "success": "La première décision après récupération exploite ou sécurise la situation."
  },
  {
    "id": "switch",
    "title": "Fixer puis renverser",
    "theme": "Largeur",
    "method": "Jeu",
    "kind": "game",
    "target": 8,
    "width": 38,
    "length": 28,
    "goal": "Libérer un espace à l’opposé de la pression.",
    "rules": [
      "Conserver sur un côté pour attirer le bloc.",
      "Chercher un soutien puis jouer vers l’autre côté.",
      "Le receveur opposé conserve une position large."
    ],
    "cues": [
      "Lever la tête avant le renversement.",
      "Préparer la réception ouverte."
    ],
    "easier": "Joueur opposé protégé dans une zone.",
    "harder": "Libérer la défense sur toute la largeur.",
    "success": "Le renversement permet au receveur de progresser dans un espace libre."
  },
  {
    "id": "overlap",
    "title": "Combiner sur un côté",
    "theme": "Largeur",
    "method": "Situation",
    "kind": "duel",
    "target": 6,
    "width": 28,
    "length": 22,
    "goal": "Créer un deux contre un avec un appel extérieur ou intérieur.",
    "rules": [
      "Le porteur fixe son défenseur.",
      "Le partenaire choisit un appel dans l’espace libre.",
      "Après l’action, les rôles tournent entre porteur, soutien et défenseur."
    ],
    "cues": [
      "Ne pas faire l’appel trop tôt.",
      "Conserver une solution si la passe est fermée."
    ],
    "easier": "Défenseur retardé.",
    "harder": "Défenseur actif et transition vers une autre porte.",
    "success": "L’appel crée une solution utilisable sans occuper la zone du porteur."
  },
  {
    "id": "finish",
    "title": "Finir après une passe",
    "theme": "Finition",
    "method": "Exercice",
    "kind": "finish",
    "target": 6,
    "width": 28,
    "length": 24,
    "goal": "Orienter la première touche pour terminer l’action.",
    "rules": [
      "Jouer une passe vers un partenaire en mouvement.",
      "Contrôler vers le but ou la porte puis terminer.",
      "Tourner entre passeur, finisseur et opposition éventuelle."
    ],
    "cues": [
      "Regarder la cible avant de frapper.",
      "Privilégier précision et équilibre."
    ],
    "easier": "Sans défenseur, distance courte.",
    "harder": "Introduire un défenseur en poursuite.",
    "success": "Le joueur termine avec un geste maîtrisé plutôt qu’une frappe forcée."
  },
  {
    "id": "cutback",
    "title": "Conclure un centre en retrait",
    "theme": "Finition",
    "method": "Situation",
    "kind": "finish",
    "target": 7,
    "width": 32,
    "length": 28,
    "goal": "Échelonner les arrivées devant le but.",
    "rules": [
      "Un joueur déborde vers une zone latérale.",
      "Les partenaires occupent deux hauteurs différentes.",
      "Le centreur choisit une solution selon la défense."
    ],
    "cues": [
      "Ne pas tous courir vers le but.",
      "Arriver lancé plutôt qu’attendre immobile."
    ],
    "easier": "Cibles matérialisées, défense passive.",
    "harder": "Défense active et transition après dégagement.",
    "success": "Le centre trouve une arrivée différente de la première ligne défensive."
  },
  {
    "id": "duel",
    "title": "Gagner son duel et protéger",
    "theme": "Duels",
    "method": "Situation",
    "kind": "duel",
    "target": 4,
    "width": 18,
    "length": 16,
    "goal": "Progresser ou conserver selon l’orientation du défenseur.",
    "rules": [
      "Démarrer par une passe ou une conduite.",
      "Le porteur choisit une des portes.",
      "Permuter les rôles après chaque séquence courte."
    ],
    "cues": [
      "Changer de rythme après avoir fixé.",
      "Défendre sans se jeter."
    ],
    "easier": "Porte élargie et défenseur retardé.",
    "harder": "Réduire le temps de jeu ou ajouter une transition.",
    "success": "Le changement de direction ou de rythme crée un avantage observable."
  },
  {
    "id": "support",
    "title": "Se démarquer entre les lignes",
    "theme": "Démarquage",
    "method": "Jeu",
    "kind": "duel",
    "target": 6,
    "width": 26,
    "length": 22,
    "goal": "Sortir de l’ombre du défenseur pour recevoir orienté.",
    "rules": [
      "L’équipe cherche un appui dans une zone intermédiaire.",
      "Le receveur se déplace avant la passe.",
      "Après réception, jouer vers la cible opposée."
    ],
    "cues": [
      "Regarder par-dessus l’épaule.",
      "Offrir une position de trois quarts."
    ],
    "easier": "Appui protégé et touches libres.",
    "harder": "Défense libre dans la zone de réception.",
    "success": "Le receveur voit une suite possible avant de toucher le ballon."
  },
  {
    "id": "cpa-attack",
    "title": "Organiser un corner offensif",
    "theme": "CPA",
    "method": "Situation",
    "kind": "cpa",
    "target": 10,
    "width": 40,
    "length": 35,
    "goal": "Coordonner courses, livraison et sécurité du second ballon.",
    "rules": [
      "Définir les zones de départ et une cible prioritaire.",
      "Échelonner les appels sans blocage irrégulier.",
      "Prévoir le second ballon et la couverture du contre."
    ],
    "cues": [
      "Une course par zone.",
      "Ne pas gêner irrégulièrement le gardien."
    ],
    "easier": "Répéter les courses sans opposition.",
    "harder": "Ajouter une défense active et une sortie après dégagement.",
    "success": "Chaque joueur identifie sa mission et sa réaction si le ballon est repoussé."
  },
  {
    "id": "cpa-defence",
    "title": "Défendre un corner",
    "theme": "CPA",
    "method": "Situation",
    "kind": "cpa",
    "target": 10,
    "width": 40,
    "length": 35,
    "goal": "Répartir les responsabilités dans la surface.",
    "rules": [
      "Identifier premier poteau, axe, second poteau et sortie sur corner court.",
      "Attaquer le ballon dans sa zone de responsabilité.",
      "Sortir ensemble sur le second ballon."
    ],
    "cues": [
      "Communiquer avec le gardien.",
      "Voir les courses adverses."
    ],
    "easier": "Livraisons lentes et zones matérialisées.",
    "harder": "Varier corner direct, court et centre en retrait.",
    "success": "La zone du second ballon et la sortie courte sont prises en charge."
  },
  {
    "id": "keeper-feet",
    "title": "Relance et jeu au pied du gardien",
    "theme": "Gardiens",
    "method": "Situation",
    "kind": "game",
    "target": 6,
    "width": 28,
    "length": 24,
    "goal": "Associer le gardien à une relance orientée.",
    "rules": [
      "Proposer deux soutiens au gardien.",
      "Choisir le partenaire libre en fonction de la pression.",
      "Faire tourner les rôles de pression et de soutien."
    ],
    "cues": [
      "Regarder avant de recevoir.",
      "Préparer une passe de retour."
    ],
    "easier": "Sans pressing puis défense retardée.",
    "harder": "Pressing libre avec deux sorties possibles.",
    "success": "La décision du gardien trouve un partenaire disponible sans précipitation."
  },
  {
    "id": "keeper-duel",
    "title": "Gardien : cadrage et sortie",
    "theme": "Gardiens",
    "method": "Situation",
    "kind": "finish",
    "target": 5,
    "width": 24,
    "length": 22,
    "goal": "Ajuster placement et décision face à un porteur.",
    "rules": [
      "Démarrer à distance courte avec vitesse contrôlée.",
      "Le gardien se place selon l’angle et décide de temporiser ou intervenir.",
      "Permuter les rôles et garder des séquences courtes."
    ],
    "cues": [
      "Décision avant engagement.",
      "Garder une progression technique maîtrisée."
    ],
    "easier": "Porteur ralenti et finition annoncée.",
    "harder": "Choix de finition libre avec accompagnement technique du coach.",
    "success": "Le placement réduit l’angle sans engagement tardif ou incontrôlé."
  },
  {
    "id": "touch",
    "title": "Conserver sur une touche",
    "theme": "CPA",
    "method": "Jeu",
    "kind": "duel",
    "target": 6,
    "width": 24,
    "length": 20,
    "goal": "Créer une solution courte, une profondeur et un soutien.",
    "rules": [
      "Relancer depuis une ligne de touche matérialisée.",
      "Les partenaires répartissent les trois solutions.",
      "Faire tourner le lanceur et les rôles à chaque série."
    ],
    "cues": [
      "Se déplacer avant le lancer.",
      "Respecter les règles de remise en jeu."
    ],
    "easier": "Opposition retardée.",
    "harder": "Défense active et poursuite du jeu après la réception.",
    "success": "Le lanceur dispose de plusieurs solutions à des hauteurs différentes."
  },
  {
    "id": "freegame",
    "title": "Jeu de réinvestissement",
    "theme": "Jeu global",
    "method": "Jeu",
    "kind": "game",
    "target": 12,
    "width": 45,
    "length": 36,
    "goal": "Retrouver le principe travaillé dans un jeu plus libre.",
    "rules": [
      "Jouer vers les buts ou des portes selon le matériel.",
      "Donner un seul bonus en lien avec le thème de séance.",
      "Retirer ensuite le bonus pour observer le transfert."
    ],
    "cues": [
      "Interventions courtes du coach.",
      "Observer avant de corriger."
    ],
    "easier": "Agrandir l’espace et ajouter un appui.",
    "harder": "Retirer les aides et laisser les décisions libres.",
    "success": "Le principe travaillé apparaît sans rappel constant du coach."
  }
];
