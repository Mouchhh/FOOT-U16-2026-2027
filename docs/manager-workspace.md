# Espace Responsable — CRUZA

## Livré dans la branche neutre

`manager.html` : tableau de bord, filtres par période/type/éducateur, recherche, documents récents et synthèse textuelle en lecture seule. `manager.html?demo=1` utilise exclusivement des données fictives. Ce mode ne lit aucun compte, fichier local d’éducateur ou projet Supabase.

Dans `index.html?mode=local`, une entrée « Responsable » ouvre la démonstration lorsque le projet cloud n’est pas configuré. Avec Supabase, l’entrée est affichée seulement après une réponse positive de `club_management_access_info`. Le contrôle réel reste dans les RPC, y compris si l’URL est ouverte directement.

Les indicateurs comptent les documents réellement chargés, pas les séances réalisées ni les joueurs présents. Les comptes actifs ne sont pas des utilisateurs en ligne. Les documents anciens servent à préparer une revue ; ils ne constituent pas une alerte de retard ou un classement.

## Activer dans une installation privée

1. Utiliser le projet Supabase dédié à ce club. `supabase/club.sql` doit déjà être installé.
2. Appliquer `supabase/club-management.sql` avec un administrateur de la base. Migration additive et réexécutable : aucune donnée ni règle existante supprimée. Aucun utilisateur ne reçoit automatiquement de droits.
3. Vérifier l’identité exacte du membre, puis attribuer un rôle depuis SQL Editor. Ne jamais distribuer de clé `service_role` au navigateur.

```sql
-- Directeur de ce club. Remplacer l'UUID après vérification dans club_members.
insert into public.club_management_access(user_id,role,categories)
values ('UUID-DU-MEMBRE','director','{}')
on conflict(user_id) do update set role=excluded.role,categories=excluded.categories;

-- Ou responsable limité à des catégories EXACTES, normalisées en majuscules.
-- U17 R2 est une catégorie distincte de U17 : les lister explicitement.
insert into public.club_management_access(user_id,role,categories)
values ('UUID-DU-MEMBRE','pole',array['U15','U17','U17 R2'])
on conflict(user_id) do update set role=excluded.role,categories=excluded.categories;

-- Révoquer les droits Responsable :
delete from public.club_management_access where user_id='UUID-DU-MEMBRE';
```

4. Configurer la version privée du site avec l’URL et la clé publique de son propre projet. Se connecter via l’espace éducateur et ouvrir Responsable dans le même onglet. La session existante est lue, jamais copiée dans localStorage ni modifiée par ce module. Si elle a expiré, une reconnexion est demandée dans l’application.
5. Tester un directeur, un responsable de pôle, un simple éducateur et un compte désactivé avant diffusion.

## Limites explicites

- Une installation de données par club. Aucune mutualisation multi-clubs ni agrégation inter-projets créée ici.
- Droits de lecture uniquement dans cet espace. Pas d’attribution de rôles, invitation, modification d’originaux ou suppression depuis l’interface.
- La migration ne change pas les règles existantes du « Travail du club », qui autorisent déjà les membres à consulter les documents partagés du club. Le périmètre du responsable s’applique aux nouvelles RPC ; il ne révoque pas les droits de lecture déjà existants ailleurs.
- Aucun accès aux brouillons privés des appareils. Aucun indicateur de présence joueur, présence éducateur en ligne ou achèvement de séance inventé.
- 500 derniers documents autorisés maximum. Si cette limite est atteinte, un message indique que les statistiques concernent les documents chargés. Rechercher dans tout l’historique demandera une pagination serveur.
- L’aperçu de document est textuel, plafonné et échappé. Les terrains/animations ne sont pas reproduits dans ce premier lecteur. Une intégration au lecteur graphique existant reste à faire.
- Aucun service cloud n’a été configuré, aucune migration de production appliquée et aucun compte réel promu pendant cette réalisation.

## Vérifications

- `tests/club-management-access.mjs` : PostgreSQL réel embarqué via PGlite. Directeurs/pôles, documents hors périmètre, priorité de catégorie des bilans, refus éducateur/anonyme/inactif, interdiction d’auto-promotion et réexécution migration.
- `tests/club-management-browser.py` : Chromium système, démonstration et RPC simulées. Navigation, filtres, consultation, autorisation retirée, affichage mobile, absence de requêtes cloud en démo et rendu texte sans exécution HTML.
- Les tests locaux ne remplacent pas une recette Supabase de production ni des tests Safari/Firefox.
