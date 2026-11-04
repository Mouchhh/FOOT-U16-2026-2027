# Statistiques individuelles par équipe et saison

## Utilisation

Dans Bilans → Joueurs, associer chaque ligne à la fiche correspondante de
Votre effectif, puis renseigner minutes, buts, passes décisives et cartons.
Choisir le type de bilan (match ou séance). Les nombres sont entiers et positifs
ou nuls ; un champ vide reste « non renseigné ». Enregistrer le bilan pour faire
remonter ses données. Le brouillon n'entre pas dans les totaux de l'effectif.

Votre effectif affiche les indicateurs sur chaque carte. Un clic sur la carte
ou sur le nom ouvre une fiche de saison, avec présence, ratio buts/passes et
historique des bilans retenus. La croix extérieure utilise le rouge du logo
`#e41f28`. Les statistiques incluent les bilans de matchs **et** de séances,
distingués dans la fiche. Le ratio buts/passes n'est pas calculé si aucune passe
positive n'est renseignée ; aucun ratio infini n'est affiché.

Les saisons vont du 1er juillet au 30 juin. Le sélecteur propose la saison
courante et celles réellement présentes dans les bibliothèques de l'équipe.
Les documents sans date ou datés dans le futur sont exclus du cumul.

## Présences

La source automatique est la liste de présence des séances enregistrées :
pointage validé, date et heure conformes à la séance et début déjà passé.
Un joueur doit avoir été inclus dans le pointage.

`présence % = présents / (présents + absents) × 100`, arrondi à l'entier.
Les réponses « à confirmer » ne sont pas des absences. Sans réponse exploitable,
la présence est inconnue (`—`), et non 0 %. Une seule liste validée est retenue
par date/heure : la plus récemment validée en cas de copie d'une séance.

Les récurrences de l'agenda donnent le contexte des créneaux passés ; elles ne
prouvent jamais à elles seules qu'un joueur a été présent ou absent. Une séance
récurrente doit être enregistrée avec son pointage pour contribuer au taux.

Le coach peut saisir un pourcentage manuel (0 à 100) dans un bilan individuel.
Le choix du dernier bilan daté retenu pour ce joueur fait référence dans sa
fiche de saison : manuel si demandé, automatique sinon. Un taux manuel est
explicitement identifié et son bilan source est indiqué.

## Données et calculs

- `player-statistics-model.js` contient validation, identité et agrégation.
- `player-statistics.js` ajoute les saisies, cartes et fiche consultable.
- `player-statistics.css` adapte la grille aux écrans et utilise des SVG locaux.
- Les nouveaux champs de ligne sont des chaînes optionnelles : `squadPlayerId`,
  `goals`, `assists`, `yellowCards`, `redCards`, `attendanceMode`, `attendanceRate`.
  `minutes` existait déjà. `eventType` et `statsEventId` sont optionnels au niveau
  du bilan. Aucune migration SQL n'est nécessaire : ils sont enregistrés dans
  les documents existants, avec la même synchronisation et les mêmes accès.

La fiche d'effectif fournit l'identité stable. L'import depuis la composition
conserve `squadPlayerId`. Les anciens bilans peuvent être reconnus par leur ID
ou par un nom complet unique avec numéro compatible. Un homonyme ambigu ou une
ancienne liaison à une fiche supprimée ne sont jamais rattachés au hasard.
L'association explicite est disponible dans chaque ligne du bilan.

Les totaux ne sont pas enregistrés comme compteurs : ils sont recalculés depuis
les bilans sauvegardés de l'équipe active. Corriger le même bilan le remplace,
sans doubler sa contribution. Les copies et remplacements gardent leur filiation
`statsEventId`, et les bilans issus de l'agenda utilisent leur événement source.
À contexte identique (type, date, heure, adversaire), seule la version la plus
récente est comptée. Une copie déplacée vers une autre date est un autre événement.
Des documents créés indépendamment sans lien commun ne sont pas fusionnés sur
la seule ressemblance des noms ou des titres.

Les bilans historiques sont toujours valides sans ces champs. La suppression
ou la correction d'un document met à jour les résultats sans modifier les autres
bilans ou les joueurs. Les fiches sont recalculées à l'ouverture et lors des
mises à jour des bibliothèques ; aucune donnée d'une autre équipe n'est cumulée.

## Vérification

`tests/player-statistics-browser.py` couvre les homonymes, renommages, anciennes
fiches, valeurs invalides, équipes/saisons, brouillons, dates futures, copies et
corrections, présence validée/manuelle, doublons de séances, récurrences sans
pointage, saisie réelle, sauvegarde/rechargement, impression et fiche responsive
avec croix rouge externe.

## Effectif épuré

Les cartes blanches, à avatar compact, utilisent une ligne de quatre groupes sans boîtes intérieures : minutes, taux de présence, buts / passes et cartons jaunes / rouges. Les valeurs inconnues restent « — ». Le poste et le numéro accompagnent la photo et le nom ; le pied préféré est conservé dans la fiche détaillée. Les actions existantes restent disponibles sous « Gérer le joueur », sans déclencher la fiche de statistiques. Le clic sur la carte ou le bouton de nom ouvre le bilan de saison, avec croix rouge extérieure.

La fiche rassemble les chiffres de saison, les bilans par match et une rubrique repliable « Présences aux séances ». Son historique est dérivé des mêmes pointages validés, dédoublonnés par date et horaire, que le calcul de présence : aucun créneau sans pointage n’est transformé en absence. Aucun changement du stockage ni migration des fiches n’est nécessaire.

`tests/squad-clean-browser.py` vérifie quatre groupes, les actions repliées, le clic sur le joueur, la croix externe et l’absence de débordement aux formats 320, 390, 768 et 1440 pixels. Les tests de gestion d’effectif empruntent désormais le menu « Gérer le joueur ».

Les cartons sont représentés par deux petits rectangles (jaune `#facc15`, rouge du club `#e41f28`) avec leur nombre. Les libellés accessibles distinguent explicitement jaunes et rouges ; « — » reste une valeur inconnue et ne devient pas zéro. La ligne de statistiques revient à la ligne sur les petites cartes plutôt que de déborder. Les statistiques détaillées et les actions restent accessibles comme précédemment.

## Pointage des séances récurrentes

Le suivi individuel affiche uniquement identité, statut, minutes, statistiques et présence. Les champs Évaluation / 5, Observation individuelle et Objectif individuel sont retirés du formulaire ; les valeurs historiques restent conservées dans les documents et leurs exports.

Le bouton « Sélectionner les séances · calcul auto » ouvre un tiroir avec les occurrences réelles passées de l’équipe, bornées à la saison et à la date du bilan. Il est aussi accessible depuis la fiche joueur et le rendez-vous récurrent de l’agenda. Le pointage est explicite et confirmé : présent, absent, ou à confirmer. Les futures occurrences et les autres types de rendez-vous n’alimentent pas ce sélecteur. Les annulations et déplacements sont résolus à partir du modèle de récurrence actuel, y compris les exceptions.

`player-attendance-sessions.js` écrit dans la bibliothèque existante des séances, via le stockage isolé et la synchronisation existants. Une occurrence non matérialisée reçoit une fiche de séance datée avec un pointage individuel, sans exercice inventé. Les autres joueurs commencent à confirmer. Une séance existante est réutilisée par date et horaire et les autres réponses sont conservées. Le brouillon de séance n’est pas remplacé : seule sa présence est synchronisée s’il s’agit du même document, avec refus en cas de pointage en cours différent. L’effectif prévu et l’adaptation des exercices ne sont pas modifiés ; `validationScope: individual` distingue cette opération de la validation collective de l’effectif.

L’enregistrement se fait en une écriture de bibliothèque. Les changements concurrents, le changement de coach/équipe et les occurrences supprimées sont revérifiés avant écriture. Une erreur laisse les réponses ouvertes. Le taux automatique, la fiche du joueur et l’agenda sont actualisés après réussite. Les occurrences non pointées ne sont jamais transformées en absences ; le pourcentage manuel reste disponible séparément.

`tests/player-attendance-sessions-browser.py` couvre retrait des champs sans perte des données historiques, sélection récurrente, taux 50 % puis 100 %, sauvegarde/rechargement, absence de doublons, non-modification du brouillon, erreur de stockage, occurrence devenue indisponible et responsive.
