# Séances et exercices : intentions du club et assistant compact

## Classification commune

La bibliothèque, les filtres de séances et l’assistant utilisent les mêmes clés `bmfCategories` et `bmfSubcategories` :

| Intention | Sous-parties |
| --- | --- |
| `ball` — Mon équipe possède le ballon | `ball-build` Construire le jeu ; `ball-control` Maîtriser et déstabiliser ; `ball-finish` Finition |
| `loss` — Mon équipe perd le ballon | `loss-goal` Défendre le but ; `loss-slow` Freiner l’attaque ; `loss-press` Pressing |
| `win` — Mon équipe récupère le ballon | `win-forward` Jouer vers l’avant ; `win-zone3` Chercher la zone 3 ; `win-score` Marquer le but |
| `off` — Mon équipe ne possède pas le ballon | `off-low` Défendre bas ; `off-control` Contrôler l’adversaire ; `off-high` Défendre haut |
| `ludic` — Ludique | `ludic-activation` Échauffement / Activation ; `ludic-situation` Situations réduites ludiques ; `ludic-motor` Coordination & motricité ; `ludic-game` Jeux & défis ; `ludic-cool` Retour au calme |

Les quatre anciennes familles génériques ne constituent plus la navigation principale. La bibliothèque affiche cinq intentions et un seul sélecteur de sous-partie. Les filtres secondaires qui faisaient doublon sont masqués. Un choix de sous-partie active aussi son intention.

`clubExerciseClassification(exercise)` lit l’intention et la sous-partie d’origine. Un libellé reconnu utilise directement la sous-partie validée. Pour les variantes de libellé, la zone explicitement déclarée (1, 2, 3) est rattachée à la grille du club pour cette intention. Les formats échauffement et physique sont rangés dans les sous-parties ludiques correspondantes ; les jeux libres sans zone sont rattachés aux jeux/défis ou aux situations ludiques. Les formats activation et situation portent aussi le mode `ludic` sans effacer leur intention tactique d’origine lorsqu’elle existe.

Le modèle couvre les 1 232 vues de la bibliothèque existante. Aucun contenu technique n’est réécrit pour ce classement. Les sous-parties restent disponibles aussi quand l’intention choisie est Ludique, dans la préparation comme dans les séances enregistrées.

## Index JSON exploitable

`window.clubExerciseIndex` expose l’index dérivé de version 2, sans ajouter de copie indépendante du corpus :

```js
const index = clubExerciseIndex.entries();
const pressing = clubExerciseIndex.find({
  intention: 'loss',
  sous_partie: 'loss-press'
});
const json = JSON.stringify({ version: 2, exercices: index });
```

Chaque entrée contient `id`, `source_id`, `source_view`, `intention`, `sous_partie`, `mode`, `format`, `effectif_min`, `effectif_max`, `gardiens`, `surface`, `dimensions`, `difficulte`, `duree`, `origine` (intention/sous-partie d’origine) et `a_verifier`.

L’ancien index de référence et ses identifiants restent disponibles pour les adaptations et les documents déjà enregistrés. Les nouvelles recommandations utilisent exclusivement les sous-parties sélectionnées et les contraintes d’effectif, de gardiens, de niveau et de surface. Les effectifs incohérents identifiés dans la source restent exclus des recommandations automatiques.

## Assistant

L’objectif libre est remplacé par des cases regroupées par intention. Entre une et quatre sous-parties peuvent être sélectionnées. Les trois autres critères restent le niveau, les joueurs/gardiens et la surface.

```js
const session = trainingAssistantGenerate({
  objectives: ['ball-build', 'loss-press'],
  level: 'U17 Régional',
  players: '14 + 2',
  space: 'half'
});
```

La séance comprend une activation, un atelier par sous-partie, un jeu appliqué et un retour au calme. Le temps d’atelier principal est réparti entre les objectifs, en conservant la durée totale de 75 ou 90 minutes et le nombre de participants de chaque groupe. Les temps de travail, récupération et installation sont recalculés pour chaque atelier. Les consignes du jeu appliqué reprennent les objectifs des ateliers.

Les objectifs sont enregistrés dans `session.assistantObjectives` ; `bmfCategory` et `bmfObjective` conservent l’intention principale pour compatibilité. `trainingSessionIndex` expose toutes les intentions et sous-parties : la même séance se retrouve donc avec chacun des filtres concernés. Les créations personnelles et références conservent leurs mécanismes de stockage existants.

Une référence choisie remplace uniquement l’atelier de la sous-partie correspondante. Les autres ateliers ne sont pas écrasés. Le bloc de référence est copié par l’adaptateur existant, avec ses consignes intégrales.

## Rendu et PDF

Chaque séquence apparaît séparément avec :

- son numéro et son titre ;
- dimensions, durée et nombre d’ateliers ;
- un descriptif court et deux consignes clés maximum ;
- travail / repos / installation.

Les textes longs sont repliés dans « Consignes complètes ». L’abrègement est uniquement visuel : les fiches et consignes enregistrées restent complètes. Le PDF de l’assistant utilise le même rendu court et ne remplace pas la séance actuellement ouverte dans l’éditeur.

## Dénominations et intégrité

Les appellations visibles de la marque de la source sont remplacées par des libellés neutres de référence ou du club, y compris les badges, le filtre de bibliothèque et la présentation des fiches. Les noms d’auteurs, liens de provenance, identifiants internes et documents originaux sont conservés. Les fichiers `supplied-mycoach-engine.js` et les archives HTML fournies ne sont pas modifiés. Le nettoyage concerne la présentation, pas une appropriation ni une réécriture des exercices.

## Fichiers et contrôles

- `exercise-classification.js` : intentions et sous-parties communes.
- `training-club-structure.js` : classification, index JSON, recommandations et cartes synthétiques.
- `exercise-reference-library.js` : filtres et cartes de la bibliothèque.
- `training-assistant-az.js` : choix multiples, génération, sauvegarde et PDF.
- `training-club-structure.css` : formulaire et séquences responsive.
- `training.js`, `training-wizard.js`, `training-bible.js`, `training-session-index.js` : cohérence des sélecteurs et de la recherche des séances.

Tests locaux, serveur port 3016 : `tests/training-club-structure-browser.py`, `tests/training-assistant-az-browser.py`, `tests/exercise-reference-index-browser.py`. Ils vérifient les 1 232 vues, la classification, les séances à 1–4 objectifs, durées/effectifs, persistance et recherche par plusieurs intentions, export concis, affichage mobile et intégrité des exercices originaux.
