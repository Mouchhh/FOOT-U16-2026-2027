# Entrée dans Match / Bilan : cycle de vie et fenêtre compacte

## Déclenchement

L’acceptation de l’entrée est attachée au document, au coach et à l’équipe, et non au menu actuellement affiché. Elle reste valable lors des changements d’onglet, des modifications de texte et des retours depuis l’Accueil.

Les deux identifiants acceptés sont conservés dans `sessionStorage`, sous `vestiaire-document-entry-active:<coach>:<équipe>`. Les clés de document incluent aussi ces deux contextes. Aucune donnée de causerie ou de bilan n’est déplacée dans ce stockage ; les mécanismes de sauvegarde existants restent appliqués. Si ce stockage est indisponible, l’état en mémoire continue d’éviter les répétitions pendant l’ouverture courante.

Le cycle se termine lors de l’événement `document-completed` émis après validation réussie. La déconnexion efface aussi les acceptations de l’espace courant. Un document différent ou une demande explicite de nouvelle version conserve sa propre décision d’entrée. La simple navigation « Fermer la causerie » ne supprime pas un travail encore en cours.

Le clic ordinaire sur Bilan ne porte plus `force:true`. Les changements explicites de contexte depuis l’agenda, les nouvelles versions et les créations restent protégés par les gardes existantes. Le chargement d’une causerie qui reprend un autre bilan enregistré actualise aussi l’identifiant accepté, pour éviter une relance après ce changement d’identifiant.

## Rafraîchissement

Sur une navigation navigateur de type `reload`, `workspace-navigation.js` ouvre systématiquement l’Accueil avant toute restauration du dernier menu. L’ancien point de navigation du document courant est remplacé ; les mémoires de filtres et les données métier ne sont pas effacées. Le contrôle d’entrée restaurée ne déclenche pas de fenêtre lors du démarrage après F5.

Les boutons précédent/suivant du navigateur restent disponibles en navigation normale ; le changement concerne le démarrage après rafraîchissement.

## Présentation

Match et Bilan utilisent désormais le même dialogue d’entrée compact, y compris à la place de l’ancienne bannière de bilan. `document-entry-compact.css` limite cette décision à 620 px sur ordinateur et à la largeur disponible sur téléphone, avec hauteur limitée et défilement interne si nécessaire.

Un fond sombre translucide flouté est ajouté pendant cette décision, puis retiré à la fermeture. Le gestionnaire de panneaux existant assure toujours l’isolation du fond, le focus et la fermeture clavier. Ses grands panneaux de travail et l’historique de versions ne sont pas redessinés.

L’ancien helper `reportEntryBanner` reste chargé pour compatibilité avec les appels de nettoyage historiques ; sa clé de notification n’est plus utilisée pour le cycle d’entrée dans les documents.

## Vérifications

Serveur local port 3016, Chromium :

- `tests/document-entry-browser.py` : choix Match compact, taille 320 à 1366 px, fond et nettoyage, retours sans répétition, refresh Match/Bilan vers Accueil, maintien des données, choix forcé et annulation, fin du cycle.
- `tests/report-entry-banner-browser.py` : nouveau dialogue compact de Bilan, suppression de l’ancienne bannière, acceptation conservée entre menus et après F5, validation réelle et conservation du bilan enregistré.
- `tests/report-causerie-continuity-browser.py` : reprise d’un bilan existant depuis sa causerie sans mélange de données.
