# Causerie — texte visible dans Canva

Le champ canonique `matchPreparation.context` est maintenant visible dans un bloc « Contexte du match » de l’éditeur, sans nouvelle donnée ni migration de stockage.

L’export PowerPoint qui est ensuite envoyé à Canva affiche les consignes des quatre phases (défensive, offensive, perte et récupération), les textes des exercices sélectionnés, le contexte, sa dynamique et ses objectifs, les spécificités et les consignes tactiques. Les notes du présentateur restent disponibles, mais ne sont plus le seul emplacement de ces textes.

Le diaporama conserve ses **11 rubriques principales**, dans le même ordre. Si le texte ne tient pas dans sa zone à une taille lisible, des diapositives « suite » sont insérées immédiatement après la rubrique concernée. Aucun résumé à trois points ni troncature à 210/350 caractères n’est appliqué. Un texte court produit toujours 11 diapositives. Les cadres d’animations restent associés à leurs rubriques et aux mouvements natifs / GIF / MP4.

Les documents déjà créés dans Canva ne sont pas réécrits. Après actualisation du site, il faut ouvrir la causerie et créer une nouvelle présentation.

## Vérifications

- `tests/causerie-complete-content-browser.py` : saisie du contexte et des consignes par les champs réels, fichier de 11 slides pour les textes courts, textes longs complets sur les slides et leurs suites, ordre, source inchangée, création et envoi via le chemin réel de l’interface vers une passerelle simulée. Le fichier envoyé contient une vidéo MP4 et les textes visibles.
- `tests/causerie-clean-editor-browser.py` : saisie/persistance, validation, fermeture/réouverture et largeurs 1440/820/390/320.
- `tests/causerie-eleven-slides-browser.py` : deux animations sur une même phase, formats natif/GIF, identifiants de timing et références des animations, ordre des rubriques et mobile.
- Rendu du fichier court dans LibreOffice pour vérifier la composition d’une phase et la présence du texte à côté du schéma.

Les appels Canva de test sont simulés : pas de connexion ni import dans le compte réel de l’utilisateur pendant ces vérifications. L’import final et son rendu restent à confirmer dans son Canva après publication.
