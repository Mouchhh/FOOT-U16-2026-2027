# Animations de la bibliothèque — 20 octobre 2026

La lecture continue et les pions numérotés concernent les 61 fiches existantes. La combinaison `wall-pass` garde son lecteur dédié à la vidéo fournie ; les 60 autres utilisent le lecteur commun et des scénarios par mécanisme football. Les exercices personnels et les données sauvegardées ne sont pas remplacés.

## Chronologie et dessin

- Une horloge commune pour joueurs et ballons ; aucune pause imposée entre les actions. Le coach peut activer l’arrêt après chaque action.
- Le temps de vol d’une passe est distinct du temps de course : le ballon reste au passeur avant son départ, puis rejoint le point d’arrivée du receveur. Les conduites restent attachées au porteur.
- Les trajectoires viennent du scénario. Aucun détour automatique n’est inventé pour contourner un pion à l’écran.
- Les numéros, équipes, gardiens, ballons et dimensions viennent du plan de la séquence ; ils restent stables pendant la lecture.
- Les copies d’impression et d’atelier libre conservent les placements initiaux. La lecture ne modifie pas la séance.
- Les pions ronds bleus, rouges, blancs et jaunes privilégient la lisibilité du numéro. Les buts, portes, zones et dimensions restent représentés.
- La liste des actions est repliée par défaut. Les commandes lecture, pause, retour, vitesse, curseur et orientation restent accessibles.

## Scénarios repris

Les circuits de passes et de prise d’information animent tous les ateliers en parallèle, chacun avec son ballon. Après les transmissions, les joueurs rejoignent physiquement le poste suivant, jusqu’à la rotation complète ; avec trois joueurs, le troisième garde le ballon et devient le prochain départ. Avec une file, il sert le joueur qui prend le départ et rejoint la fin de file.

Les rondos montrent plusieurs connexions sur le pourtour et le déplacement de la pression. La conservation avec appui montre la liaison, ses sorties et le soutien. Les jeux à en-buts terminent sur une réception dans la cible ; les jeux directionnels illustrent une progression jusqu’à leur cible.

Les mécanismes appui-remise, troisième joueur, dédoublement, course intérieure, profondeur, renversement, pivot et jeu dos au but gardent leurs actions distinctes. Pression, couverture, bloc et temporisation ont leurs propres déplacements défensifs.

À la perte, le même ballon est intercepté puis ressorti par l’autre équipe. Le pressing sur relance démarre depuis le gardien lorsqu’il est présent. La finition comprend un échange de préparation ; le duel gardien illustre approche, réduction d’angle et arrêt. Le corner défensif montre l’intervention et le dégagement ; la seconde action sur corner montre le dégagement, la maîtrise et la nouvelle attaque.

Ces scènes sont des exemples pédagogiques, pas une simulation de toutes les décisions possibles ni une homologation fédérale. Les critères de la séquence restent affichés ; plusieurs variantes peuvent partager le même exemple de principe lorsque le mécanisme ne change pas. Les trajectoires ne constituent pas une consigne obligatoire dans le jeu réel.

## Vérifications

`tests/bible-continuous-catalogue.js` parcourt les 61 exercices, leurs quatre séquences et cinq effectifs, avec adaptation en ateliers. Il vérifie la continuité, les identités, les ballons, les limites de terrain, les vitesses et les rotations complètes des circuits.

Les tests navigateur vérifient les 61 fiches réelles, les changements de séquence, la copie imprimable, le lecteur dédié de la combinaison, les rôles/matériels et la lecture mobile. La qualité football reste à apprécier en situation avec les éducateurs ; les vérifications techniques ne la remplacent pas.

## Vue coach et volumes des équipes

La présentation des oppositions utilise un terrain aux couleurs sobres et des pions dont la taille tient aussi compte de la densité du groupe. Le bouton « Volumes des équipes » affiche ou masque une enveloppe légère de l’occupation du terrain. Ces enveloppes suivent les positions réelles pendant la lecture, excluent les gardiens dans les buts et les joueurs en rotation, et ne représentent ni une zone réglementaire de l’exercice ni une trajectoire. Le mode portrait applique la même transformation aux joueurs et aux enveloppes. Les copies imprimées conservent l’installation initiale.
