# Tactique : page compacte et « Ouvrir en grand »

Match → Tactique (Placement tactique et Animations).

## Page compacte
- **Placement tactique** : le terrain du plan de jeu et le bouton « ⛶ Ouvrir en grand pour modifier ». Les blocs propres à la composition (causeries enregistrées, « Nouveau match ») ne sont plus affichés ici. Le terrain prend la hauteur disponible : la page tient sans défilement sur un écran d’ordinateur (`fit()` dans `tactic-fullscreen.js`, terrain lisible d’au moins 260 px de haut sur les très petits écrans).
- **Animations** : nom / bibliothèque des animations, « ⛶ Ouvrir en grand pour modifier », « ▶ Lire la séquence », « ↓ PDF » et le terrain. Les outils d’édition (pions, flèches, étapes, zones et passes, lecture détaillée) sont dans l’éditeur en grand.
- L’onglet **Composition** n’est pas modifié (même terrain, outils toujours visibles).

## Éditeur en grand
- Plein écran avec barre en haut : titre, zoom (100 %, 150 %, 200 % ; on fait défiler pour se déplacer), « ✓ Fermer » (ou Échap).
- Outils à gauche (colonne qui défile), terrain à droite à la hauteur de la fenêtre. Sur téléphone : terrain en haut, outils en dessous.
- Les éléments restent les mêmes (aucune donnée copiée) : tout ce qui est fait en grand est enregistré comme d’habitude.

## Zones et lignes de passe
Uniquement dans l’onglet **Animations** (retirées du Placement tactique et de l’export image de la composition). Les anciennes compositions qui en contiennent restent valides.

## Vérification
`tests/tactic-fullscreen-browser.py`.
