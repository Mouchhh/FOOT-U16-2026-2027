# Étape 5 · Bible de l’éduc

Vérifiée le 21 octobre 2026. La livraison consolide le catalogue et son parcours
jusqu’à la séance ; elle ne prétend pas homologuer les exercices ni ajouter des
sources ou des vidéos externes qui n’ont pas été examinées.

- [x] Audit des 63 fiches et 189 démonstrations : objectif, contexte de match,
  installation, rôles, matériel, variantes et références éditoriales identifiés.
- [x] 2 268 cas catégorie/niveau/effectif et 6 669 ateliers : joueurs, gardiens,
  chasubles, durée et répartition cohérents ; installations incompatibles signalées.
- [x] 6 504 animations compatibles et 14 846 passes contrôlées pour les trajectoires ;
  5 928 configurations des variantes pour la continuité et les identités.
- [x] Profil utilisé visible dès le catalogue : catégorie, compétences, effectif,
  gardiens et espace. La catégorie participe à l’actualisation des résultats.
- [x] Fiche : schéma à côté des consignes sur grand écran ; démonstration avant les
  détails approfondis sur téléphone ; ajout et personnalisation accessibles en haut.
- [x] Lecture progressive conservée : installation, séquences, trois situations à
  démontrer, consignes rapides et connaissances approfondies.
- [x] L’ajout vérifie toutes les séquences, pas seulement la première : effectif,
  gardiens, espace, organisation et durée minimale de jeu après récupération.
- [x] Une incompatibilité indique la séquence à adapter et ne crée pas de bloc.
- [x] En cas d’échec du stockage, le bloc n’est pas ajouté et aucun succès fictif
  n’est annoncé. Les blocs précédents sont conservés.
- [x] La situation choisie est conservée dans le bloc et après rechargement.
- [x] Déplacements personnalisés, ballon lié au joueur, animation personnelle,
  indépendance des séquences, annulation et sérialisation vérifiés.
- [x] Pions numérotés, orientation, buts, impression statique et téléphone vérifiés.

## Tests exécutés

```sh
node --check training-bible.js
node tests/bible-release-audit.js
node tests/bible-design-variants.js
node tests/bible-pedagogical-motion.js
python tests/bible-quality-browser.py
python tests/bible-addition-browser.py
python tests/bible-visual-browser.py
python tests/bible-personal-diagrams-browser.py
python tests/bible-progressions-browser.py
python tests/bible-continuous-ui.py
python tests/workspace-polish-browser.py
```

Voir le [relevé exercice par exercice](bible-release-audit.md). Les tests contrôlent
le logiciel et les contrats pédagogiques explicités ; une animation démontre une
solution, elle ne simule pas toutes les décisions adverses. Intensité, contacts,
récupération et adéquation au groupe restent à observer par le coach sur le terrain.
Les références existantes sont conservées avec leur portée, sans nouvelle prétention
de validation FFF. Aucun changement Supabase ni service payant ajouté.
