# Mon compte

Le bouton d’engrenage de l’en-tête ouvre une modale native avec quatre onglets accessibles au clavier : Mon profil & sécurité, Détails du club, Catégories & équipes, Préférences & déconnexion. Les rappels et le support restent disponibles dans deux sections dépliables des préférences. La croix extérieure utilise le rouge du club défini par `--club-logo-red` (#e41f28). Les changements non enregistrés sont protégés à la fermeture.

## Données et limites

- Profil : photo recadrée et compressée en JPEG, prénom, nom, rôle et coordonnées sont enregistrés par coach sur cet appareil. Le nom apparaît dans l’accueil. Ces champs ne modifient ni les autorisations du club ni l’identifiant de connexion.
- Club : le logo et les couleurs de référence sont affichés. Le nom, la ville, le stade et les coordonnées du club sont modifiables, avec jusqu’à douze contacts classés par service (Bureau, Direction sportive, Autre contact). Ces informations restent propres au compte sur cet appareil, communes à ses équipes ; elles ne constituent pas une modification globale des coordonnées du club ou de sa charte. Les coordonnées inconnues restent vides.
- Équipes : affiche les équipes du coach avec la possibilité de sélectionner, modifier ou ajouter. Les actions réutilisent `coachTeamSwitch` et `coachTeamAddDialog`, avec préservation des brouillons. Le panneau protège les paramètres non enregistrés avant la transition vers l’éditeur d’équipe. Annuler cet éditeur ramène à l’onglet des équipes.
- Préférences : page de démarrage, affichage compact et réduction des mouvements sont locaux au coach. Une nouvelle ouverture utilise la page choisie ; une restauration d’historique conserve le travail en cours. Club nécessite une connexion.
- Sécurité : le mot de passe actuel est vérifié par l’authentification existante avant la modification. L’identité du compte retourné est contrôlée. Les champs sont effacés après la requête et aucun mot de passe n’est enregistré localement. En mode local, cette fonction est désactivée. La modification de l’adresse de connexion nécessite l’administrateur du club.
- Rappels : désactivés par défaut, contrôlés toutes les 30 secondes lorsque le site reste ouvert, indépendamment des filtres visuels de l’agenda. Les notifications du navigateur exigent un clic d’autorisation et un navigateur compatible. Les rappels dans le site restent disponibles ; ils sont différés pendant une modale. Aucun e-mail, SMS ou push avec le site fermé n’est envoyé. Les créneaux déjà signalés sont mémorisés pour limiter les doublons.
- Support : prépare un brouillon de signalement GitHub contenant la description saisie, la page sans paramètres ni fragment, le module et la taille de l’écran. L’utilisateur relit puis publie lui-même. La déconnexion réutilise le mécanisme existant et sa sauvegarde préalable du travail.

## Intégration

`coach-club-details.js` gère la fiche club locale et ses validations. `coach-account.js` précède `workspace-navigation.js` pour fournir la préférence de démarrage. `coach-account.css` complète les styles existants. Le système global `external-modal-close.js` conserve le bouton de fermeture original et le place à l’extérieur. La navigation principale reste inchangée.

Vérification : `python tests/coach-account-browser.py`, `python tests/coach-settings-browser.py` et `python tests/coach-teams-browser.py` avec le serveur local sur le port 3016. Les requêtes de mot de passe sont simulées ; aucun compte réel n’est modifié.
