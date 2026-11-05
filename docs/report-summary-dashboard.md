# Synthèse complète du bilan

Le sous-onglet Synthèse affiche un tableau de bord à trois colonnes, en lecture seule, dérivé à chaque ouverture du bilan courant.

1. Effectif & Match : score, contexte, effectif mémorisé. Les lignes du bilan sont complétées uniquement avec son snapshot de causerie, sans consulter la composition active d’un autre match. Tri numérique croissant (1, 2, …, 14), titulaires et impacteurs réunis. Les numéros inconnus/hors plage restent visibles dans un groupe distinct ; aucun numéro n’est inventé et aucun joueur n’est supprimé. Les minutes et statistiques saisies restent affichées.
2. Faits marquants : tri chronologique stable, minutes non renseignées en fin de liste, buts marqués en vert, cartons rouges en rouge, participants et descriptions via le modèle d’événements existant.
3. Bilan tactique & Action : observations renseignées, points forts/progrès, récupération/perte, CPA, priorité, séance prévue, message, notes/évaluations et notes historiques non vides. Aucune réécriture automatique des textes.

Le bouton Imprimer / Exporter la Synthèse Complète (PDF) utilise une feuille indépendante A4 paysage reprenant les trois cartes. L’impression historique est neutralisée pour cet export afin d’éviter le double rapport. Nettoyage après `afterprint` (impression asynchrone comprise). Choisir Enregistrer au format PDF dans le navigateur.

Fichiers : `report-summary-dashboard.js/css`. Test : `python3 tests/report-summary-dashboard-browser.py` (tri numérique, effectif de causerie, événements, tactique/action, absence de mutation, export réel PDF, mobile et actualisation).

## Version courte 251

La synthèse adopte un bandeau adversaire/date/score, deux cartes Groupe & Temps de jeu et Faits marquants, puis une conclusion compacte en bas. Elle n’affiche plus toutes les notes détaillées ni toutes les évaluations. Les conclusions reprennent des extraits des textes déjà saisis (240 caractères maximum par repère, sans réécriture ni modification des données). L’exercice envisagé et la priorité figurent dans la conclusion. Les observations intégrales restent dans Analyse et les anciennes informations de plan sont consultables dans son bloc de données conservées. L’impression dédiée reprend cette présentation courte à deux colonnes.
