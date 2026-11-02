# Mon compte

Le bouton d’engrenage de l’en-tête ouvre une modale native avec cinq onglets accessibles au clavier : Profil, Préférences, Sécurité, Notifications et Support. La croix extérieure utilise le rouge du club défini par `--club-logo-red` (#e41f28). Les changements non enregistrés sont protégés à la fermeture.

## Données et limites

- Profil : photo recadrée et compressée en JPEG, prénom, nom, rôle et coordonnées sont enregistrés par coach sur cet appareil. Le nom apparaît dans l’accueil. Ces champs ne modifient ni les autorisations du club ni l’identifiant de connexion.
- Préférences : page de démarrage, affichage compact et réduction des mouvements sont locaux au coach. Une nouvelle ouverture utilise la page choisie ; une restauration d’historique conserve le travail en cours. Club nécessite une connexion.
- Sécurité : le mot de passe actuel est vérifié par l’authentification existante avant la modification. L’identité du compte retourné est contrôlée. Les champs sont effacés après la requête et aucun mot de passe n’est enregistré localement. En mode local, cette fonction est désactivée. La modification de l’adresse de connexion nécessite l’administrateur du club.
- Rappels : désactivés par défaut, contrôlés toutes les 30 secondes lorsque le site reste ouvert, indépendamment des filtres visuels de l’agenda. Les notifications du navigateur exigent un clic d’autorisation et un navigateur compatible. Les rappels dans le site restent disponibles ; ils sont différés pendant une modale. Aucun e-mail, SMS ou push avec le site fermé n’est envoyé. Les créneaux déjà signalés sont mémorisés pour limiter les doublons.
- Support : prépare un brouillon de signalement GitHub contenant la description saisie, la page sans paramètres ni fragment, le module et la taille de l’écran. L’utilisateur relit puis publie lui-même. La déconnexion réutilise le mécanisme existant et sa sauvegarde préalable du travail.

## Intégration

`coach-account.js` précède `workspace-navigation.js` pour fournir la préférence de démarrage. `coach-account.css` complète les styles existants. Le système global `external-modal-close.js` conserve le bouton de fermeture original et le place à l’extérieur. La navigation principale reste inchangée.

Vérification : `python tests/coach-account-browser.py` avec le serveur local sur le port 3016. Les requêtes de mot de passe sont simulées ; aucun compte réel n’est modifié.
