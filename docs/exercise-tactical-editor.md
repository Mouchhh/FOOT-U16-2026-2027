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

## Vue épurée et claire (240)

`exercise-clean-canvas.css` remplace le fond sombre par un fond clair et une palette blanche. La colonne droite, les onglets numérotés, l’exemple et le bouton de remise à zéro sont retirés de l’affichage. L’en-tête ne conserve que le titre et Lignes du terrain. Suivant ouvre directement la fiche pédagogique, dont le bouton Enregistrer conserve la validation existante. Les anciens contrôles sont conservés dans le DOM pour lire les données enregistrées sans migration destructrice.

Le terrain garde ses proportions et utilise toute la hauteur/largeur disponible. Bandes de pelouse plus nettes, maillots bleu/rouge/jaune, mini-buts orange et jalons violets sont dessinés en vectoriel dans la palette et sur le terrain. Les anciens schémas enregistrés ne sont pas effacés à l’ouverture.

Test dédié : `python3 tests/exercise-clean-canvas-browser.py` (1440×900, 1366×768 et 390×844, placement du matériel, lignes, Suivant et enregistrement).

## Icônes de matériel redessinées (241)

Les dessins partagés de `exercise-art.js` ont été repris : maillots lisibles, ballon sphérique ombré, buts à filets avec cadre contrasté sur fond blanc, cône rayé, coupelle profilée, jalon violet sur socle, mannequin, échelle et haie. La palette recadre automatiquement chaque dessin selon ses pixels visibles, pour éviter les grands espaces vides qui rendaient les anciens pictogrammes minuscules. Chaque bouton affiche un libellé court et conserve son nom accessible ainsi que le placement au clic/glisser-déposer. Le même dessin vectoriel est utilisé sur le terrain et dans les exports.
