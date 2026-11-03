# Équipes et catégories d’un éducateur

Le sélecteur **Équipe / catégorie**, dans l’en-tête, permet de choisir l’espace de travail actif, de le configurer ou d’ajouter une autre équipe. Le coach renseigne librement le nom affiché, la catégorie et le nom de l’équipe. Aucune équipe Seniors ou U15 fictive n’est créée. Plusieurs équipes peuvent partager une catégorie, avec des noms affichés distincts.

## Séparation des données

`coach-teams.js`, chargé après `coach-storage.js` et avant les modules, définit un contexte immuable `activeCoachTeam`. Les documents enregistrés portent un objet `teamContext` avec un identifiant stable. Modifier le nom affiché ne change pas cet identifiant.

- Les bibliothèques, effectifs, brouillons, plans de jeu, historiques de récupération, rendez-vous, calendriers importés, créneaux récurrents, exceptions et rappels sont lus dans l’espace de l’équipe active.
- Les bilans et leurs données de joueurs, scores et événements restent dans leur bibliothèque d’équipe. Les vues et compteurs existants utilisent ces bibliothèques filtrées.
- Les effectifs disposent d’identifiants distincts ; les identifiants des effectifs historiques sont conservés lorsqu’ils existent déjà.
- Le profil personnel, les préférences du compte, le lien personnel Canva, les exercices et les ressources partagées du club restent communs au coach ou au club.
- Les rencontres attribuées à un coach dans les données du club sont également filtrées par équipe. Changer une catégorie dans un formulaire ne donne jamais accès aux rencontres d’un autre éducateur.

Les nouvelles clés de stockage combinent le coach et l’identifiant d’équipe : `<clé du coach>:team:<identifiant>`. Deux onglets ouverts sur des équipes différentes écrivent ainsi dans des clés différentes. Les bibliothèques d’origine ne sont pas réécrites : elles servent de sauvegarde historique. Lors du premier accès, seules leurs entrées rattachées à l’équipe sont reprises ; une bibliothèque vide enregistrée constitue bien une suppression pour cette équipe, sans réimportation de la sauvegarde.

## Données existantes

Les catégories réellement présentes dans les documents et calendriers de cet éducateur sont proposées. Pour un ancien document sans `teamContext`, le rattachement se base sur sa catégorie renseignée. Les données sans catégorie restent accessibles dans **À classer**, que le coach peut configurer explicitement. Aucun joueur ou score n’est affecté arbitrairement à une nouvelle équipe. Deux anciens groupes de même catégorie sans autre rattachement restent regroupés ; il faut les vérifier avant toute répartition manuelle.

## Changement d’équipe

Le changement vérifie puis conserve le travail ouvert avec `flushCoachWorkspace()`. Si la sauvegarde échoue ou qu’un formulaire est invalide, l’équipe actuelle reste ouverte. Une modale ouverte bloque la bascule. Le navigateur recharge ensuite le contexte choisi et revient dans le même module ; le contexte de la page précédente reste figé jusqu’à sa fermeture pour protéger les sauvegardes différées. Le choix est propre à chaque onglet du navigateur et le contexte résolu est mémorisé dès le démarrage : découvrir une autre équipe sur le serveur ne modifie pas ce choix au rechargement. L’historique de navigation inclut l’équipe pour empêcher la restauration d’un écran appartenant à une autre équipe.

## Synchronisation

Le champ `teamContext` est transmis dans le JSON des documents via l’authentification et la synchronisation existantes, sans nouvelle table ni modification des droits du club. La synchronisation découvre les équipes portées par les documents du compte et hydrate uniquement la bibliothèque active. Les envois en attente portent l’identifiant d’équipe ; les anciennes entrées sont rattachées d’après leur document local. Les envois d’une autre équipe attendent son ouverture. Un document personnel d’une autre équipe doit être ouvert depuis son équipe, ou copié explicitement comme document indépendant.

Les équipes encore vides, leur nom configuré et les brouillons restent locaux tant qu’aucun document ne transmet ces informations. Le partage collectif dans Club reste volontairement accessible en lecture aux éducateurs autorisés : la séparation des espaces de travail ne remplace pas les règles d’accès serveur.

## Interface et vérification

Le menu et la modale réutilisent le bleu/blanc et `--club-logo-red` (#e41f28). Le système global de fermeture conserve la croix rouge extérieure. La sidebar et la barre mobile ne changent pas.

Tests : `tests/coach-teams-browser.py` (bibliothèques, effectifs, brouillons, récurrences, onglets indépendants, hydratation serveur simulée, configuration manuelle, quotas et mobile) ; tests existants du compte, des choix de documents, des sauvegardes, des récurrences et des rencontres attribuées. Le serveur de test doit écouter sur le port 3016. Aucun compte réel n’est modifié par les tests simulés.
