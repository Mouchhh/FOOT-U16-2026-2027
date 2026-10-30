# Rencontres attribuées par éducateur

`club-fixture-data.js` contient les rencontres transmises par l'utilisateur pour **MAYENNE STADE FC 2**, U17 Division 1 - U17 - U16, saison 2026–2027. Le nom de l’équipe fourni est conservé.

Neuf rencontres, du 19 septembre au 5 décembre 2026, dont cinq scores. La journée 1 est bien datée du 17 octobre, conformément au texte reçu ; elle n'est pas déplacée en septembre. Les scores sont enregistrés dans l'ordre domicile/extérieur, y compris 0–2. Les quatre rencontres restantes ont une heure et aucun score inventé. Les noms répétés et les horaires qui se trouvaient entre les équipes dans le copier-coller n'ont pas été traités comme de nouvelles rencontres ou des scores.

## Utilisation

Dans Agenda / Calendrier, les rencontres attribuées à l’éducateur actif s’affichent directement sans sélection préalable et sans bloc « Les rencontres de mon équipe ». L’ancienne préférence locale `vestiaire-club-calendar-team`, y compris un choix vide, ne masque plus ces matchs. Aucun import ou enregistrement local n’est nécessaire pour les consulter avec le même profil sur un autre appareil. Les filtres habituels de l’agenda restent disponibles.

Les données de calendrier font partie du site, pas des imports locaux FFF. Une correction publiée dans ce fichier s’appliquera lorsque le coach concerné charge la nouvelle version du site. Ce mécanisme n’est pas une synchronisation automatique des résultats/reports depuis la FFF.

La clé est fondée sur l'équipe, la saison et la journée : un changement de date ne crée pas une nouvelle rencontre. La préparation utilise les fonctions existantes avec récupération du brouillon, les joueurs actuels après confirmation, le nom exact de l'équipe, l'adversaire, la catégorie et le contexte du match. Une préparation déjà créée est réutilisée. Les préparations liées ne doublonnent pas la rencontre commune à la même date. Les fiches gardent le score et l'horaire connu après création d'une préparation.

Domicile/extérieur est déduit de l'ordre des équipes fourni ; aucun stade précis n'a été inventé. Les résultats restent des informations de calendrier, ils ne créent pas automatiquement des bilans sportifs.

## Vérification

`python tests/agenda-club-fixtures-browser.py` vérifie les neuf dates/heures, les cinq scores exacts, l'ordre domicile/extérieur, la journée 1 d'octobre, l’affichage sans choix préalable, la création et la récupération, l'absence de doublon, un changement commun de date conservant la clé et la préparation, l’indépendance vis-à-vis des anciennes préférences, le rechargement, un second utilisateur/appareil et le téléphone.

Les tests FFF et de l'agenda existant passent également : `tests/agenda-fff-browser.py`, `tests/agenda-calendar-browser.py`.


## Attribution personnelle (correction)

Les neuf U17 sont attribués à Enzo Mouchet uniquement. Hugo Mottais possède deux calendriers : 23 rencontres Seniors D2 (dont une coupe) et 8 U15 R2. Aucun calendrier par défaut n’est affecté aux autres éducateurs. Un calendrier ne se choisit plus dans l’agenda.

L’attribution utilise `ownerCoachName` et le nom du profil actif, normalisés pour la casse, les accents et les espaces. Les profils locaux et les comptes connectés utilisent le même nom de profil (`activeCoach.name`). Il s’agit d’une règle d’affichage de l’agenda, pas d’un contrôle d’accès serveur : les rencontres fournies restent des données statiques du site. Un changement du nom du compte nécessite de mettre à jour son attribution. Ne pas inférer l’éducateur à partir de sa seule catégorie, de son appareil ou d’une ancienne préférence.

Les anciennes préparations provenant d’un calendrier attribué à un autre coach ne sont plus montrées comme rencontres dans son agenda. Leurs documents ne sont pas supprimés. Les préparations personnelles sans lien à ces calendriers restent inchangées.

Plusieurs calendriers par éducateur sont agrégés sans les mélanger : catégorie sur les événements et filtre par catégorie. La clé combine calendrier et journée, ou un identifiant spécifique pour la coupe. Le premier tour de coupe et la journée 1 du championnat sont donc deux rencontres distinctes.

`tests/agenda-hugo-fixtures-browser.py` vérifie également les 31 rencontres de Hugo, les dates/heures exactes, les 22 journées Seniors, la coupe et ses TAB 5–3 (domicile Ambrières), les 8 U15 et leurs 5 scores, le filtre Seniors/U15, l’isolement avec Enzo et un profil sans attribution, la préparation, le rechargement et le téléphone.
