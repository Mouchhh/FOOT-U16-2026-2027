# Atelier de création — référence vidéo

La vidéo transmise le 29 octobre 2026 montre un éditeur tactique : terrain central,
palette latérale, réglages et commandes d’animation. Cette première adaptation
porte sur l’atelier des exercices personnels, accessible depuis la création de séance.

- Ordinateur : fenêtre agrandie, matériel à gauche, terrain central et réglages à droite.
- Tablette : réglages sous le terrain pour conserver sa largeur.
- Téléphone : palette horizontale, terrain et réglages empilés, commandes tactiles.
- Les données, outils, étapes d’animation, exports et protections avant fermeture
  restent gérés par le moteur existant. Aucun contenu de séance n’est supprimé.

Validation : test `training-exercise-library-browser.py` réussi (dessin,
rotation, animation, sauvegarde, copie indépendante, rechargement et mobile).
Contrôle visuel et absence de débordement à 320, 390, 768 et 1366 px.
Le test historique `manual-training-browser.py` bloque avant l’ouverture de
l’atelier : il cherche le champ durée dans une étape masquée du parcours.
Le même champ est masqué sans la nouvelle feuille de style ; ce test reste à
adapter au parcours actuel.
