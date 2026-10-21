# Lecture pédagogique et repères — 21 octobre 2026

## Utilisation

Dans la fiche d'un exercice, « Pauses pédagogiques » permet de jouer jusqu'au
prochain point de décision. Pour une passe, l'arrêt précède le départ du ballon ;
une question identifie le passeur et le destinataire. « Continuer » reprend sans
replacer les joueurs. Les tirs, conduites, récupérations et dégagements ont leurs
propres questions. Le mode historique « Arrêt après chaque action » reste disponible ;
les deux modes s'excluent pour éviter des arrêts contradictoires.

« Comprendre le placement et le choix » reste fermé par défaut. Il expose le
déclencheur, le choix recherché dans la variante, l'occupation de l'espace,
l'observation et une correction possible. Le contenu dépend du mécanisme de jeu,
du format, de la variante et des critères déjà utilisés par la fiche. Il ne s'agit
pas d'une nouvelle source fédérale ni d'une nouvelle validation des exercices.
La combinaison de référence possède aussi cette seconde lecture ; son lecteur
intégré conserve ses commandes propres.

Dans les lecteurs SVG, l'option « Repères de placement », à l'intérieur de cette
seconde lecture, permet de sélectionner tous les joueurs actifs. Le
joueur est entouré et les distances au partenaire et à l'adversaire les plus proches
sont calculées depuis les positions visibles et l'échelle du terrain. Ce sont des
mesures de l'exemple, pas des distances réglementaires ou des garanties de passe
libre. Les appuis neutres ne sont pas présentés comme adversaires.

Les soutiens des rondos de base occupent désormais tout le pourtour, comme leurs
variantes ; deux proximités de départ inutiles ont été supprimées. Les trajectoires
et l'identité des acteurs restent continues. Les contenus personnels, le format de
sauvegarde et la copie imprimée n'ont pas changé.

## Contrôles

- `tests/bible-decisions-browser.py` : 189 lectures, 507 moments de décision,
  arrêts avant les passes, reprise, modes exclusifs, mesures, variantes,
  impression intacte, mobile et combinaison de référence.
- `tests/bible-pedagogical-motion.js` : 6 504 configurations compatibles des
  63 exercices, avec contrôle des courses et des lignes de passe après les
  ajustements des placements de rondo.
- Tests navigateur existants : cycle du lecteur et conservation des variantes.

Ces contrôles vérifient le fonctionnement et la cohérence de la représentation.
La démonstration illustre un choix possible ; la lecture de l'opposition réelle
reste le travail du joueur et du coach.
