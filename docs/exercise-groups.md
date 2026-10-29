# Choisir les groupes d’un exercice

Dans une fiche de la Bible ou un exercice ajouté au déroulé : ouvrir **Mon groupe
& mon terrain**, choisir **Organisation → Choisir mes groupes**, puis indiquer
le **Nombre de groupes**. Chaque groupe a son effectif, gardiens inclus, et son
nombre de gardiens. Un groupe correspond à un atelier du même exercice ; les
équipes, appuis et rôles de jeu sont ensuite calculés pour ce groupe.

Les tailles peuvent être différentes. Le total actif est calculé depuis les
lignes ; le groupe présent de la séance reste inchangé. Par exemple, sur 18
présents dont 2 gardiens, choisir 8 joueurs dont 1 gardien et 6 joueurs sans
gardien laisse 4 joueurs en rotation, dont 1 gardien. Les schémas et le matériel
utilisent ces groupes précis, sans les équilibrer silencieusement.

Les réglages appartiennent à l’exercice et à sa séquence. **Appliquer à toutes
les séquences** reprend les groupes pour tout cet exercice, avec des copies
indépendantes : modifier ensuite une séquence ne modifie pas les autres. Un autre
exercice garde ses propres groupes. La séance enregistrée conserve ces réglages
après rechargement et les réutilise à l’impression.

On peut revenir aux ateliers équilibrés ou à la proposition automatique. Les
propositions équilibrées ne sont pas marquées comme déjà choisies lorsqu’une
répartition personnelle est active. Sélectionner une proposition remplace
explicitement les critères de cette séquence.

## Contrôles

- De 1 à 40 groupes et au moins 2 joueurs par groupe, dans la limite des 80 présents.
- Gardiens compris dans les joueurs, sans dépasser les gardiens présents ni
  inventer des joueurs de champ.
- Groupe trop petit, trop grand, sans le gardien nécessaire ou terrain trop
  serré : signalement conservé ; la répartition choisie n’est pas modifiée pour
  faire disparaître l’erreur. Une allocation supérieure aux présents n’affiche
  pas un schéma présenté comme utilisable.
- Les variantes existantes sans `groupRoster` gardent la répartition équilibrée
  et le même format de sauvegarde. Le nouveau champ est optionnel dans les
  réglages de séquence. Les dessins personnels ne sont pas réécrits.
- L’impression distingue deux répartitions ayant les mêmes totaux, par exemple
  8 + 6 et 6 + 8 ; elles ne sont pas dédupliquées comme une seule installation.

## Vérifications

`tests/exercise-groups.js` couvre 1 040 répartitions sur les 65 exercices : tailles
inégales, gardiens affectés exactement, entrées inchangées, absence de joueurs
perdus. Il vérifie aussi les joueurs hors exercice, les totaux incohérents et la
finition avec un gardien dans un seul des deux groupes.

`tests/exercise-groups-browser.py` utilise les vrais contrôles : 8 + 6 avec un
puis zéro gardien, schémas de 8 et 6 joueurs, autre répartition sur un second
exercice, application à toutes les séquences puis modification indépendante,
dépassement d’effectif refusé, enregistrement / rechargement, retour au mode
automatique et impression de deux répartitions de même total. Contrôles à
320×740, 390×844, 844×390 et 1280×720 ; vérification visuelle sur portable et téléphone.

Les contrats de pédagogie des 65 fiches, les cinq exercices repères et le test
navigateur des adaptations explicites ont également été exécutés. Ce dernier
choisit désormais explicitement un terrain unique avant de tester le refus d’un
rondo de 40 joueurs : le catalogue peut proposer des ateliers dès l’ouverture.
Le test historique `bible-sequences-browser.py` n’est pas annoncé passant : il
utilise encore une entrée masquée de l’ancienne navigation et suppose un terrain
unique par défaut pour 40 joueurs. Les nouveaux contrôles de groupe et la suite
d’adaptation ont leurs propres vérifications du comportement actuel.
