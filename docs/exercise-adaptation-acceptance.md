# Étape 9 · Adaptations des exercices

21 octobre 2026. Les contrôles logiciels sont terminés ; l’essai représentatif sur
le terrain reste à effectuer par un éducateur. Les bornes d’effectif et d’espace
sont des repères éditoriaux de la fiche, pas une norme fédérale.

## Corrections et contrôles

- [x] Le jeu unique ne contourne plus le format de la fiche : 40 joueurs dans un
  rondo ne deviennent pas compatibles par le seul agrandissement du rectangle.
  Le choix « Tous ensemble » reste affiché et n’est pas divisé automatiquement.
- [x] Rôles réels, opposition, appuis, gardiens actifs et gardiens en rotation comptés
  dans l’effectif ; besoins minimums et maxima des formats contrôlés.
- [x] Catégorie et compétences influencent rapports d’opposition, dimensions,
  contraintes de jeu et fractionnement des répétitions.
- [x] Propositions explicites : ateliers équilibrés, groupe actif sur un seul terrain
  avec joueurs en rotation comptés, autres exercices compatibles du même thème.
  Changer d’exercice demande de relire son objectif, sans remplacement silencieux.
- [x] Chaque proposition est recalculée et contrôlée dans l’espace disponible,
  dégagements et matériel compris. Aucun ajout fictif de gardiens ou de joueurs.
- [x] Choisir un groupe actif modifie uniquement la séquence choisie ; appliquer
  aux autres séquences reste une action distincte du coach.
- [x] Toutes les séquences doivent être compatibles avant ajout à la séance ; la
  variante choisie est conservée. Une installation incompatible n’est pas animée.
- [x] Les récupérations intermédiaires sont incluses dans le total de récupération,
  et retirées du total d’activité effective. La durée du bloc reste inchangée.
- [x] 1 008 configurations des 63 exercices : 1 021 propositions compatibles
  contrôlées, effectifs/rotations et budgets de temps exacts.
- [x] Audit complémentaire : 2 268 profils/effectifs, 6 669 ateliers, 5 928 variantes
  et 6 504 animations compatibles ; tests des trajectoires et identités conservés.
- [x] Choix des adaptations, indépendance des séquences, ajout, variantes personnelles,
  passage rapport → séance et téléphone vérifiés dans Chromium.

## Essai terrain représentatif à effectuer

Ces exemples sont issus du calcul du logiciel sur terrain entier. Installer les
repères, annoncer la règle, jouer une répétition puis vérifier avec le coach :
angles réellement disponibles, fréquence de participation, compréhension des rôles,
rythme réalisable et sécurité des rotations. Réajuster sans assimiler « compatible »
à « adapté à tous les groupes de ce niveau ».

| Exemple | Installation calculée | Observation attendue |
|---|---|---|
| Rondo, 6 U14, découverte | 5 contre 1 · 13 × 13 m | Deux soutiens visibles, réussite avant nouvelle contrainte |
| Même rondo, confirmé | 4 contre 2 · 10 × 10 m | Lire une pression réellement accrue, sans imposer la passe fermée |
| Passes, 14 U17 | 5 / 5 / 4 ; 20 × 18 m, 20 × 18 m et 18 × 16 m | Rotations sans files gênantes ni croisements entre circuits |
| Pressing, 14 U17 | Deux ateliers : 3 contre 3 + 1 appui · 28 × 26 m | Pression et couverture coordonnées, appuis alternés |
| Gardien : cadrage et sortie, aucun gardien | Incompatible | Changer de contenu ; des portes ne reproduisent pas un gardien |
| Rondo, 40 présents, jeu unique | Incompatible ; ateliers ou groupe actif avec rotation proposés | Aucun joueur oublié ; organiser l’activité des joueurs hors exercice |

- [ ] Essai terrain réalisé, groupe et espace réels consignés.
- [ ] Retour d’un éducateur débutant et d’un éducateur expérimenté consigné.
- [ ] Ajustements issus de l’essai relus avant validation pédagogique finale.

## Tests exécutés

```sh
node --check training-adaptation.js
node --check bible-sequence-ui.js
node tests/bible-adaptation.js
node tests/bible-adaptation-final.js
node tests/bible-design-variants.js
node tests/bible-pedagogical-motion.js
python tests/bible-quality-browser.py
python tests/bible-adaptation-final-browser.py
python tests/bible-addition-browser.py
python tests/bible-personal-diagrams-browser.py
python tests/report-training-browser.py
```

Aucune nouvelle source externe n’est présentée comme examinée pour cette livraison.
Aucune migration Supabase ni dépendance payante ajoutée. Les propositions de rotation
indiquent les joueurs hors exercice ; le coach organise leur activité, aucun atelier
complémentaire n’est inventé pour eux.
