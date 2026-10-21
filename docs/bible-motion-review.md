# Revue des démonstrations — 21 octobre 2026

Cette passe complète la revue des trois situations par fiche décrite dans
[bible-exercise-design-review.md](bible-exercise-design-review.md).

## Corrections

- Les appels ont un départ et une durée propres : le receveur continue sa course pendant la passe. Les courses sont plafonnées à 3,8 m/s dans la démonstration.
- Les couvertures défensives occupent des hauteurs différentes. Les rondos conservent leurs soutiens sur le pourtour ; les passes ne traversent plus automatiquement les défenseurs.
- Les interceptions suivent une passe tentée. Les dégagements de second ballon produisent un ballon libre que le soutien rejoint, au lieu d'une passe volontaire à l'adversaire.
- Les situations de première passe après récupération commencent explicitement avec le ballon déjà récupéré. Aucun changement de possession artificiel ne sert à lancer cette démonstration.
- Les centres aériens des situations concernées ont une hauteur et une ombre au sol ; les passes en retrait restent au sol. Les arrivées au second poteau sont retardées pour rejoindre le centre.
- Le pressing sur sortie de but utilise un vrai gardien, son grand but et deux mini-buts de sortie. L'absence de gardien rend ce format incompatible plutôt que de remplacer silencieusement son rôle.
- Les alternatives de conduite gardent le ballon ; la sécurisation après récupération propose un soutien au lieu de forcer une passe en avant.

## Vérifications

`node tests/bible-pedagogical-motion.js` parcourt les 63 fiches, trois situations,
deux âges, trois niveaux et plusieurs effectifs, avec tous les groupes proposés.
Résultat : 6 504 configurations compatibles, 14 846 passes et 2 252 appels retardés.
Le contrôle mesure la vitesse pendant la durée effective de la course et la
proximité des adversaires sur les 80 % centraux des passes au sol. Les départs et
réceptions sous pression sont autorisés ; ce n'est pas un simulateur de collisions.
Les centres aériens sont contrôlés séparément.

Une revue de captures à quatre instants des trois situations des 62 lecteurs SVG
complète les tests. Le passe-et-va utilise son lecteur de référence distinct.
Le test navigateur `bible-pedagogical-motion-browser.py` vérifie le rendu aérien,
l'arrivée retardée, le gardien de relance, la lecture mobile et l'impression stable.

Les démonstrations illustrent une décision possible, sans imposer une chaîne de
passes à un jeu libre. Ces contrôles techniques et cette revue ne constituent pas
une validation fédérale ni une garantie d'efficacité pédagogique sur le terrain.
Les variantes et documents personnels des coachs ne sont pas migrés ni effacés.
