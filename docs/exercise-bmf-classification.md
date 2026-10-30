# Classement des exercices par intentions de jeu

Le menu utilise les quatre grands axes de l’image fournie par le coach, plus
« Ludique ». Il ne présente plus les groupes Avec/Sans ballon ni leurs anciennes
sous-catégories. Aucun filtre par zone n’a été ajouté : seuls les grands axes sont
proposés, conformément à la demande.

| Intention affichée | Clé | Exercices |
|---|---|---:|
| Mon équipe possède le ballon | ball | 40 |
| Mon équipe perd le ballon | loss | 4 |
| Mon équipe récupère le ballon | win | 6 |
| Mon équipe ne possède pas le ballon | off | 12 |
| Ludique | ludic | 3 |

Les 65 exercices sont conservés et classés une seule fois. Les thèmes, consignes,
schémas, adaptations et variantes restent inchangés. Les situations de perte
(transition, contre-pressing, équilibre à la perte, repli) et de récupération
(contre-attaque, première passe, sécurisation, relance du gardien, renforts) ont
leur propre axe. Les CPA conservent leur thème spécifique sous la possession
ou la non-possession selon leur objectif. « Ludique » remplace le libellé
Activation, bilan & réinvestissement, sans supprimer les trois fiches.

Les deux sélecteurs — intention principale de la séance et filtre de la Bible —
sont des listes plates avec les mêmes cinq choix. Les raccourcis dans la recherche
avancée emploient également ces axes. Changer d’axe efface l’ancien filtre caché
par moment du jeu et le thème précédent pour éviter une intersection invisible.
Le filtre par thème, la recherche, l’impression et les autres fonctions restent
accessibles.

## Compatibilité

Les clés historiques sont toujours valides dans les séances et documents partagés :

- progress et finish s’affichent comme ball ;
- oppose et protect s’affichent comme off ;
- complementary s’affiche comme ludic.

L’affichage et les anciens filtres de navigation traduisent ces clés ; les
bibliothèques enregistrées ne sont pas réécrites en masse. Lors d’une nouvelle
modification de la séance, le formulaire enregistre la clé du nouvel axe choisi.
Les anciennes et les nouvelles clés sont acceptées par trainingValid.

## Vérification

`tests/exercise-classification-browser.py` couvre les cinq choix sans optgroup,
la couverture unique des 65 exercices, les transitions, les filtres combinés,
les raccourcis, la sauvegarde et le rechargement, une ancienne séance, l’ancien
filtre « finish » restauré par Retour, l’impression et les écrans 320/390/1366.
`tests/training-sections-browser.py` et `tests/training-learning.js` passent.

Le test historique `tests/workspace-navigation-browser.py` utilise encore
`#view-training-tools`, un ancien menu retiré avant cette modification : il
échoue sur ce sélecteur. Le retour de navigation des filtres est vérifié avec
l’interface actuelle dans le test de classement ci-dessus.
