# Étape 10 · Construction des séances

22 octobre 2026. Parcours logiciel vérifié dans Chromium, sur ordinateur et téléphone.
La validation pédagogique pendant une vraie semaine d’entraînement reste à conduire
avec les éducateurs ; le logiciel ne mesure ni fatigue ni charge physiologique.

## Fonctionnement livré

- [x] Objectif de séance conservé et rappel des exercices hors des thèmes prioritaires.
  Relecture des consignes, de l’effectif actif et des joueurs en rotation par séquence.
- [x] Ordre vérifié : activation placée après un autre bloc et retour au calme placé
  avant la fin sont signalés, sans imposer une progression pédagogique universelle.
- [x] Monter, descendre et retirer un exercice avec conservation du reste du déroulé.
- [x] Remplacer directement : choix d’un exercice compatible, aperçu de son objectif,
  de ses rôles, de ses dimensions, de son matériel et de ses temps avant confirmation.
- [x] Remplacement conservant la place, l’identifiant du bloc, la durée, l’installation,
  les notes et l’objectif de séance. Nouvelle variante propre à l’exercice choisi ;
  les dessins de l’ancien exercice ne sont pas attribués au nouveau.
- [x] Annulation sans changement ; refus si groupe ou bloc a changé pendant la sélection.
- [x] Installation/transition renseignable avant chaque bloc, de 0 à 15 min.
  « 0 » correspond à un matériel déjà installé ; aucun temps nouveau n’est inventé
  pour les anciennes séances.
- [x] Activité et récupération issues des séquences réelles de la Bible, y compris
  leurs pauses intermédiaires ; installation ajoutée au total et à l’heure de fin.
- [x] Exercices personnels : récupération comprise renseignable explicitement.
  Avant renseignement, le temps reste « activité/récupération à préciser ».
  Réduire la durée sous la récupération prévue est refusé.
- [x] Répartition automatique de la durée : installation conservée, récupérations
  prévues conservées et au moins 30 s de jeu par séquence ; refus si impossible.
- [x] Relecture signalant objectif absent, ordre à vérifier, contenu hors priorités,
  installation incompatible, joueurs hors exercice et récupérations à préciser.
- [x] Modification écrite avant succès ; échec de stockage rétablissant l’ancien
  déroulé. Retrait/remplacement conservant aussi une copie de récupération.
- [x] Rechargement et document imprimable conservant les nouveaux temps ; compatibilité
  des anciens blocs sans ces champs. Partage et navigation existants vérifiés.

## Vérifications exécutées

```sh
node --check training.js
node --check training-custom.js
node --check training-review.js
node --check training-builder.js
node tests/training-learning.js
python tests/training-builder-browser.py
python tests/club-completion-browser.py
python tests/bible-addition-browser.py
python tests/bible-personal-diagrams-browser.py
python tests/report-training-browser.py
python tests/workspace-navigation-browser.py
python tests/club-network-browser.py
```

Le parcours dédié construit 60 min avec 6 min d’installation, modifie un temps,
réordonne, annule puis confirme un remplacement, simule un stockage plein, retire
un bloc, répartit les temps et recharge la préparation. Les budgets additionnent
activité + récupération + installation + temps personnel non réparti sans doublon.
Les intégrations Supabase sont simulées, sans compte ni document réel modifié.

## Recette en situation à consigner

- [ ] Coach débutant et expérimenté construisent chacun une séance sans assistance.
- [ ] Chronométrer les installations et transitions pendant une séance réelle.
- [ ] Observer l’enchaînement des contenus, la compréhension et les récupérations ;
  ajuster selon les joueurs et les conditions, pas seulement selon la durée totale.

Les contraintes de temps sont des repères éditoriaux ; la durée et le profil ne
suffisent pas à prouver une charge adaptée à chaque joueur. Aucune migration SQL,
nouveau service externe ou nouvelle homologation fédérale.
