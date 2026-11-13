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

## Statistiques détaillées (deuxième version)

Onglet **Statistiques**, également accessible depuis la fiche d’un éducateur. Filtres éducateur, catégorie et dates ; synthèse par groupe ; séances et pointages par semaine ; assiduité ; thèmes ; moyennes des évaluations de bilans ; scores complets ; joueurs (présence, minutes, buts, passes et cartons) ; export CSV.

Appliquer ensuite `supabase/club-management-statistics.sql`. La nouvelle RPC utilise les mêmes droits actifs et le même périmètre que l’espace Responsable. Elle ne retourne que les champs utiles au calcul : pas de photos, blessures, notes privées, contacts ou corps complet des documents. Limite de 500 documents autorisés, avec avertissement d’historique partiel. Aucun rôle ni nouvelle donnée sportive n’est créé par la migration.

### Sens des indicateurs

- Période basée sur la **date de séance / rencontre**, pas la date de téléversement. Fuseau des échéances : Europe/Paris.
- Séances : préparations partagées datées, hors modèles `libraryOnly`. Déduplication par propriétaire, équipe, catégorie, date et heure. Le pointage validé le plus récent est conservé ; un brouillon plus récent ne l’écrase pas dans le calcul.
- Volume préparé : somme des durées de ces préparations, **pas du temps réellement effectué**. Les séances futures peuvent figurer dans les préparations, mais pas dans les présences.
- Assiduité : présents / (présents + absents). Uniquement pointages validés, à la date et heure correspondantes, non futurs et joueurs inclus. Les réponses à confirmer sont comptées séparément. Pas de fusion par nom ou numéro. Les lignes de bilan non liées à un identifiant d’effectif connu restent signalées et exclues du rapprochement individuel ; leurs minutes renseignées restent dans le cumul des lignes documentées.
- Matchs : bilans de match partagés et datés non futurs, dédupliqués selon leur filiation `agendaSourceKey / statsEventId / id` et leur rencontre. Les anciens doublons sans filiation ne peuvent pas être reconnus avec certitude. Aucun résultat ne représente une homologation officielle.
- Victoires/nuls/défaites et buts d’équipe : seulement lorsque les deux scores sont renseignés. Un 0 saisi est valide ; un champ vide ne devient jamais 0.
- Minutes : cumul des minutes individuelles renseignées dans les bilans, pas la durée des rencontres. Les lignes sans minutes restent signalées.
- Notes /5 : évaluations déclarées par l’éducateur, avec nombre de bilans par axe. Pas de note automatique du travail d’un éducateur.
- Joueurs : identifiants liés dans les pointages/bilans ; absence d’une fiche n’implique pas absence d’un joueur à l’effectif. Le même identifiant suivi dans plusieurs équipes reste séparé.
- Sources locales non partagées (agenda, pointages non enregistrés, brouillons) : **non accessibles au responsable**. Aucune nouvelle synchronisation silencieuse n’a été ajoutée.

### Vérification complémentaire

`node tests/manager-statistics-model.mjs` couvre valeurs manquantes, zéros, dates, futur, doublons, périmètres, catégories absentes et identités. `tests/manager-statistics-browser.py` vérifie filtres, navigation par éducateur, tableaux, export CSV et mobile. Les tests d’accès PostgreSQL incluent la nouvelle RPC.
