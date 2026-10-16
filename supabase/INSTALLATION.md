# Activer l’espace privé des éducateurs

Le site public GitHub Pages reste en place. Les documents partagés et les comptes sont hébergés dans un **projet Supabase dédié au club**, accessible en HTTPS. Tant que la configuration publique n’est pas renseignée, aucun document n’est envoyé à Supabase.

## 1. Créer le projet

Créer un compte sur https://supabase.com puis un projet dans une région européenne. Garder le mot de passe de base de données dans un gestionnaire de mots de passe : il ne doit pas être envoyé dans une conversation ou ajouté au site. Le plan gratuit peut convenir à un démarrage ; vérifier ses quotas et conditions actuels. Il ne garantit pas une disponibilité permanente et les projets gratuits peuvent être mis en pause. Les photos comptent dans le stockage.

## 2. Installer les règles de sécurité

Dans le **SQL Editor** du projet, créer une requête, copier tout le fichier [club.sql](club.sql) et exécuter. Le script peut être relancé : il conserve les tables et leurs données, puis remet à jour ses fonctions et ses règles d’accès. La transaction crée deux tables, leurs règles d’accès et les fonctions de publication. Une erreur annule cette exécution ; ne pas désactiver RLS pour la contourner. Si une ancienne version indique que `club_members` existe déjà, remplacer tout le contenu de la requête par le script actuel et le relancer.

Les règles s’appliquent côté serveur, même si quelqu’un modifie le JavaScript du site :

- Visiteur, compte non autorisé ou membre désactivé : aucun document ni annuaire accessible.
- Éducateur actif : lecture des documents partagés du club.
- Publication et retrait : uniquement ses propres documents, avec contrôle de version et d’identifiant.
- Aucun éducateur ne peut s’ajouter à la liste des membres, réactiver son compte ou y ajouter quelqu’un.
- Le site n’a aucun droit d’écriture directe dans les tables. Les fonctions serveur vérifient l’auteur et refusent les versions périmées.

## 3. Fermer l’inscription et créer les comptes

Dans **Authentication**, les paramètres de connexion / fournisseurs permettent de désactiver **Allow new users to sign up** (l’intitulé peut varier). Conserver la connexion par e-mail et mot de passe.

Dans **Authentication → Users → Add user → Create new user**, créer le compte de chaque éducateur avec son e-mail réel et un mot de passe initial long et unique. Cocher **Auto confirm user** pour que la première connexion ne dépende pas de l’envoi d’un e-mail. Transmettre les accès individuellement par un canal sûr. L’éducateur peut ensuite changer son mot de passe dans l’espace privé ; son mot de passe actuel est demandé.

L’envoi d’invitations ou la récupération par e-mail demandent une configuration SMTP adaptée aux utilisateurs du club. Le service e-mail intégré à Supabase est restreint ; ce parcours par comptes précréés ne dépend pas de lui. Aucun bouton de récupération par e-mail n’est présenté comme fonctionnel. En cas d’oubli, le responsable doit rétablir l’accès avec les outils d’administration Supabase ; ne jamais communiquer une clé d’administration aux éducateurs.

## 4. Autoriser les éducateurs

Créer un compte ne suffit pas. Après sa création, exécuter dans SQL Editor pour chaque éducateur (remplacer les deux valeurs ; doubler les apostrophes dans un nom) :

```sql
insert into public.club_members(user_id, display_name)
select id, 'Prénom Nom'
from auth.users where lower(email) = lower('educateur@exemple.fr')
on conflict(user_id) do update
set display_name=excluded.display_name, active=true;
```

Vérifier que la requête a bien ajouté ou actualisé une ligne. Le responsable ajoute aussi son propre compte. Le site ne contient pas d’interface d’administration des invitations.

Pour retirer l’accès d’un éducateur, désactiver son appartenance :

```sql
update public.club_members set active=false
where user_id=(select id from auth.users where lower(email)=lower('educateur@exemple.fr'));
```

Le serveur refuse immédiatement ses nouvelles lectures et écritures, même avec une session encore valide. Les documents déjà lus ou copiés ne peuvent pas être retirés rétroactivement d’un appareil. Ses documents déjà partagés restent lisibles par les éducateurs actifs. Ne pas supprimer son utilisateur sans vérifier les documents à conserver : une suppression du compte entraîne la suppression de ses documents par cascade.

## 5. Brancher le site

Dans les paramètres du projet / API, relever :

- **Project URL** : `https://identifiant.supabase.co`.
- **Publishable key** : commençant par `sb_publishable_` (ou ancienne clé JWT `anon`). C’est une clé publique ; elle n’autorise pas à lire les documents sans connexion et appartenance active au club.

Renseigner uniquement ces deux valeurs dans [club-cloud-config.js](../club-cloud-config.js), puis publier le site :

```js
window.CLUB_CLOUD_CONFIG=Object.freeze({
  url:'https://identifiant.supabase.co',
  publishableKey:'sb_publishable_...'
});
```

**Ne jamais utiliser une clé `secret` / `service_role`, le mot de passe PostgreSQL ou un jeton de gestion Supabase dans le site ou dans cette conversation.** Le code refuse les clés `secret` et les anciennes clés JWT dont le rôle n’est pas `anon`.

## 6. Utiliser et contrôler

Ouvrir **Espace privé · éducateurs**, puis se connecter. Enregistrer d’abord ses séances, compos ou rapports sur l’appareil. Choisir un document puis **Partager / mettre à jour**. Pour les changements suivants, cocher **Partager mes prochains enregistrements de ce profil coach** : seuls les enregistrements explicites de ce profil, pendant une session connectée, sont partagés. Les brouillons, sauvegardes complètes, référentiels privés et autres profils ne sont pas publiés automatiquement.

Le contenu complet d’un document partagé peut comprendre des noms, photos et observations de joueurs. Tous les éducateurs actifs peuvent le lire : sélectionner les documents destinés au travail collectif du club. Les suppressions locales ne retirent pas un document du partage ; utiliser **Retirer du partage**.

Les collègues utilisent **Consulter**, puis peuvent créer une copie indépendante dans leur espace. L’auteur peut récupérer sa version partagée sur un autre appareil pour la modifier. S’il a déjà ouvert le même document, les différences de son brouillon sont conservées dans une copie avant récupération. Les modifications d’un autre appareil provoquent un conflit au lieu d’un écrasement : récupérer la version partagée et reporter les changements voulus. Les versions de travail sont suivies par onglet pour protéger également les modifications dans deux onglets.

**Actualiser** recharge les documents du club ; il n’y a pas de collaboration en direct à chaque frappe. Une coupure conserve l’enregistrement local et signale l’échec du partage : réessayer explicitement à la reconnexion. Un enregistrement hors connexion ou après déconnexion n’est pas téléversé silencieusement plus tard. Les sessions restent dans l’onglet du navigateur ; changer de profil local nécessite une nouvelle connexion. Se déconnecter sur un appareil partagé. Les données locales déjà enregistrées ou copiées restent sur cet appareil après déconnexion.

Avant d’ouvrir l’accès au club, essayer avec deux vrais comptes sur deux appareils : connexion, publication, lecture d’un collègue, copie indépendante, modification de son propre original, refus d’un compte non membre, désactivation d’un éducateur. Les essais locaux ne remplacent pas cette vérification du projet réellement configuré. Garder des exports JSON et organiser les sauvegardes du projet Supabase : la synchronisation n’est pas une sauvegarde historique.

## Vérifications de développement

- `tests/club-network-access.sql` s’exécute avec `psql` sur une base PostgreSQL temporaire **vide**, jamais sur le projet de production. Il simule les rôles `anon`, `authenticated` et `auth.uid()` de Supabase, applique le vrai schéma et contrôle les autorisations et les conflits. Il réinstalle aussi le schéma deux fois sur des données existantes et vérifie leur conservation. L’option psql `-v partial_install=1` teste le cas où seule la table `club_members` existe avant l’installation.
- `python3 tests/club-network-browser.py http://127.0.0.1:3016` utilise Playwright et Chromium, avec un service Supabase simulé : connexion, changement de mot de passe, partage des trois types, consultation des schémas, copies, conflits entre appareils, récupération, coupure réseau, session, mobile, déconnexion et révocation. Aucun e-mail, compte ou document réel n’est transmis.
