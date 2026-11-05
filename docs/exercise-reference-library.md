# Bibliothèque référencée — 257

## Sources et intégrité

Le nouveau fichier MyCoach contient **1 000 exercices**, contre 249 dans la version précédente. Les 249 objets existants sont identiques, y compris les fonctions de disposition, les consignes et les variantes : 751 exercices sont ajoutés sans doublons. Les 84 autres exercices du site restent présents, soit **1 084 exercices et 1 232 vues pédagogiques**.

Le fichier original est archivé sans modification dans `assets/exercises/mycoach-original.html`. L’ancienne version reste dans `mycoach-original-v1.html`. Le manifeste `docs/mycoach-source.json` conserve les empreintes et compteurs. Le moteur utilise le préfixe exact du script fourni, en retirant uniquement le démarrage automatique de la page autonome. Le CSS source est identique. Aucun exercice n’a été réécrit ou généré pour cette intégration.

## Classement et index

Quatre intentions et quatre formats navigables : Conservation & Progression, Déséquilibre & Finition, Transitions OFF/DEF · DEF/OFF, Bloc & Organisation défensive ; Activation, Situations réduites, Jeux thématiques, Oppositions grand terrain.

L’index décrit chaque **vue native** de chaque exercice, afin qu’une même fiche multi-intentions reste trouvable dans plusieurs contextes, tout en apparaissant une seule fois par liste filtrée. Les identifiants d’origine restent ceux des séances enregistrées ; les identifiants `EXO-…-V…` sont des références internes supplémentaires, jamais affichées sur les cartes.

Fichiers :
- `assets/exercises/reference-index.json` : JSON complet lisible.
- `exercise-reference-data.js` : même index embarqué pour un accès synchrone, sans appel API.
- `exercise-reference-ids.js` : identifiants source connus, chargés avant la validation des séances sauvegardées, y compris hors ligne.
- `exercise-reference-index.js` : recherche et recommandations par intention, format, effectif, gardiens, espace et niveau de référence.
- `exercise-reference-library.js/css` : filtres et présentation, aperçus tactiques natifs, badges et actions.

### Sens des métadonnées

Effectifs min/référence/max, dimensions, gardiens, durée et catégorie de référence viennent du fichier. L’intention utilise les moments natifs ; la finition est identifiée à partir de la source/objectif/thème explicites. Le format vient du moment, du type, du modèle et des dimensions. Le libellé de surface est une classe dimensionnelle ; la compatibilité de l’assistant vérifie aussi les dimensions exactes, rotation comprise.

La difficulté est une étiquette dérivée de la catégorie de référence, et non une certification du niveau. Les activités physiques, ludiques ou d’activation sans intention tactique explicite sont marquées `classification_a_verifier` ; elles restent dans Tous sous Activation/travail transversal et ne sont pas recommandées automatiquement comme atelier tactique. Les règles originales restent la référence.

Une incohérence de source est signalée pour `mc-defendre-trois-quarts` : référence de deux joueurs avec un gardien, alors que l’intégration demande au moins deux joueurs de champ par groupe. `effectif_a_verifier` exclut cette fiche des recommandations automatiques ; la fiche originale reste consultable et les paramètres incohérents ne sont pas ajoutés silencieusement. L’audit d’ajout à l’effectif de référence passe pour les 1 083 autres fiches.

## Assistant et ajout

L’assistant A à Z propose jusqu’à trois fiches compatibles pour l’atelier principal. Voir l’exercice ouvre la fiche originale ; Utiliser dans l’atelier principal remplace uniquement cette phase par le bloc importé depuis le moteur d’origine, conserve les quatre phases et recalcule la durée totale. Les autres phases et les exercices sources ne sont pas modifiés. Les avertissements natifs restent proposés au coach.

Les cartes permettent Voir l’exercice et Ajouter à ma séance. L’ajout réutilise `suppliedExerciseBlock`, la validation, les variantes et les mécanismes de persistance existants.

## Génération et tests

Régénérer l’index après une mise à jour de source :

```sh
node scripts/build-exercise-reference-index.cjs
```

Tests :

```sh
python3 tests/exercise-reference-index-browser.py
python3 tests/mycoach-exercises-browser.py
python3 tests/training-assistant-az-browser.py
```

Ils vérifient les 249 exercices historiques inchangés, l’identité des modèles d’animation avec la source, les 1 000 exercices nouveaux/anciens, le classement, les gardiens/effectifs/surfaces, l’ajout d’un nouvel identifiant puis son rechargement, le remplacement d’atelier dans l’assistant et l’affichage mobile.

## Exemple réel de fiche d’indexation

```json
{
  "id": "EXO-CONS-MC-SEUL-CA-VIENT-V1",
  "source_id": "mc-seul-ca-vient",
  "source_view": 1,
  "intention": "conservation",
  "sous_categorie": "circuit",
  "phase": "activation",
  "effectif_min": 6,
  "effectif_max": 9,
  "surface": "1/4 terrain",
  "difficulte": "U17-Seniors",
  "duree": 12
}
```
