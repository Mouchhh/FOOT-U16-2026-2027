# Étape 13 · Préparation et bilan du match

22 octobre 2026 · vérification logicielle dans Chromium sur ordinateur et mobile.

- [x] Nouveau rapport : copie indépendante de la préparation de la composition,
  organisation et liste nominative des titulaires / impacteurs, sans recopier les photos.
- [x] Objectifs préparés conservés avec constat manuel (non évalué, à renforcer,
  en progrès, atteint) et observation. Modifier la composition ne réécrit pas le bilan.
- [x] Préparation et observations accessibles dans un panneau replié, sans supprimer
  le bilan rapide ni les six rubriques détaillées. Priorité remplacée après confirmation.
- [x] Anciens rapports sans préparation toujours valides ; association volontaire de
  la composition actuelle avec avertissement de vérifier le match concerné.
- [x] Transfert volontaire vers les exercices adaptés, en conservant les blocs, notes,
  date et groupe existants ; lien structuré par bloc : identifiant du rapport,
  date/adversaire, objectif retenu et critère observable.
- [x] Retour dans le rapport : liste des séances reliées de l’espace actif, ouverture,
  distinction entre séance enregistrée et brouillon modifié (horodatage ignoré).
  Une copie de rapport avec nouvel identifiant ne récupère pas le suivi de l’original.
- [x] Observations et composition nominative mémorisées incluses dans le document PDF.
- [x] Rechargement, validation des nouvelles données, échec de stockage sans ajout
  partiel, isolation du coach, écran étroit et navigation générale vérifiés.

Tests : `tests/match-followup-browser.py`, `tests/report-final-browser.py`,
`tests/report-training-browser.py`, `tests/site-final-browser.py`.

Les liens prouvent qu’un objectif est préparé dans une séance, pas qu’il a été
réalisé ou acquis sur le terrain. Les constats restent renseignés par le coach.
Les anciens transferts textuels ne sont pas reliés automatiquement par déduction.
L’essai d’une semaine réelle et la validation sportive avec des éducateurs restent
à effectuer ; aucun accès Supabase réel ni téléchargement PDF système n’est
revendiqué par ces tests du contenu imprimable.
