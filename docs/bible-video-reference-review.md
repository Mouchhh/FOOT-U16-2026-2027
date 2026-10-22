# Revue à partir des vidéos du coach — 22 octobre 2026

Cette livraison améliore le lecteur commun et corrige des placements précis ; elle
ne prétend pas avoir réécrit les 189 chorégraphies à partir de 13 vidéos. Les
63 fiches et leurs trois variantes ont été parcourues dans le lecteur, avec une
planche de contrôle prise pendant chaque variante. Les contrôles de mouvement
couvrent les trajectoires complètes ; les planches seules ne suffisent pas à
valider toute la pédagogie d'une animation. L'essai terrain reste ouvert.

## Fichiers effectivement examinés

| Enregistrement | Ce qui est visible | Repère retenu |
|---|---|---|
| 14-38-37 · 14 s | Petite opposition dans un carré, sortie vers une autre zone et cible ; mention thecoacheszone / thetacticsapp | Départ identifiable, espace de conservation distinct de l'espace suivant, sortie lisible |
| 14-36-31 · 14 s | « The 2-3-2 Positional Mastery Drill », Total Football ; joueurs à plusieurs hauteurs | Largeur, profondeur et relais décalés ; les soutiens ne viennent pas tous au ballon |
| 10-36-40 · 17 s | « 2v2 practice with a bounce player at each… », finalthird.pro ; opposants et appuis extérieurs | Distinguer joueurs dans le jeu, appuis et attente ; une trajectoire utile à la fois |
| 14-41-00 · 17 s | « Finishing & 1v1 Drills », llearnthegame ; ballon, départs, haies/piquets et gardien | Service, déplacement et finition séparés dans le temps ; matériel identifiable |
| 14-40-24 · 17 s | Deux espaces d'opposition, gardiens et mini-buts ; thecoacheszone / thetacticsapp | Cibles et rôles visibles dans chaque espace, sans mélanger les ballons |
| 10-46-07 · 19 s | « Combine, Switch & Finish Circuit », Total Football | Numéros conservés, postes espacés et liaison passe–course–finition |
| 10-39-19 · 16 s | Circuit de coordination et frappe, sertcoach | Retours séparés du jeu, équipement placé pour une tâche compréhensible |

Ce sont des observations d'extraits, pas des règlements complets. Leurs dimensions,
leurs temps de travail, leur public et leur niveau ne sont pas tous indiqués : ils
ne sont donc pas inventés ni attribués aux auteurs. Les adaptations et dimensions
présentées dans la Bible restent celles des fiches du club. Ces références visuelles
ne constituent pas une homologation FFF/BMF/BEF/DES.

Six fichiers n'ont pas pu être transférés (limite de 32 Mio par fichier) :
14-37-32, 14-35-23, 10-42-30, 10-37-17, 10-34-48 et 10-21 à 23-45-10.
Ils ne sont pas comptés comme visionnés. Les vidéos et captures originales ne
sont pas publiées dans le dépôt ou sur le site.

## Corrections appliquées

- Lecteur : terrain mieux cadré ; légendes d'installation et cotes retirées du
  dessin animé, conservées sur la copie imprimable. Les dimensions L × l, le nombre
  de joueurs et les cibles sont lisibles au-dessus du terrain.
- Orientation : numéros **et labels des zones/circuits** restent droits lors des
  changements de vue. Le nouveau contrôle a détecté puis permis de corriger une
  interaction avec l'ancien traitement des textes tournés.
- Trajets : moins de petits tracés sans valeur explicative ; retrait des cercles
  fantômes aux destinations. Seule l'action en cours est tracée, avec une légende
  distinguant le ballon des courses. Aucun lissage décoratif ne modifie les passes.
- Finition : le placement échelonné service–finisseur–soutien et les deux hauteurs
  défensives étaient dans une condition inaccessible (« renforts »). Ils sont
  désormais appliqués aux finitions concernées. Les départs des variantes gardent
  leurs propres placements et les distributions du gardien sont préservées.
- Second poteau : l'appel de la première variante part réellement plus bas et
  arrive sur le centre, plutôt que d'attendre déjà dans la zone d'arrivée.
- Les variantes personnelles et le lecteur technique spécifique « wall-pass »
  sont conservés. Ce dernier utilise déjà des retours par matériel et une rotation
  continue ; il est contrôlé séparément, pas remplacé par le lecteur générique.

## Vérification reproductible

`python tests/bible-video-reference-browser.py --gallery` parcourt les 63 fiches
et les 189 variantes compatibles dans Chromium. Il écrit les planches et le
relevé des actions dans `/tmp/club-bible-reference-review`, avec des données de test.
Il vérifie les dimensions, les effectifs, les orientations et l'indépendance de
la copie imprimée. Le lecteur technique spécifique conserve les mêmes identités.

Contrôles complémentaires : `bible-pedagogical-motion.js` (6 504 animations,
14 846 passes, appels retardés, vitesse et interception), `bible-design-variants.js`
(continuité et variantes distinctes), `bible-adaptation-final.js` (1 008 configurations),
`bible-pedagogical-motion-browser.py`, `bible-visual-browser.py` et
`bible-personal-diagrams-browser.py` (modifications personnelles conservées).

## Relevé fiche par fiche

Chaque ligne ci-dessous correspond à trois variantes rendues et contrôlées. Les
cotes sont une **installation représentative proposée par l'outil**, pas des
mesures relevées dans Instagram. « Contrôlé » ne signifie pas « validé sur le terrain ».

| Fiche | Installation L × l | Trois variantes contrôlées |
|---|---|---|
| Activation avec ballon | 6 joueurs · 20 × 20 m | Conduite et espaces libres / Changer de surface / Regarder avant de repartir |
| Retour au calme et bilan | 8 joueurs · 20 × 20 m | Marcher et échanger / Expliquer une réussite / Expliquer une décision |
| Passer et se déplacer | 5 joueurs · 18 × 20 m | Contrôler puis passer / Remise au soutien / Trouver le troisième |
| Conserver sous pression | 6 joueurs · 12 × 12 m | Offrir deux angles / Ressortir de la pression / Franchir si ouvert |
| Trouver le troisième homme | 6 joueurs · 22 × 24 m | Appui remise troisième / Appui marqué / Appui qui se retourne |
| Sortir de la pression | 8 joueurs · 30 × 34 m | Sortir par un côté / Axe fermé / Pression attirée |
| Déclencher le pressing ensemble | 6 joueurs · 24 × 26 m | Pression coordonnée / Passe de retour / Premier rideau dépassé |
| Enfermer sur le côté | 8 joueurs · 26 × 32 m | Orienter vers la touche / Le porteur ressort / Le piège est évité |
| Cadrer, couvrir et coulisser | 6 joueurs · 24 × 26 m | Pression et couverture / Changer le premier défenseur / Duel perdu |
| Défendre l’axe en bloc | 10 joueurs · 32 × 40 m | Bloc compact / Renversement adverse / Passe entre les lignes |
| Réagir à la perte | 6 joueurs · 22 × 22 m | Réagir à la perte / Le premier pressing est sorti / Récupérer puis sécuriser |
| Se projeter à la récupération | 8 joueurs · 28 × 36 m | Première passe vers l’avant / Axe fermé / Avantage refermé |
| Fixer puis renverser | 8 joueurs · 28 × 38 m | Attirer et renverser / Renversement fermé / Changer de relais |
| Combiner sur un côté | 6 joueurs · 22 × 28 m | Dédoublement extérieur / Appel intérieur / Défenseur qui accompagne |
| Finir après une passe | 6 joueurs · 24 × 28 m | Préparer sa frappe / Remise avant le tir / Décaler le gardien |
| Conclure un centre en retrait | 7 joueurs · 28 × 32 m | Arriver en retrait / Zone en retrait fermée / Premier poteau libre |
| Gagner son duel et protéger | 4 joueurs · 16 × 18 m | Fixer en un contre un / Utiliser le soutien / Défenseur en recul |
| Se démarquer entre les lignes | 6 joueurs · 22 × 26 m | Sortir de l’ombre / Soutien suivi / Remise et nouvel angle |
| Organiser un corner offensif | 10 joueurs · 35 × 40 m | Courses coordonnées / Corner court / Second ballon |
| Défendre un corner | 10 joueurs · 35 × 40 m | Voir ballon et adversaire / Corner court adverse / Après le dégagement |
| Relance et jeu au pied du gardien | 6 joueurs · 24 × 28 m | Deux angles de relance / Côté fermé / Remise au gardien |
| Gardien : cadrage et sortie | 5 joueurs · 22 × 24 m | Réduire l’angle / Contrôle long / Attaquant excentré |
| Conserver sur une touche | 8 joueurs · 20 × 24 m | Court puis soutien / Court marqué / Retour au lanceur |
| Jeu de réinvestissement | 12 joueurs · 36 × 45 m | Observer le principe choisi / Sortie sous pression / Attaque d’un espace libre |
| Regarder avant de recevoir | 6 joueurs · 20 × 22 m | Voir avant la réception / Soutien fermé / Orientation opposée |
| Remise et passe dans la course | 6 joueurs · 32 × 24 m | Remise et appel / Appui plus haut / Remise vers l’autre angle |
| Recevoir dos au jeu et choisir | 6 joueurs · 24 × 22 m | Protéger et remettre / Retourner côté libre / Appui suivi |
| Se retourner pour sortir de la pression | 4 joueurs · 20 × 16 m | Premier contact hors pression / Retournement fermé / Défenseur déséquilibré |
| Conserver puis trouver la passe qui traverse | 7 joueurs · 14 × 16 m | Fenêtre ouverte / Fenêtre fermée / Trouver un autre intervalle |
| Conserver avec un joueur de liaison | 9 joueurs · 24 × 28 m | Relais libre / Joker suivi / Remise du joker |
| Progresser vers une zone cible | 8 joueurs · 36 × 26 m | Arriver dans la cible / Profondeur fermée / Appel opposé |
| Franchir les trois tiers | 10 joueurs · 42 × 32 m | Passe qui franchit / Conduite qui fixe / Ligne fermée |
| Attirer la pression pour libérer un partenaire | 8 joueurs · 24 × 26 m | Fixer puis libérer / Pression qui attend / Passe lointaine fermée |
| Élargir la première ligne de relance | 10 joueurs · 38 × 36 m | Première ligne ouverte / Un côté enfermé / Porteur libre |
| Trouver le pivot sans le piéger | 9 joueurs · 36 × 30 m | Pivot accessible / Pivot marqué / Pivot libre de tourner |
| Choisir la sortie libre à la relance | 10 joueurs · 34 × 36 m | Trouver la sortie libre / Retour par la base / Sortie directe disponible |
| Remiser pour lancer dans le dos | 9 joueurs · 40 × 30 m | Appui remise profondeur / Appui fermé / Profondeur fermée |
| Appeler dans le dos au bon moment | 10 joueurs · 42 × 34 m | Départ sur passeur disponible / Passeur sous pression / Appel diagonal |
| Isoler un joueur de côté puis l’aider | 8 joueurs · 28 × 32 m | Servir le joueur large / Prise à deux / Duel favorable |
| Déclencher une course intérieure depuis le côté | 8 joueurs · 32 × 34 m | Course intérieure / Intérieur protégé / Porteur libre à l’extérieur |
| Combiner devant un bloc bas | 8 joueurs · 28 × 32 m | Remise pour ouvrir le tir / Tir direct ouvert / Dernière passe |
| Finir avec un défenseur actif | 8 joueurs · 30 × 28 m | Finir sous pression / Frappe fermée / Partenaire mieux placé |
| Occuper la surface sur un centre | 10 joueurs · 34 × 40 m | Arrivée second poteau / Premier poteau ouvert / Centre impossible |
| Se rendre disponible sur le ballon repoussé | 8 joueurs · 28 × 30 m | Préparer le second ballon / Tir bloqué / Frappe ouverte |
| Presser une relance depuis le fond | 10 joueurs · 40 × 36 m | Fermer une première sortie / Retour au gardien / Relance qui dépasse le pressing |
| Défendre à trois : pression, couverture, équilibre | 8 joueurs · 24 × 28 m | Pression couverture équilibre / Ballon de l’autre côté / Premier défenseur éliminé |
| Relier les milieux et la dernière ligne | 12 joueurs · 40 × 40 m | Deux lignes liées / Circulation latérale / Réception entre les lignes |
| Protéger la profondeur sans reculer trop tôt | 10 joueurs · 42 × 32 m | Voir passeur et appel / Passeur libre / Passeur fermé |
| Défendre le centre et la zone de retrait | 10 joueurs · 32 × 40 m | Protéger l’intérieur / Centre en retrait / Centreur bloqué |
| Défendre en infériorité et gagner du temps | 7 joueurs · 30 × 26 m | Temporiser en infériorité / Porteur excentré / Premier défenseur dépassé |
| Sécuriser la première passe après récupération | 8 joueurs · 32 × 30 m | Sortir par la première passe / Vers l’avant disponible / Vers l’avant fermé |
| Élargir la contre-attaque pour libérer l’axe | 10 joueurs · 36 × 38 m | Écarter la contre-attaque / Axe fermé / Retour adverse réussi |
| Récupérer puis choisir le bon rythme | 9 joueurs · 26 × 28 m | Reconnaître l’avantage / Sécurité d’abord / Projection disponible |
| Fermer les sorties juste après la perte | 8 joueurs · 24 × 24 m | Fermer les sorties proches / Première sortie adverse réussie / Récupération obtenue |
| Attaquer en préparant la perte | 12 joueurs · 42 × 40 m | Équilibre derrière l’attaque / Perte pendant l’attaque / Adversaire bloqué |
| Ralentir le contre puis reformer le bloc | 10 joueurs · 40 × 34 m | Ralentir puis protéger / Passe adverse latérale / Repli réussi |
| Transformer la touche en progression | 8 joueurs · 30 × 26 m | Solution courte et soutien / Court suivi / Retour au lanceur |
| Gérer la seconde action après un corner | 12 joueurs · 35 × 40 m | Préparer la zone de chute / Récupérer le dégagement / Dégagement récupéré adverse |
| Repartir vite ou installer la relance sur coup franc | 10 joueurs · 36 × 32 m | Jouer quand c’est disponible / Option rapide fermée / Adversaire compact |
| Le gardien lance la transition | 8 joueurs · 34 × 34 m | Arrêt puis relance / Première sortie fermée / Soutien sous pression |
| Attaquer et défendre · renforts progressifs | 9 joueurs · 28 × 22 m | Entrées annoncées / Renfort côté libre / Retour défensif intérieur |
| Rondo évolutif · 5 contre 2 puis 8 contre 5 | 13 joueurs · 32 × 32 m | Sortir dès la récupération / Première sortie fermée / Changer de côté après la sortie |
| Quatre secteurs · 4 contre 4 et 3 appuis | 11 joueurs · 20 × 20 m | Passer par l’appui central / Contourner le centre / Revenir pour progresser |
