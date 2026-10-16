# Espace privé du Stade Mayennais

Le site démarre sur une page d’accueil distincte avec **Se connecter** et **S’inscrire**. Les éducateurs utilisent le même site complet après connexion : terrain, tactiques, animations, séances, agenda, rapports et exports. Le formulaire d’inscription demande leur prénom et leur nom. Après validation de l’accès, cette identité apparaît dans **Coach actif**, verrouillé sur leur propre compte ; les comptes existants gardent leur nom enregistré. **Enregistrer** une séance, une composition ou un rapport synchronise son contenu avec le club. **Travail du club** présente les profils des éducateurs et permet de voir les documents de chacun, avec une actualisation automatique toutes les dix secondes dans un onglet actif.

Les documents des collègues sont consultables et copiables. Chacun modifie ses propres originaux. Un brouillon ouvert ne change jamais tout seul quand un autre appareil enregistre. Les échecs réseau conservent les données locales et une tâche à réessayer ; les conflits refusent l’écrasement de la version distante.

## Si la base et les comptes existent déjà

1. Copier tout [club-accounts.sql](club-accounts.sql) dans **SQL Editor**, puis **Run**. Il ajoute les inscriptions privées sans supprimer vos utilisateurs, leurs mots de passe ou les documents. Il peut être relancé.
2. Seulement après cette migration, dans **Authentication → Sign In / Providers → Email** (les intitulés peuvent varier), activer **Allow new users to sign up**.
3. Pour fonctionner sans service e-mail, désactiver **Confirm email**. La première inscription est alors protégée par un **code d’invitation confidentiel et à usage unique, lié à une adresse autorisée**. Sans ce code, même connaître l’adresse d’un éducateur ne permet pas de créer son compte. Si la confirmation e-mail reste activée, configurer un SMTP opérationnel et attendre la confirmation avant connexion.
4. Les comptes déjà autorisés se connectent avec leur e-mail et mot de passe actuels, sans invitation supplémentaire. Les nouveaux utilisent **Créer mon compte** avec le code individuel fourni par le responsable.

Le filtrage des inscriptions est installé côté serveur avant l’ouverture des inscriptions. Ne pas contourner une erreur en désactivant les règles RLS ou les triggers. La fonction publique de vérification d’installation ne révèle aucune adresse. Les éducateurs n’ont pas besoin d’un compte d’administration Supabase.

## Inviter un nouvel éducateur

Le responsable du club ouvre **SQL Editor** et exécute, en remplaçant les deux valeurs :

```sql
select * from public.club_authorize_educator(
  'educateur@exemple.fr',
  'Prénom Nom'
);
```

Le résultat contient l’adresse et un `activation_code` aléatoire. Transmettre individuellement ce code à la personne concernée, par un canal de confiance, avec le lien du site. Ne pas le publier, l’ajouter au dépôt GitHub ou le partager dans une conversation d’assistance : c’est une invitation confidentielle.

Sur le site, l’éducateur choisit **Créer mon compte**, renseigne son prénom, son nom, cette adresse, ce code et son propre mot de passe (12 caractères minimum). Le serveur vérifie l’invitation et crée son appartenance au club avec le prénom et le nom du formulaire. Les noms ne sont pas des autorisations ; seuls l’adresse approuvée et son code permettent de créer le compte. Après l’inscription, le code est consommé et retiré des métadonnées du compte ; les connexions suivantes utilisent seulement e-mail et mot de passe.

Relancer la requête d’autorisation renouvelle un code encore inutilisé. Cela ne réinitialise pas le mot de passe d’un compte qui existe déjà. Un éducateur peut changer son mot de passe dans **Travail du club → Changer mon mot de passe**, avec son mot de passe actuel. Pour un oubli, le responsable doit rétablir l’accès avec les outils d’administration Supabase ; aucune clé d’administration ne doit entrer dans le navigateur des éducateurs.

Pour retirer l’accès :

```sql
update public.club_invitations set active=false
where email=lower('educateur@exemple.fr');
```

L’appartenance du compte est désactivée dans la même transaction. Le serveur refuse immédiatement ses nouvelles lectures et écritures. L’interface se ferme à la prochaine vérification (dix secondes au plus dans un onglet actif). Les documents déjà lus ou copiés ne peuvent pas être retirés rétroactivement des appareils. Les documents déjà partagés restent disponibles aux membres actifs. Ne pas supprimer un compte sans conserver ses documents : les références de suppression en cascade du schéma suppriment aussi ses documents.

## Première installation du projet

1. Créer sur https://supabase.com un projet dédié au club, dans une région européenne. Conserver le mot de passe PostgreSQL dans un gestionnaire de mots de passe, jamais dans le site ou une conversation.
2. Exécuter [club.sql](club.sql) dans **SQL Editor**. Ce script réexécutable installe les tables, RLS et fonctions de publication/retrait. Il conserve les membres et documents existants. Si une ancienne version signale que `club_members` existe déjà, remplacer tout le texte de la requête par la version actuelle.
3. Exécuter [club-accounts.sql](club-accounts.sql), puis configurer les inscriptions comme décrit plus haut.
4. Relever **Project URL** et **Publishable key** (`sb_publishable_…`, ou ancienne clé `anon`) dans les paramètres du projet et les placer dans [club-cloud-config.js](../club-cloud-config.js). Ce sont des informations publiques : elles ne donnent pas accès aux données privées sans connexion et autorisation. **Jamais de clé `secret`/`service_role`, jeton de gestion ou mot de passe PostgreSQL dans le site.**
5. Autoriser chaque adresse avec `club_authorize_educator`, y compris celle du responsable, puis transmettre les codes individuellement. Un responsable disposant déjà d’un compte dans Authentication peut l’autoriser par la procédure ci-dessous.

### Autoriser un compte déjà créé dans Authentication

Pour les comptes existants seulement, dans SQL Editor :

```sql
insert into public.club_members(user_id,display_name)
select id,'Prénom Nom' from auth.users
where lower(email)=lower('educateur@exemple.fr')
on conflict(user_id) do update
set display_name=excluded.display_name,active=true
returning display_name;
```

Le nom doit apparaître ; zéro ligne signifie que l’e-mail ne correspond pas à un utilisateur existant. Pour ensuite administrer aussi son invitation avec la nouvelle procédure, exécuter `club_authorize_educator` pour cette même adresse. Cela ne change pas son mot de passe.

## Utiliser et vérifier

1. Le premier éducateur se connecte au site et prépare une séance, puis clique **Enregistrer la séance**. Le bandeau doit indiquer **Synchronisé avec le club**.
2. Sur un autre PC, le deuxième éducateur se connecte à son propre compte et ouvre **Travail du club**. La séance apparaît automatiquement, au plus dix secondes après l’enregistrement dans un onglet actif.
3. Le premier modifie et enregistre : le titre et la version se mettent à jour dans la liste du deuxième. Un aperçu ou brouillon déjà ouvert n’est pas remplacé : rouvrir **Consulter** pour obtenir la version actuelle.
4. Le même compte sur un autre appareil retrouve automatiquement ses bibliothèques. **Travail du club → Ouvrir pour modifier** récupère la dernière version ; les différences d’un brouillon sont conservées dans une copie locale avant ouverture. Reporter ensuite les changements voulus et enregistrer.

Les changements sont partagés **après Enregistrer**, pas pendant chaque frappe ou déplacement de pion. Les suppressions d’un document enregistré sont aussi synchronisées. Une tâche en attente après coupure est réessayée à la reconnexion. Un conflit reste signalé et conserve les deux versions ; il ne provoque pas d’écrasement automatique.

### Récupérer les anciens travaux locaux

Dans **Travail du club**, ouvrir **Importer ou renvoyer un document enregistré**, sélectionner son ancien profil local puis **Importer mes anciens documents de cet appareil**. Confirmer uniquement pour ses propres documents destinés à être partagés. Les originaux locaux sont conservés et les copies importées sont synchronisées sous son compte. Sans cette action, les anciens documents locaux ne sont pas publiés silencieusement.

La version locale sans accès aux données du club reste disponible via `?mode=local`. Les profils locaux ne sont pas des comptes privés. Le compte connecté utilise des clés de stockage distinctes, même si plusieurs éducateurs emploient successivement le même navigateur.

## Données et limites

- Le document complet enregistré peut contenir des noms, photos et observations de joueurs : il est lisible par les éducateurs actifs du club. Les brouillons, référentiels privés et exports globaux ne sont pas automatiquement transmis.
- Le site public GitHub Pages héberge le code, pas les documents partagés. Les droits PostgreSQL protègent les données même contre un client modifié. Les invitations ne sont ni listables ni modifiables par les éducateurs.
- Les mots de passe ne sont pas conservés dans les exports. Les jetons de session restent dans l’onglet. La déconnexion ferme l’espace privé ; les caches et brouillons locaux peuvent rester sur l’appareil : utiliser des appareils de confiance.
- Les exports JSON et une sauvegarde du projet Supabase restent nécessaires. La synchronisation n’est pas une sauvegarde historique. Le plan gratuit peut convenir au démarrage, selon ses quotas et conditions actuels ; les photos comptent dans le stockage et des projets gratuits peuvent être mis en pause.
- Le service e-mail fourni par défaut par Supabase est restreint. Le parcours par invitation confidentielle et confirmation e-mail désactivée évite cette dépendance ; ne présenter une récupération par e-mail comme fonctionnelle qu’après configuration d’un SMTP adapté.

## Vérifications de développement

- `tests/club-network-access.sql` : uniquement sur une base PostgreSQL temporaire **vide**, jamais dans le projet du club. Simule les rôles Supabase et `auth.uid()`, applique le vrai schéma, contrôle les droits, conflits, réinstallation sans perte et installation partielle (`psql -v partial_install=1`).
- `tests/club-accounts-access.sql` : reprend ces tests puis vérifie les adresses autorisées, codes à usage unique, refus d’usurpation par le seul e-mail, validation et enregistrement du prénom et du nom, suppression des codes en métadonnées, invitations privées et révocation.
- `python3 tests/club-network-browser.py http://127.0.0.1:3016` : Chromium avec Supabase simulé, accueil distinct, choix connexion/inscription, coach actif, site complet privé, séparation des comptes, synchronisation multi-PC, récupération des bibliothèques, schémas et copies, conflits, reprise réseau, inscriptions, mobile et déconnexion.

Les accès HTTPS au vrai projet depuis l’environnement de développement sont bloqués par le proxy. L’installation des scripts dans le projet réel, ses paramètres Authentication et les essais avec deux vrais comptes restent à effectuer par le responsable avant de confirmer l’activation complète.


## Activer les noms des éducateurs connectés

Le bandeau des éducateurs affiche les noms du club. Pour activer le statut en ligne, copier [club-presence.sql](club-presence.sql) dans SQL Editor puis **Run**. Ce script peut être relancé et ne modifie ni comptes ni documents. Aucun réglage d’inscription supplémentaire n’est nécessaire pour cette présence.

Le bandeau devient **Éducateurs connectés**, avec une pastille verte, un compteur et les noms. Cliquer sur un nom ouvre ses documents dans « Travail du club ». Le serveur détecte l’activité récente (90 secondes) ; le site actualise toutes les dix secondes dans un onglet visible. Une fermeture brutale ou une coupure peut rester affichée environ deux minutes. Plusieurs appareils du même éducateur n’ajoutent pas de doublon ; quitter l’un n’efface pas la présence des autres.

Sans la migration ou pendant une panne, les noms des éducateurs autorisés restent disponibles avec une indication de statut non confirmé, sans inventer de pastille verte. Les visiteurs et comptes non autorisés ne peuvent pas lire les présences. Les horodatages et l’identité de chaque signal sont imposés par le serveur ; les identifiants des sessions ne sont pas diffusés aux éducateurs.
