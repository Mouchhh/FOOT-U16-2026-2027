# Étape 11 · Création libre

22 octobre 2026. Parcours logiciel vérifié dans Chromium, ordinateur et téléphone.

## Checklist

- [x] Atelier en trois vues : fiche, terrain, animation ; clavier des onglets et
  conservation du même dessin lors des changements de vue.
- [x] Palette des 14 types d’éléments avec représentation graphique, couleurs,
  numéros, taille, orientation et déplacement à la souris ou au clavier.
- [x] Angles rapides 0°, 90°, 120°, 180° et saisie libre ; propriétés conservées
  dans les étapes de l’exercice.
- [x] Images d’animation indépendantes, déplacements et flèches indicatives,
  lecture/arrêt et maintien des identités entre étapes.
- [x] Rotation interpolée par le trajet angulaire le plus court : 350° → 10° ne
  produit plus une rotation de 340°.
- [x] Schéma et animation enregistrés avec l’exercice et retrouvés après rechargement.
- [x] Accès « Mes exercices » depuis le déroulé : créations de la préparation ouverte
  et des séances enregistrées du coach, recherche insensible aux accents, source
  indiquée, doublons de contenu identique écartés.
- [x] Ajout à une autre séance par copie indépendante : nouvel identifiant de bloc,
  dessin/étapes/consignes/notes/durées conservés ; original inchangé après édition
  et renommage de la copie.
- [x] Confirmation avant fermeture d’une création modifiée non validée : refuser
  conserve l’atelier ouvert ; accepter conserve la dernière version enregistrée.
- [x] Échec du stockage lors de la copie : aucun bloc ajouté et message explicite.
  Refus d’ajout si le coach ou la séance a changé pendant la sélection.
- [x] Atelier et bibliothèque personnelle fermés à la déconnexion ; lecteur arrêté.
- [x] PNG et vidéo téléchargés dans Chromium ; aperçu, enregistrement, document
  imprimable et mise en page téléphone contrôlés.

## Où sont conservées les créations ?

Les exercices personnels sont contenus dans les séances. Enregistrer la séance
permet de les retrouver dans une autre préparation, et via le partage existant
sur un autre appareil pour le coach autorisé. Un exercice resté uniquement dans
le brouillon ouvert est identifié comme local ; cette livraison ne promet pas
une synchronisation des dessins non validés ni une nouvelle base autonome.

Une copie conserve le dessin du coach, elle ne réinterprète pas automatiquement
ses consignes pour un autre effectif. La vérification du groupe, des dimensions,
des rôles et des rotations reste explicite dans le message d’ajout et la relecture.

## Tests exécutés

```sh
node --check exercise-board.js
node --check exercise-studio.js
node --check training-exercise-library.js
python tests/training-exercise-library-browser.py
python tests/exercise-board-browser.py
python tests/training-builder-browser.py
python tests/bible-personal-diagrams-browser.py
python tests/club-network-browser.py
```

Le test dédié crée réellement un 5v5, ajoute une étape, déplace un pion, oriente
le matériel, enregistre puis réutilise dans une nouvelle séance. Il vérifie les
copies indépendantes, le refus et l’acceptation de l’abandon, le rechargement,
le stockage plein et la déconnexion. Les réponses Supabase sont simulées : aucun
compte réel n’est modifié. L’import Canva réel appartient à l’étape 16.

L’export vidéo dépend de MediaRecorder/captureStream ; le test a été exécuté dans
Chromium. Cela ne constitue pas une validation matérielle sur tous les iPhone.
Aucune migration Supabase, bibliothèque payante ou nouvelle dépendance ajoutée.
