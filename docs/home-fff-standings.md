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

## Plusieurs équipes par éducateur (282)

Le panneau de configuration permet de préparer plusieurs équipes avant une seule validation : « + Ajouter une autre équipe » ajoute les détails et le lien FFF confirmé à une liste, puis ouvre un formulaire vierge. Les radios de cette liste choisissent l'équipe à ouvrir au terme de la configuration ; « Retirer » retire uniquement une sélection non enregistrée. Le coach peut terminer avec le formulaire suivant vide. Les doublons d'identifiant ou de lien/saison sont refusés. Tous les profils sont fusionnés avec les équipes déjà présentes dans les métadonnées du compte, sans remplacer les autres équipes.

Le sélecteur d'équipe existant en haut conserve son fonctionnement avec contexte figé et rechargement sécurisé. Sur le contexte sélectionné, la reconnexion déclenche l'actualisation avec son propre lien FFF. Le titre et la légende du classement identifient l'équipe active ; la clé de cache comporte l'identifiant de cette équipe. Un échec FFF sur U15 conserve seulement le classement U15, jamais celui des U17. Aucune donnée réelle FFF supplémentaire n'a été obtenue avec cette évolution.

`tests/coach-multi-team-fff-browser.py` parcourt la saisie de deux équipes, la prévention des doublons, le choix initial U15, l'enregistrement dans le compte, puis les clics réels du sélecteur supérieur U15 → U17 → U15. Les classements simulés, leurs sources et les clés de cache restent séparés, y compris lors d'un échec réseau.

## Relais Supabase : diagnostic précis (283)

Remplacer intégralement le code de la fonction `fff-standings` par `supabase/functions/fff-standings/index.ts`, déployer et conserver la vérification JWT de passerelle désactivée (l'authentification utilisateur reste vérifiée dans la fonction).

Le relais suit au maximum trois redirections vers les mêmes pages de compétition HTTPS autorisées. Il conserve le lien source original dans sa réponse, n'envoie jamais le Bearer utilisateur à la FFF et limite la lecture à 4 Mo. Un délai global de 18 secondes comprend les redirections et la lecture pour rester sous les 20 secondes du client.

Les réponses d'erreur incluent `code`, `stage`, `reference` et éventuellement `upstreamStatus`. Les logs `FFF :` ne contiennent pas de jetons ni le contenu des réponses. Le site affiche le refus HTTP FFF exact, un délai dépassé, une redirection non autorisée ou une page reçue sans classement HTML exploitable. Le dernier classement validé est préservé. Ces diagnostics ne constituent pas un contournement d'un refus FFF et ne prouvent pas que l'accès public fonctionne depuis Supabase.

Le réseau de développement refuse encore l'accès direct à la FFF (403 de la passerelle de sortie). Les tests du relais simulent donc succès, refus 403, timeout, redirections autorisées/interdites, boucle et taille excessive. La vérification réelle consiste à déployer le nouveau script puis se reconnecter au site : le message d'accueil fournit désormais l'erreur exploitable sans parcourir les journaux Supabase.

## Enregistrement sans blocage FFF et retours visibles (284)

Le formulaire contrôle les champs du groupe avant toute demande réseau et affiche le nom du champ invalide, son erreur native et un texte près du champ. Une session/contexte devenu invalide produit un message explicite. Les échecs de sauvegarde distants affichent le statut HTTP et le code, réactivent les boutons et gardent les valeurs saisies. Une erreur de sauvegarde de l'espace courant est interceptée et expliquée.

La configuration de l'équipe ne dépend plus de la disponibilité FFF : le lien et le nom officiel sont facultatifs. Un lien fourni doit rester valide et accompagné du nom exact ; sinon le coach peut l'effacer pour l'associer plus tard. Un profil détaillé sans source est enregistré dans le compte et reconnu lors des connexions suivantes, sans réouverture répétitive du configurateur. L'accueil propose « Mon équipe FFF » pour compléter le lien, n'utilise pas un ancien lien par défaut et n'affiche aucun ancien classement tant que la liaison manque. Les doublons d'identité (catégorie/groupe/numéro/pratique/saison) sont refusés même sans lien FFF. Un identifiant de brouillon stable permet de réessayer sans créer un nouvel identifiant à chaque échec.

`tests/coach-team-save-feedback-browser.py` vérifie le champ invalide, la session changée, un refus HTTP 422 avec saisies conservées et nouvelle tentative, puis la sauvegarde sans lien alors que FFF est inaccessible, l'absence de boucle au rechargement et le retour au formulaire pour compléter la liaison.

## Configuration non cliquable derrière un ancien panneau (285)

Un scénario reproduit explique un formulaire visible sans réaction : si un `dialog.workspace-sheet` était déjà ouvert, `workspace-sheets.js` rendait tous les autres éléments du body `inert`, y compris le formulaire de configuration ajouté après la connexion. Augmenter son z-index ou modifier la validation ne pouvait pas rendre ses boutons interactifs.

Le gestionnaire expose désormais `workspaceSheets.prioritize(root)`. La configuration l'utilise pour devenir la seule surface interactive, suspendre les panneaux déjà ouverts et garder le focus clavier dans le formulaire. La suppression du formulaire restaure les panneaux précédents sans effacer leur contenu. Un ancien éditeur qui s'ouvre pendant la configuration reste suspendu. Le bouton de sauvegarde possède une action de clic explicite et le formulaire garde le même handler pour les soumissions clavier, avec prévention d'une double soumission native.

`tests/coach-team-panel-priority-browser.py` ouvre réellement un éditeur avant la configuration, clique sur le bouton sans `force`, constate le retour de validation, ferme la configuration et vérifie la restauration de l'éditeur. Il rouvre ensuite la configuration, remplit un lien FFF valide, ouvre un second éditeur en arrière-plan et vérifie que la sauvegarde atteint bien le compte simulé. Le test existant des panneaux vérifie le fonctionnement normal sans priorité de configuration.

## Liens de classement FFF acceptés (286)

Le lien fourni par le coach était `https://epreuves.fff.fr/competition/club/548126-st-mayennais-f-c/equipe/2026_25254_U17_7/classement`. Le validateur frontend refusait cette adresse officielle parce qu'il imposait le suffixe `/saison`. `agendaFFFURL` accepte désormais les deux suffixes, sans modifier les anciens liens ni leurs identifiants de calendrier. Le lien de classement est conservé exactement lors de l'enregistrement du profil. La recherche déduplique les pages saison/classement d'une même équipe et privilégie son lien de classement.

Le relais Supabase 283 accepte déjà ce chemin : aucune modification de son script n'est requise pour ce correctif. Les tests couvrent l'adresse exacte du coach, sa variante avec slash final, l'enregistrement via de vrais clics de navigateur et la déduplication des résultats de recherche. Cette correction de validation du lien ne prouve pas la disponibilité réseau ni la présence du tableau dans la réponse FFF réelle.

Validation 286 : les tests du relais, de sélection FFF et d'enregistrement du lien exact passent. Le test historique complet `agenda-fff-browser.py` passe ses assertions de validation d'URL et de parsing, puis s'arrête sur son ancien parcours d'interface : le résumé « Importer d'autres rencontres » y est masqué. Ce parcours historique n'est pas revendiqué comme validé par ce correctif.

## Lecture de la page officielle du classement (287)

La capture du code source montre un tableau Angular/CDK rendu dans le HTML, avec `cdk-column-points`, les liens `a.team` et les images `app-logo-team img`. Elle montre aussi des références internes `urlClassement` telles que `/api/classement_journees/450406_1_1_1`. L'ouverture de cette référence sous le domaine public a renvoyé une page 404 : ce chemin n'est donc pas considéré comme une API publique et n'est jamais appelé par l'application.

La synchronisation demande directement `/competition/club/.../equipe/.../classement`. Les anciens liens `/saison` sont convertis uniquement pour la lecture du classement ; les clés et profils existants restent conservés, et les caches des deux variantes d'une même équipe sont reconnus. Le parseur utilise aussi les classes de colonnes CDK/Material, ignore les SVG/éléments décoratifs dans les intitulés, distingue la colonne de progression « Pr. » du rang et lit les logos dans src, data-src, ngsrc ou srcset. Aucune dépendance au chemin interne `/api/classement_journees` n'est ajoutée.

Les tests utilisent un tableau synthétique reproduisant les caractéristiques visibles sur les captures (rang sans titre, progression avec SVG, colonne points CDK, logo lazy/srcset). Ce ne sont pas une copie complète du HTML réel ni une preuve d'accès depuis Supabase. Le réseau de développement reste bloqué vers la FFF ; le chargement réel doit encore être confirmé sur le relais déployé. Aucun nouveau code Supabase n'est nécessaire pour ces corrections du client : le relais 283 sait déjà renvoyer la page `/classement`.
