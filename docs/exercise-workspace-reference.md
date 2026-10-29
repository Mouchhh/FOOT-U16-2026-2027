# Atelier de création — référence vidéo

La vidéo transmise le 29 octobre 2026 montre un éditeur tactique : terrain central,
palette latérale, réglages et commandes d’animation. Cette première adaptation
porte sur l’atelier des exercices personnels, accessible depuis la création de séance.

- Ordinateur et portable : en-tête compact, commandes au-dessus du terrain portrait. Les menus superposés ne réduisent pas le terrain. Taille vérifiée de 1280 × 720 à 1920 × 1080 : le terrain occupe au moins 65 % de la hauteur, sans passer sous le bouton de validation.
- Tablette : commandes regroupées au-dessus du terrain.
- Téléphone : terrain sur toute la largeur disponible ; matériel et réglages dans des menus superposés.
- Les données, outils, étapes d’animation, exports et protections avant fermeture
  restent gérés par le moteur existant. Aucun contenu de séance n’est supprimé.

Validation : test `training-exercise-library-browser.py` réussi (dessin,
rotation, animation, sauvegarde, copie indépendante, rechargement et mobile).
Contrôle visuel et absence de débordement à 320, 390, 768 et 1366 px.
Le test `exercise-portrait-browser.py` vérifie la sélection et le déplacement
à la souris, les axes du clavier et la visibilité du terrain à 1366 × 768.
Le portrait est une vue de l’atelier : les coordonnées sauvegardées restent
compatibles avec les exercices existants et les exports conservent leur format.
Le test historique `manual-training-browser.py` bloque avant l’ouverture de
l’atelier : il cherche le champ durée dans une étape masquée du parcours.
Le même champ est masqué sans la nouvelle feuille de style ; ce test reste à
adapter au parcours actuel.
