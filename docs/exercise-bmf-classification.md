# Classement des exercices par intentions de jeu

La fiche BMF fournie par le coach sert de repère de classement. Les catégories
ne désignent pas un diplôme attribué aux exercices.

| Moment | Intention principale | Exercices |
|---|---|---:|
| On a le ballon | Conserver / Progresser | 26 |
| On a le ballon | Déséquilibrer / Finir | 20 |
| On n’a pas le ballon | S’opposer à la progression | 9 |
| On n’a pas le ballon | S’opposer pour protéger son but | 7 |
| Compléments | Activation, bilan & réinvestissement | 3 |

Chaque exercice a une intention dominante, déterminée par son apprentissage,
plutôt que par la seule présence d’un ballon ou d’un but. Le thème précis reste
conservé : un corner offensif et un corner défensif restent tous deux des CPA,
mais appartiennent à deux intentions différentes. De même, le jeu au pied du
gardien se classe dans la progression et le travail de sortie face au porteur
dans la protection du but.

Dans la Bible, les filtres « Intention de jeu » et « Thème de séance » se
combinent ; la liste des thèmes dépend de l’intention sélectionnée. Les anciens
filtres de moments du jeu restent dans « Affiner la recherche ».

Dans « Mon intention », le coach peut enregistrer l’intention principale de
la séance. Elle complète les thèmes précis, sans supprimer les choix existants,
et apparaît sur la fiche imprimée. Le champ facultatif `bmfCategory` conserve
la compatibilité des anciennes séances et des documents partagés.

Le test `tests/exercise-classification-browser.py` vérifie la couverture unique
des 65 exercices, les filtres combinés, leur réinitialisation, la sauvegarde et
le rechargement de l’intention, l’impression et les écrans de 320 à 1366 pixels.
