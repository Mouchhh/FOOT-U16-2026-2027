# Synthèse complète du bilan

Le sous-onglet Synthèse affiche un tableau de bord à trois colonnes, en lecture seule, dérivé à chaque ouverture du bilan courant.

1. Effectif & Match : score, contexte, effectif mémorisé. Les lignes du bilan sont complétées uniquement avec son snapshot de causerie, sans consulter la composition active d’un autre match. Tri numérique croissant (1, 2, …, 14), titulaires et impacteurs réunis. Les numéros inconnus/hors plage restent visibles dans un groupe distinct ; aucun numéro n’est inventé et aucun joueur n’est supprimé. Les minutes et statistiques saisies restent affichées.
2. Faits marquants : tri chronologique stable, minutes non renseignées en fin de liste, buts marqués en vert, cartons rouges en rouge, participants et descriptions via le modèle d’événements existant.
3. Bilan tactique & Action : observations renseignées, points forts/progrès, récupération/perte, CPA, priorité, séance prévue, message, notes/évaluations et notes historiques non vides. Aucune réécriture automatique des textes.

Le bouton Imprimer / Exporter la Synthèse Complète (PDF) utilise une feuille indépendante A4 paysage reprenant les trois cartes. L’impression historique est neutralisée pour cet export afin d’éviter le double rapport. Nettoyage après `afterprint` (impression asynchrone comprise). Choisir Enregistrer au format PDF dans le navigateur.

Fichiers : `report-summary-dashboard.js/css`. Test : `python3 tests/report-summary-dashboard-browser.py` (tri numérique, effectif de causerie, événements, tactique/action, absence de mutation, export réel PDF, mobile et actualisation).

## Version courte 251

La synthèse adopte un bandeau adversaire/date/score, deux cartes Groupe & Temps de jeu et Faits marquants, puis une conclusion compacte en bas. Elle n’affiche plus toutes les notes détaillées ni toutes les évaluations. Les conclusions reprennent des extraits des textes déjà saisis (240 caractères maximum par repère, sans réécriture ni modification des données). L’exercice envisagé et la priorité figurent dans la conclusion. Les observations intégrales restent dans Analyse et les anciennes informations de plan sont consultables dans son bloc de données conservées. L’impression dédiée reprend cette présentation courte à deux colonnes.

## Repères Match / Analyse et effectif latéral 252

Le groupe devient une colonne latérale étroite avec une ligne unique par joueur : numéro, nom et minutes. Les statuts ne sont plus répétés visuellement ; ils restent dans l’infobulle de la ligne et dans les données. Les noms restent complets dans le PDF.

La zone principale reprend les repères renseignés du match (organisation, durée, score à la pause, lieu, conditions, buteurs/passeurs manuels), puis la synthèse des six axes de l’Analyse et les évaluations renseignées. Les observations sont reprises sous forme d’extraits de 240 caractères maximum sans modifier leurs valeurs sources. Les faits marquants gardent leur chronologie. La conclusion ne répète plus les observations tactiques déjà affichées : elle conserve le message au groupe et la priorité/exercice suivant.

## Mi-temps et sous-onglets 253

La saisie du score à la mi-temps est rétablie juste sous le score final dans Le match. Les valeurs existantes `halfFor` / `halfAgainst` sont utilisées sans conversion (zéro conservé). La Synthèse les affiche aussi sous le score final, en retirant le doublon dans les repères du match.

La grille des sous-onglets est corrigée à sa source : quatre colonnes égales, boutons centrés et largeur complète ; deux colonnes sur mobile. Test : `python3 tests/report-halftime-tabs-browser.py`.

## Contributions individuelles 254

Chaque ligne du groupe affiche, à côté des minutes, ⚽ et le nombre de buts, puis 👟 et le nombre de passes décisives du bilan. Les valeurs viennent des propriétés statistiques de la ligne, avec les statistiques d’événements comme repli, sans additionner deux fois les sources. Zéro est affiché explicitement ; une valeur inconnue reste « — ». Les icônes possèdent un libellé accessible et une infobulle, restent compactes et sont reprises dans le PDF.
