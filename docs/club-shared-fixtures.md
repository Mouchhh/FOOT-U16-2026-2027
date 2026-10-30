# Rencontres communes par équipe

`club-fixture-data.js` contient les rencontres transmises par l'utilisateur pour **MAYENNE STADE FC 2**, U17 Division 1 - U17 - U16, saison 2026–2027. Ce nom est conservé exactement ; aucune assimilation avec le libellé Stade Mayennais ou le lien FFF fourni précédemment n'est faite.

Neuf rencontres, du 19 septembre au 5 décembre 2026, dont cinq scores. La journée 1 est bien datée du 17 octobre, conformément au texte reçu ; elle n'est pas déplacée en septembre. Les scores sont enregistrés dans l'ordre domicile/extérieur, y compris 0–2. Les quatre rencontres restantes ont une heure et aucun score inventé. Les noms répétés et les horaires qui se trouvaient entre les équipes dans le copier-coller n'ont pas été traités comme de nouvelles rencontres ou des scores.

## Utilisation

Dans Agenda / Calendrier, « Les rencontres de mon équipe » propose le calendrier commun. Le choix est conservé par coach sur cet appareil (`vestiaire-club-calendar-team`). Aucun coach n'est affecté arbitrairement à une équipe. Chaque coach choisit l'équipe une fois sur cet appareil ; il retrouve ensuite directement les rencontres, sans fichier à importer. Sur un autre appareil, choisir à nouveau l'équipe ; cette préférence n'est pas synchronisée par un nouveau service cloud.

Les données communes font partie du site, pas des imports locaux FFF. Une correction publiée dans ce fichier s'appliquera à tous les coachs ayant choisi ce calendrier lorsqu'ils chargent la nouvelle version du site. Ce mécanisme n'est pas une synchronisation automatique des résultats/reports depuis la FFF.

La clé est fondée sur l'équipe, la saison et la journée : un changement de date ne crée pas une nouvelle rencontre. La préparation utilise les fonctions existantes avec récupération du brouillon, les joueurs actuels après confirmation, le nom exact de l'équipe, l'adversaire, la catégorie et le contexte du match. Une préparation déjà créée est réutilisée. Les préparations liées ne doublonnent pas la rencontre commune à la même date. Les fiches gardent le score et l'horaire connu après création d'une préparation.

Domicile/extérieur est déduit de l'ordre des équipes fourni ; aucun stade précis n'a été inventé. Désactiver son calendrier ne supprime pas les compositions ou causeries personnelles. Les résultats restent des informations de calendrier, ils ne créent pas automatiquement des bilans sportifs.

## Vérification

`python tests/agenda-club-fixtures-browser.py` vérifie les neuf dates/heures, les cinq scores exacts, l'ordre domicile/extérieur, la journée 1 d'octobre, le choix explicite, la création et la récupération, l'absence de doublon, un changement commun de date conservant la clé et la préparation, la désinscription, le rechargement, un second utilisateur/appareil et le téléphone.

Les tests FFF et de l'agenda existant passent également : `tests/agenda-fff-browser.py`, `tests/agenda-calendar-browser.py`.
