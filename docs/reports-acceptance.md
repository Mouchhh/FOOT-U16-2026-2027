# Étape 6 · Après-match et rapports

Vérifications du 21 octobre 2026 dans Chromium, ordinateur et téléphone.

- [x] Nouveau rapport : équipe et organisation de la composition, date, adversaire
  et contexte de sa préparation de match repris quand ils sont renseignés.
  Les rapports déjà ouverts ne sont pas réécrits par cette initialisation.
- [x] Bilan essentiel et sections détaillées modifient les mêmes données ; retour
  entre les deux sans perte. Les six pages et Précédent/Suivant sont conservés.
- [x] Score visible dans le bilan rapide et actualisé à la saisie ; un score non
  valide demande une vérification au lieu d’annoncer un résultat trompeur.
- [x] Brouillon retrouvé après rechargement ; enregistrement dans Mes rapports
  vérifié, avec message explicite et bibliothèque inchangée en cas d’échec.
- [x] Impression : score, contexte, analyses, évaluations, joueurs et plan d’action
  composent le document existant. Le test vérifie le contenu avant impression,
  pas les réglages d’une imprimante ou le dialogue système PDF de chaque appareil.
- [x] Lien match → séance : une ou deux priorités choisies par le coach, thème
  modifiable, exercices compatibles avec le groupe et l’espace actuel.
- [x] Critère de réussite transmis dans les notes avec les constats du match.
- [x] Ajout explicite conservant les exercices, la date et les notes déjà préparés.
  La durée totale est affichée et son dépassement signalé.
- [x] Changement de document ou de groupe pendant la prévisualisation détecté ;
  refus d’ajouter à une préparation devenue différente.
- [x] Échec de stockage pendant le transfert : aucun exercice ajouté, ancien
  brouillon rétabli. Espaces des coachs séparés.
- [x] Une seule fenêtre de préparation à la fois ; les lecteurs d’animation sont
  libérés lorsque les propositions sont recalculées ou la fenêtre fermée.
- [x] Mise en page sans débordement horizontal sur téléphone.

## Tests

```sh
node --check reports.js
node --check report-quick.js
node --check report-training.js
python tests/report-final-browser.py
python tests/report-training-browser.py
python tests/completion-report-search-browser.py
python tests/club-completion-browser.py
python tests/club-network-browser.py
```

Les tests Supabase utilisent un service simulé : sauvegarde et lecture entre
navigateurs, conflits, coupures, reprise et retrait d’accès, sans document de
production modifié. Un brouillon reste sur l’appareil ; enregistrer un rapport
alimente le mécanisme de partage existant pour un compte privé autorisé.
Aucune migration SQL ni nouvelle dépendance externe.
