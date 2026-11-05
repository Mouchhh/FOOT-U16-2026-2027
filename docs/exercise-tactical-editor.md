# Éditeur tactique d’exercices

Créer/modifier un exercice ouvre directement Terrain. L’exercice et ses consignes restent accessibles dans le premier onglet, les étapes de déplacement dans Animation.

La barre d’outils permet de sélectionner/déplacer, placer un joueur bleu/rouge ou un ballon au clic, tracer une passe ou une course par glisser, dessiner une zone rectangulaire et placer un texte saisi dans le panneau droit. La corbeille supprime l’objet sélectionné, ou le dernier tracé si aucun objet n’est sélectionné. Le clavier conserve ses déplacements et sa touche Suppr.

Les options Vue, Découpage et Revêtement sont enregistrées avec le schéma personnel. Les coordonnées restent communes aux vues complètes et recadrées. Les annotations sont partagées par les étapes de l’animation et incluses dans les aperçus et exports PNG/vidéo. Le contenu pédagogique et les exercices de référence ne sont pas modifiés.

Fichiers : exercise-tactical-editor.js/css, avec les contrats existants exercise-board.js et exercise-studio.js. Rouge d’action : #e41f28 ; fond : #0b192c.

Vérification : `python3 tests/exercise-tactical-editor-browser.py` et `python3 tests/exercise-board-browser.py`.
