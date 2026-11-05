# Effectif · Présences et bilan mensuel individuel

Chaque ligne de l’effectif affiche Présence ce mois et Présence Saison : taux et ratio présents / pointages connus, séances et matchs réunis. Le mois est sélectionnable ; la saison reste celle des statistiques de l’effectif. Les deux indicateurs remplacent visuellement l’ancien taux limité aux entraînements.

Sources de calcul :
- Séances : pointages validés existants, dédupliqués par date/heure, avec exclusion des joueurs non inclus et des occurrences futures. Les pointages effectués dans le Bilan passent par la même bibliothèque que l’Agenda.
- Matchs : bilans datés, validés (`documentCompletionIsCompleted`), de l’équipe active, dédupliqués par la clé d’événement existante. La présence est explicite via le nouveau sélecteur Match des lignes du bilan, ou confirmée par des minutes strictement positives si le statut est inconnu. Un remplaçant à zéro minute peut être pointé présent. Un joueur absent de la feuille, simplement convoqué ou non pointé n’est pas automatiquement absent.
- Les incertains et données manquantes ne rentrent pas dans le dénominateur ; l’infobulle indique le nombre de présences à confirmer. Les pourcentages manuels de présence ne sont pas transformés en faux pointages.

Bilan Mensuel (PDF) ouvre directement l’impression dédiée, sans écrire dans le dossier du joueur. Choisir Enregistrer au format PDF. Une icône crayon ouvre un formulaire en ligne pour l’appréciation mensuelle et les axes de travail ; ces notes sont stockées par mois dans `player.monthlyReviews` dans le document Effectif existant, avec son mécanisme de versionnement/synchronisation. La validation est étendue pour ces propriétés et les anciens formulaires de profil ne les effacent pas. Le coach/équipe est vérifié lors de la sauvegarde et les changements concurrents sont détectés.

Le document reprend les présences connues, temps de jeu, statuts titulaires/impacteurs, buts, passes décisives, cartons, faits liés aux identifiants du joueur et appréciations. Les buts encaissés ne sont pas imputés artificiellement à un joueur. Les statistiques du PDF sont celles des bilans validés du mois, pas celles d’un brouillon.

Le rappel existant du dernier jour du mois dans l’Agenda est réutilisé ; sa vue mensuelle propose aussi le PDF individuel de chaque joueur. Il s’agit d’un rappel affiché dans l’application, sans envoi automatique de fichier ou notification système lorsque l’application est fermée.

Fichiers : `player-monthly-model.js`, `player-monthly-reports.js/css`. Test : `python3 tests/player-monthly-reports-browser.py` (mensuel/saison, matchs validés seulement, présence zéro minute, inconnus/futurs, doublons, conservation des appréciations, PDF direct, export réel et responsive).
