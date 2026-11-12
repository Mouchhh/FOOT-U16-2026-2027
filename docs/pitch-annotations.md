# Zones colorées et lignes de passe

Match → Tactique, dans **Placement tactique** et dans **Animations** : on peut tracer des **zones transparentes de couleur** (rectangle ou rond) pour signaler un espace, et des **lignes de passe** (pointillés avec flèche).

## Utilisation

- Placement tactique : outil « ▭ Zones & passes » à côté de « ↗ Flèches ».
- Animations : encadré « Zones & lignes de passe » sous les outils de séquence ; « ✕ Fermer les zones » ou « Déplacer les pions » / « Flèches de déplacement » reviennent au travail des pions.
- Choisir « ▭ Zone », « ◯ Zone ronde » ou « ⇢ Ligne de passe », une couleur (rouge, jaune, bleu, vert, blanc), puis glisser sur le terrain. « ⌫ Gomme » : toucher un élément pour le retirer. « Tout effacer » demande confirmation.
- Un tracé qui commence sur un pion ne déplace pas le pion et ne crée pas de flèche de déplacement.

## Données

- `pitch-annotations.js` : modèle commun `annotations = { zones, passes }` (coordonnées 0–100, palette fermée, 40 zones et 60 passes maximum), validation `pitchAnnotationsValid`, rendu SVG, rendu canvas pour les exports, test de clic géométrique (les calques de dessin ignorent les clics).
- Placement tactique : `state.annotations` facultatif, validé par `valid()`, enregistré avec la composition / le plan de jeu, inclus dans l’historique Annuler/Rétablir quand il est disponible, et dans l’export image avec l’option « Flèches tactiques » (cochée dès qu’il y a des flèches, des zones ou des passes).
- Animations : `simpleState.annotations` facultatif et commun à toutes les étapes. `pitch-annotations-ui.js` garde les annotations courantes à part et les réattache à chaque rendu et à chaque enregistrement : changement d’étape, conversion en séquence personnalisée, lecture / « Revenir au départ » et enregistrement dans la bibliothèque les conservent. « + Nouvelle animation » repart vide ; ouvrir une animation enregistrée reprend ses propres zones.
- Anciens documents sans annotations : inchangés et valides.

## Limites

Les exports PPT / GIF des animations dans la causerie ne dessinent pas encore les zones et passes (suivi).

## Vérification

`tests/pitch-annotations-browser.py`.
