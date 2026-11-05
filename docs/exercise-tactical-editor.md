# Éditeur tactique d’exercices

Créer/modifier un exercice ouvre directement Terrain. L’exercice et ses consignes restent accessibles dans le premier onglet, les étapes de déplacement dans Animation.

La barre d’outils permet de sélectionner/déplacer, placer un joueur bleu/rouge ou un ballon au clic, tracer une passe ou une course par glisser, dessiner une zone rectangulaire et placer un texte saisi dans le panneau droit. La corbeille supprime l’objet sélectionné, ou le dernier tracé si aucun objet n’est sélectionné. Le clavier conserve ses déplacements et sa touche Suppr.

Les options Vue, Découpage et Revêtement sont enregistrées avec le schéma personnel. Les coordonnées restent communes aux vues complètes et recadrées. Les annotations sont partagées par les étapes de l’animation et incluses dans les aperçus et exports PNG/vidéo. Le contenu pédagogique et les exercices de référence ne sont pas modifiés.

Fichiers : exercise-tactical-editor.js/css, avec les contrats existants exercise-board.js et exercise-studio.js. Rouge d’action : #e41f28 ; fond : #0b192c.

Vérification : `python3 tests/exercise-tactical-editor-browser.py` et `python3 tests/exercise-board-browser.py`.

## Palette et cadrage (239)

Le matériel complet est accessible dans la colonne de gauche : buts mobiles, mini-buts, cônes, coupelles, piquets, mannequins, échelles, haies, cerceaux et gardiens. Sélectionner un outil puis cliquer sur le terrain, ou glisser son icône sur le terrain (souris). Les éléments ajoutés restent déplaçables et réglables avec les commandes existantes.

Le cadre de travail est fixe, sans défilement de la page ni déplacement du terrain. La taille du terrain s’adapte à l’espace réellement disponible via ResizeObserver. Seules les listes d’outils/réglages défilent en interne sur les petits écrans ; les champs pédagogiques restent consultables dans l’onglet L’exercice. Sur mobile, Options du terrain ouvre les réglages sans déplacer la surface de travail.

Suivant → reste en bas à droite : Terrain → Animation → L’exercice, où Enregistrer l’exercice conserve le circuit de validation existant.
