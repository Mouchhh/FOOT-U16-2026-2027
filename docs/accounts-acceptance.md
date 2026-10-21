# Étape 1 · Connexion et comptes

État : logiciel vérifié ; recette de l’e-mail réel encore à effectuer avant
fermeture définitive de l’étape. Aucun nouveau script SQL nécessaire.

## Parcours vérifiés

- [x] Connexion avec adresse autorisée et identité du coach liée au compte.
- [x] Inscription avec prénom, nom, adresse autorisée et invitation ; refus d’un
  mauvais code et d’une adresse non autorisée (service simulé).
- [x] Messages distincts pour mauvais identifiants, compte existant, mot de passe
  faible, lien expiré, autorisation manquante et panne de connexion.
- [x] Afficher/masquer les mots de passe, boutons désactivés pendant l’opération.
- [x] Demande de réinitialisation et renvoi de confirmation sans révéler si une
  adresse correspond à un compte.
- [x] Retour par lien vérifié avec Supabase avant toute utilisation de la session ;
  jetons retirés immédiatement de l’URL, conservés uniquement en sessionStorage.
- [x] Réinitialisation : confirmation identique, 12 caractères minimum, refus du
  service géré, rechargement de page et ouverture dans un onglet déjà présent.
- [x] Pas d’ouverture automatique du club pendant la réinitialisation, y compris
  au retour de focus ou du réseau.
- [x] Mot de passe modifié sans transformer un compte non autorisé en membre du club.
- [x] Déconnexion locale immédiate, même si l’appel serveur échoue ; brouillons
  conservés et ancienne session en mémoire empêchée de recréer une connexion.
- [x] Autre ordinateur simulé : mêmes identité et bibliothèque, sans écrasement
  des brouillons concurrents ; révocation et séparation des comptes.
- [x] Téléphone : champs lisibles, boutons accessibles, pas de débordement horizontal.

Tests : `tests/club-account-access-browser.py` et
`tests/club-network-browser.py`. Navigation conservée vérifiée par
`tests/workspace-hover-steps-browser.py`. Les appels e-mail sont simulés : aucun
message réel n’est envoyé par les tests.

## Réglages et recette réels · à cocher

L’environnement de développement ne dispose d’aucun accès d’administration au
projet Supabase. La lecture de ses paramètres publics a également été bloquée par
le réseau de cet environnement. Les réglages ci-dessous ne sont donc pas déclarés
vérifiés sur le projet réel.

1. Ouvrir [Authentication → URL Configuration](https://supabase.com/dashboard/project/uesbqljrcaugwcbzijcj/auth/url-configuration).
   - Site URL : `https://mouchhh.github.io/FOOT-U16-2026-2027/`
   - Autoriser ces deux Redirect URLs :
     - `https://mouchhh.github.io/FOOT-U16-2026-2027/index.html?auth=recovery`
     - `https://mouchhh.github.io/FOOT-U16-2026-2027/index.html?auth=login`
2. Vérifier le service d’envoi dans Authentication → Email / SMTP Settings. Le
   service partagé Supabase peut limiter les envois et leurs destinataires ; si un
   éducateur ne peut pas recevoir d’e-mail, configurer un SMTP adapté au club.
   Aucun mot de passe SMTP ni clé privée ne doit être ajouté au dépôt.
3. Les modèles de réinitialisation et de confirmation doivent conserver le lien
   de vérification Supabase (`ConfirmationURL` pour les modèles standard), plutôt
   que pointer directement vers l’accueil sans vérification.
4. Depuis une adresse de coach existante, utiliser « Mot de passe oublié ? ».
   Recevoir le message, ouvrir le lien, choisir un nouveau mot de passe, retrouver
   son nom et ses documents. Se déconnecter puis vérifier que le nouveau mot de
   passe fonctionne et que l’ancien est refusé.
5. Faire le même contrôle de réception avec un autre éducateur autorisé, hors des
   comptes administrateurs du projet. Vérifier les e-mails de confirmation si la
   confirmation d’adresse est activée dans Supabase.

- [ ] Lien reçu et bon retour sur le site de production.
- [ ] Nouveau mot de passe fonctionnel, ancien refusé, identité et documents retrouvés.
- [ ] Réception possible pour les autres éducateurs autorisés.

L’étape reste ouverte tant que ces trois cases ne sont pas validées. Ne pas
confondre la réussite des tests simulés avec la livraison effective des e-mails.
