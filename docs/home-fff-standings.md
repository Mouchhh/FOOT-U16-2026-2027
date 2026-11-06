# Classement et confrontations FFF à l’accueil

Le coach a indiqué U17 Départementale 1. Depuis la version 281, le lien FFF est confirmé dans le parcours de configuration de son équipe ; les autres catégories n’héritent pas du lien U17. Les données du classement sont isolées par éducateur et équipe.

L’accès réseau à epreuves.fff.fr a renvoyé `CONNECT tunnel failed: 403 Forbidden` depuis l’environnement de développement, y compris lors de la tentative avec autorisation réseau. Aucun classement réel n’a donc été récupéré ou publié, et aucune synchronisation automatique n’est annoncée.

Le widget affiche un état à importer sans inventer de place ni calculer un classement à partir des seuls résultats du Stade Mayennais. Le coach peut ouvrir sa source FFF puis importer une page HTML enregistrée, coller le tableau avec ses en-têtes (tabulations ou points-virgules), ou importer un JSON. Les valeurs de points officiels sont conservées, y compris les éventuelles pénalités. La différence de buts peut être calculée si seuls BP et BC sont fournis.

Colonnes : rang, équipe, points, joués, victoires, nuls, défaites, buts pour/contre et différence. Les logos FFF fournis dans la page sont repris ; les logos absents ont un monogramme, et l’équipe du club utilise son écusson local. La date indiquée est celle de l’import, pas une fausse preuve de consultation de la FFF en direct.

Les confrontations affichent soit les matchs du jeu de données FFF importé, soit les bilans du coach validés, avec leur source distincte. En l’absence d’historique, le widget le dit. Le calendrier existant reste la source de l’adversaire à venir.

JSON : `{ "rows": [{ "rank": 1, "name": "Nom officiel", "points": 0, "played": 0, "wins": 0, "draws": 0, "losses": 0, "goalsFor": 0, "goalsAgainst": 0, "goalDifference": 0, "logo": "https://cdn.fff.fr/..." }], "matches": [{ "date": "2026-01-01", "home": "Équipe A", "away": "Équipe B", "goalsHome": 0, "goalsAway": 0 }] }`. Les exemples ne sont jamais chargés dans l’application comme résultats réels.

Vérification : `tests/home-fff-standings-browser.py` utilise uniquement des tableaux fictifs, vérifie les points conservés, les écarts de buts, la stabilité de la saisie, le cloisonnement et le mobile.

## Actualisation à chaque connexion (version 280)

L'événement authentifié `club-session-ready` déclenche une requête sans cache vers `/functions/v1/fff-standings`. Les appels simultanés sont regroupés. La réponse est validée par le même parseur que l'import : une page vide, une page rendue uniquement en JavaScript ou une erreur FFF ne remplace jamais le dernier classement. La date « FFF vérifiée le » n'apparaît qu'après lecture et validation d'un tableau réel. Un changement d'équipe/compte ou un import manuel intervenu pendant la requête empêche son écriture tardive.

### Installation nécessaire côté Supabase

Le frontend seul sur GitHub Pages ne peut pas garantir l'accès interdomaines à la FFF. Déployer le relais fourni :

```sh
supabase login
supabase link --project-ref uesbqljrcaugwcbzijcj
supabase functions deploy fff-standings --no-verify-jwt
```

`--no-verify-jwt` désactive seulement la validation JWT de la passerelle : la fonction vérifie elle-même chaque Bearer auprès de `/auth/v1/user` pour supporter les clés publiables actuelles. Aucune clé secrète n'est exposée au navigateur. Les variables SUPABASE_URL et SUPABASE_ANON_KEY sont fournies par les Edge Functions. Seules les pages HTTPS de compétition de `epreuves.fff.fr` sont acceptées ; pas de redirection, de credentials FFF transmis ni d'URL arbitraire. Réponse non mise en cache, lecture plafonnée à 4 Mo et délai limité.

Ce déploiement n'a pas été réalisé dans l'environnement de développement (pas de CLI/session administrateur Supabase disponible). L'accès FFF y reste bloqué en 403. Il faut donc encore vérifier une page officielle depuis le relais déployé ; si la FFF ne renvoie qu'une coque JavaScript, il faudra connecter son endpoint de classement officiel identifié, et non annoncer une actualisation réussie. Les tests navigateur simulent une réponse de relais ; ils ne prouvent pas un accès FFF réel.

## Première connexion : équipe détaillée (281)

`coach-team-fff-onboarding.js` est appelé avant l'actualisation FFF sur `club-session-ready`. Un panneau dédié demande catégorie, groupe masculin/féminin/mixte, numéro d'équipe, pratique, niveau et saison. Le club est le Stade Mayennais. Les équipes détaillées et leur lien officiel confirmé sont enregistrés dans les métadonnées Supabase de l'utilisateur authentifié (`stade_team_profiles_v1`, `stade_active_team_v1`), via l'API utilisateur existante ; aucune migration SQL ni nouvelle Edge Function n'est nécessaire. Une connexion suivante retrouve l'équipe ; un nouvel appareil restaure le choix sauvegardé. « + Ajouter une équipe » reprend le même parcours.

La recherche appelle le relais déjà déployé avec la page officielle du club et extrait ses liens d'équipes correspondant à la catégorie. Le coach confirme le résultat exact, notamment numéro, groupe et championnat : aucune association implicite à une autre équipe. Si la page est bloquée ou ne contient pas de liens HTML lisibles, le panneau annonce l'échec et permet de renseigner le lien officiel et le nom exact. Cette solution ne contourne pas les restrictions FFF et ne garantit pas une recherche automatique tant que l'accès FFF échoue.

Le lien U17 n'est plus attribué automatiquement à tout coach U17. Le classement utilise le profil confirmé ; un ancien classement dont la source ne correspond pas au profil est ignoré. Les données existantes ne sont pas réaffectées lors d'un changement de catégorie, de numéro, de groupe ou de pratique : un nouvel espace est créé. Les réponses tardives sont rejetées si le compte ou le contexte a changé ; modifier les critères invalide la sélection FFF précédente. « Plus tard » permet de fermer le panneau, et « Mon équipe FFF » de le retrouver sur l'accueil.

Tests : `tests/coach-team-fff-onboarding-browser.py` simule une page FFF, vérifie le premier affichage, les champs, la confirmation obligatoire, l'invalidation des critères, le payload des métadonnées, la restauration, l'absence de répétition et le rendu mobile. L'accès réel à la FFF reste à valider séparément.
