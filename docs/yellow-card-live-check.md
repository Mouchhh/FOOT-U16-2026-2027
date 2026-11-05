# Contrôle des cartons jaunes et alerte en direct (256)

Scénario automatisé : deux avertissements enregistrés pour un joueur, ajout via le bouton Carton jaune d’un troisième carton à la 28e minute, sélection du joueur, contrôle du compteur, affichage de l’alerte dans Moments marquants et Synthèse, changement jaune → rouge → jaune, validation et contrôle de l’alerte dans l’effectif.

Un manque a été constaté : les compteurs étaient immédiats, mais le seuil n’était visible dans l’effectif qu’après l’enregistrement. `report-discipline-live.js` ajoute une projection dans le bilan en cours et dans la synthèse/PDF, sans modifier la bibliothèque ni les statistiques sauvegardées. Le bilan courant remplace sa propre version sauvegardée dans cette projection pour éviter de le compter deux fois.

- Premier jaune : confirmation discrète, sans annoncer une suspension.
- Trois jaunes sur la série de dix matchs démarrant au premier jaune : indicateur critique rouge club, libellé de risque à vérifier.
- Après le dixième match, le moteur existant ouvre une nouvelle série ; les entraînements et rencontres futures n’entrent pas dans le contrôle.
- Date manquante : projection à la date du jour, avec mention de la date à préciser.
- Match historique : projection arrêtée à sa date, sans utiliser les rencontres ultérieures.

Aucune suspension officielle n’est prononcée par l’application : l’alerte indique un risque selon la règle configurée du club.

Tests exécutés : `tests/yellow-card-live-browser.py`, `tests/report-summary-dashboard-browser.py`, `tests/player-monthly-reports-browser.py`. Vérifications réalisées avec données fictives dans un navigateur local, sans écriture dans les données réelles du club.
