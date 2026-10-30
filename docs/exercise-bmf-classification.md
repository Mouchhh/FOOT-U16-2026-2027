# Intentions de jeu et sous-parties

La Bible et le créateur de séance utilisent les axes et les sous-parties de
l’image fournie par le coach. Le filtre « Thème de séance » et ses anciennes
options sont remplacés par « Sous-partie ». Les anciennes cases de choix des
thèmes ne sont plus affichées dans le créateur.

| Axe | Sous-parties de l’image |
|---|---|
| Mon équipe possède le ballon | Zone 1 · Construire le jeu ; Zone 2 · Maîtriser et déstabiliser ; Zone 3 / Box · Finition |
| Mon équipe perd le ballon | Zone 1 / Box · Défendre le but ; Zone 2 · Freiner l’attaque ; Zone 3 · Pressing |
| Mon équipe récupère le ballon | Zone 1 · Jouer vers l’avant ; Zone 2 · Chercher la zone 3 ; Zone 3 / Box · Marquer le but |
| Mon équipe ne possède pas le ballon | Zone 1 / Box · Défendre bas ; Zone 2 · Contrôler l’adversaire ; Zone 3 · Défendre haut |
| Ludique | Pas de sous-partie |

Le premier sélecteur reste une liste de cinq axes. Le second propose les trois
sous-parties de l’axe choisi ; sans axe, il les regroupe par axe. Il est masqué
pour Ludique. Choisir directement une sous-partie sélectionne son axe.

Les 65 exercices sont conservés. Les 62 hors Ludique sont répartis une seule
fois entre les douze sous-parties ; les trois fiches Ludique restent accessibles.
Les textes, schémas, variantes et adaptations ne sont pas remplacés. Les axes
comptent toujours 40 exercices en possession, 4 à la perte, 6 à la récupération,
12 en non-possession et 3 en Ludique. Le classement est éditorial, selon
l’objectif dominant de chaque fiche.

## Séances et compatibilité

Le champ facultatif `bmfObjective` conserve la sous-partie et doit correspondre
à l’axe `bmfCategory`. Il est stocké dans le brouillon, la bibliothèque et le
document partagé ; il est imprimé avec l’intention de séance. Changer d’axe
réinitialise la sous-partie précédente.

Les clés historiques restent acceptées : progress/finish sont affichés en ball,
oppose/protect en off, complementary en ludic. Aucun traitement ne réécrit les
bibliothèques enregistrées en masse. Les anciens filtres de navigation sont
traduits ou remis à zéro lorsqu’un ancien nom de thème n’est plus une option.

Les anciens tableaux `session.themes` restent dans les données pour préserver
les séances existantes, la recherche et le moteur de propositions. À la lecture
d’une ancienne séance, ils ne sont pas changés. Lors d’un nouveau choix d’axe
ou de sous-partie par le coach, ils sont déterminés à partir de ce choix pour
que le générateur continue de fonctionner : Construire le jeu → Relance,
Finition → Finition, Défendre bas → Défense, etc. Aucun choix de thème générique
supplémentaire n’est demandé à l’utilisateur.

## Vérification

`tests/exercise-classification-browser.py` couvre les cinq axes, les douze
sous-parties, la couverture unique de tous les exercices, les filtres combinés,
les raccourcis, la sauvegarde et le rechargement de la sous-partie, l’absence
des anciennes cases de thèmes, les séances historiques, les anciens filtres de
navigation, l’impression et les écrans 320/390/1366.

`tests/training-sections-browser.py` et `tests/training-learning.js` passent.
Le test historique `tests/workspace-navigation-browser.py` utilise encore
`#view-training-tools`, un ancien menu retiré avant ces modifications. Le retour
de navigation des filtres est vérifié avec l’interface actuelle dans le test de
classement ci-dessus.
