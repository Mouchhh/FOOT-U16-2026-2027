# Ateliers simultanés et fiche terrain

Dans **Séances → Déroulé**, ajouter les exercices puis utiliser **En parallèle
avec le précédent** sur le second. Indiquer pour chaque atelier son nombre de
joueurs, gardiens compris, et son nombre de gardiens. On peut ajouter un troisième
exercice à la même phase. **Répartir les ateliers** modifie cette répartition ;
**Remettre à la suite** détache l’exercice. Une phase simultanée reste contiguë
dans le déroulé : déplacer ou retirer un bloc nettoie les identifiants isolés.

Les groupes des différents exercices sont distincts. À l’intérieur d’un exercice,
**Mon groupe & mon terrain → Choisir mes groupes** reste disponible pour créer
plusieurs sous-groupes, y compris de tailles différentes. La répartition entre
exercices initialise toutes les séquences ; elle conserve les consignes et les
dessins personnels. Une répartition manuelle interne reste inchangée si ses
totaux correspondent au nouvel effectif, sinon elle revient à un groupe.

## Temps, ressources et rotations

- Le temps de la phase est le maximum des installations, puis le maximum des
  durées d’activité/récupération. Les durées des ateliers ne sont pas additionnées.
- Le bilan de temps distingue la durée commune des ateliers, dont les rythmes
  individuels restent visibles sur leurs fiches. **Répartir la durée prévue**
  aligne leurs durées sans descendre sous les récupérations et temps minimaux.
- Le matériel est additionné entre les ateliers simultanés. Entre deux phases
  successives, il peut être réutilisé : on conserve le maximum par type.
- La relecture signale les dépassements de joueurs, de gardiens et de joueurs de
  champ, les joueurs non affectés, les durées différentes et l’espace insuffisant.
  Les besoins retenus sont les maxima des séquences, par prudence.
- Un signal commun permet de changer d’atelier. Si les effectifs diffèrent, il
  faut recomposer les groupes ; aucun échange automatique de groupes entiers
  n’est promis. La répartition porte sur des nombres, pas des joueurs nommés.
- Les dessins personnels restent inchangés : le coach doit vérifier que les
  rôles dessinés correspondent au groupe. Leur matériel libre n’est pas converti
  automatiquement en quantités ; il complète l’inventaire calculé.

Les horaires communs, les effectifs, le matériel et les avertissements figurent
également dans la fiche imprimable. Enregistrement et rechargement conservent les
phases sans changer le format historique des séances sans ateliers simultanés.

## Lecture au bord du terrain

**Fiche terrain**, à côté de l’impression, ouvre une copie de la séance en lecture.
Choisir une phase, un exercice puis sa séquence. L’objectif de jeu, le schéma,
le départ, le score, les consignes, les rotations et la récupération restent
consultables sans outils d’édition. **Organisation et matériel** se déplie à la
demande. Les notes exactes du coach restent affichées. Fermer la fiche ne modifie
ni les consignes, ni les schémas, ni les groupes.

## Vérifications

`tests/training-stages-field-browser.py` utilise les vrais contrôles pour deux
ateliers de neuf joueurs dont un gardien chacun : durée commune, six ballons
(réserves comprises), capacité, surface, durées différentes, réutilisation du
matériel entre phases, refus d’écriture sans modification du brouillon,
enregistrement/rechargement, ajustement de durée, lecture sans modification,
impression et séparation. Affichages vérifiés à 320×740, 390×844, 844×390 et
1280×720, avec captures téléphone et portable.

Les tests navigateur de groupes par exercice, navigation par tâches, parcours
hebdomadaire, récupération de brouillons, liens entre espaces, bibliothèque des
exercices personnels et passage bilan → séance complètent ces vérifications.
Ces essais ne remplacent pas une observation avec les joueurs sur le terrain.
