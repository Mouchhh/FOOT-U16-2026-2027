# Export automatisé de causerie

## Parcours éducateur

1. **Engrenage → Préférences → Visuels de causerie** : déposer plusieurs fichiers JPG, PNG ou WebP. Le panneau utilise le gestionnaire de panneaux plein écran existant, avec fermeture dans l’en-tête et sans empilement de modales natives.
2. Laisser **Placement automatique**, ou préciser une fois l’usage d’un visuel (couverture, contexte, adversaire, phase tactique, CPA, conclusion…). L’usage est conservé après rechargement. Le premier fichier d’un usage est retenu ; pour changer ce choix, modifier l’usage ou retirer le premier fichier.
3. Dans **Match → Causerie → Présentation · 11 slides**, sélectionner les animations et exercices déjà enregistrés. Chaque phase dispose d’un filtre de type et d’une recherche par titre. Les brouillons d’exercices non enregistrés sont exclus.
4. Valider la causerie pour archiver les choix, puis **Télécharger en PPT (Animé)**. Aucune sélection d’image n’est demandée à l’export. Le raccourci « Gérer mes visuels » permet également de retrouver les préférences depuis la causerie.

## Composants

- `causerie-visual-library.js` remplace dans `index.html` l’ancien module `causerie-export-photos.js`. Celui-ci n’est plus chargé. Le nouvel adaptateur conserve l’API `causerieExportPhotos.capture/resolve`, commune aux exports PPT et Canva.
- `causerie-visual-library.css` : dépôt, aperçus, affectations et filtres ; couleur bleue pour les actions ordinaires, rouge pour suppression et fermeture.
- `causerie-club-situations.js` : sélection de créations enregistrées, validation des instantanés et rendu des exercices dans les slides existantes. Ajoute aussi la liste des exercices personnels aux contenus de Mon Club.
- `causerie-eleven-options.js` : recherche, filtre Animations/Exercices, association aux phases et retour de confirmation. Les animations restent dans `board.causerieSlideAnimations`, les exercices dans `board.causerieSlideExercises`.
- `causerie-eleven-slides.js` : injection des exercices dans les emplacements des slides 6 à 9. Le nombre total de diapositives reste strictement égal à 11.

## Règles de données

### Visuels

IndexedDB `stade-causerie-visuals`, object store `libraries`, clé composée de l’identifiant du compte connecté (ou `local`), du coach et de l’équipe active. Les fichiers sont **conservés dans ce navigateur**. Ils ne sont pas synchronisés avec Supabase ni disponibles automatiquement sur un autre ordinateur. Un véritable stockage partagé demanderait un bucket privé et ses politiques d’accès ; aucune configuration de stockage distante n’est présumée ici.

Un élément contient `{ id, name, data, role, personal: true }`. Les images sont redimensionnées à 1600 pixels maximum et conservées en PNG pour préserver les schémas et la transparence. Limites : 20 Mo par fichier source, 60 mégapixels, 30 visuels et 40 Mo de données encodées par bibliothèque. L’ajout d’un lot est atomique ; une erreur ne laisse pas de lot partiel. Les écritures de métadonnées relisent le stockage dans une transaction pour préserver les ajouts d’autres fenêtres.

Le placement commence par les usages explicites, puis distribue les images automatiques sur les places libres dans cet ordre : 1, 11, 3, 4, 5, 10, 2, 6, 7, 8, 9. Sans visuel personnel pour les slides 1 et 11, les photos du club restent utilisées. Les visuels personnels sont cadrés en mode `contain`, pour ne pas couper les schémas. Ce placement est déterministe ; aucune reconnaissance du contenu de l’image ni IA distante n’est prétendue.

Les bibliothèques restent conservées lors d’un nouveau match et d’une déconnexion, mais sont isolées par compte/coach/équipe. Un instantané d’export d’un ancien contexte est refusé. Un export attend la fin du lot d’import en cours avant de résoudre les images.

### Situations du club

Les animations proviennent de la bibliothèque enregistrée du coach et de ses documents accessibles dans Mon Club. Les exercices viennent de ses créations indépendantes, des séances enregistrées de l’équipe active et de ses propres documents de séance du club accessibles. Les références supprimées sont respectées ; les exercices source de référence ne sont pas réécrits ni intégrés comme nouvelles créations.

`board.causerieSlideExercises` contient les quatre clés `defensive`, `offDef`, `offensive`, `defOff`, chacune associée à une liste d’au maximum quatre instantanés `{ id, title, custom, label? }`. Le contenu technique complet est copié, sans adaptation ni reformulation. Une modification ou suppression ultérieure de la source ne change pas une causerie déjà liée. La copie est enregistrée avec le document et passe par les mécanismes existants de persistance, validation et archivage.

Un exercice à schéma fixe est exporté en PNG. Un exercice à plusieurs étapes est interpolé et exporté en GIF intégré, en conservant le matériel et les couleurs du schéma. Les animations tactiques existantes gardent leur mode trajectoires natives PowerPoint ou GIF selon le réglage. Un exercice sans schéma conserve ses textes sur la slide ; aucune illustration fictive n’est générée. Les consignes complètes sont présentes dans les notes de la slide.

Les quatre phases demeurent sur les slides 6 à 9 ; aucun ajout de slide. « Nouveau match » repart sans association d’exercice, et la suppression d’une causerie retire aussi ces associations. La bibliothèque de sources reste intacte.

## Contrôles

Avec le serveur local sur le port 3016 :

- `python3 tests/causerie-export-photos-browser.py` : dépôt depuis les préférences, usage sauvegardé, rechargement, séparation des équipes/comptes, export direct réel et images dans le PPTX, photos du club en secours, interface mobile.
- `python3 tests/causerie-club-situations-browser.py` : exclusions des brouillons, filtrage, instantané indépendant, GIF d’exercice et animation native dans un vrai PPTX, notes intactes, remise à zéro et mobile.
- `python3 tests/causerie-eleven-slides-browser.py` : onze slides ordonnées, choix multiples par phase, XML des trajectoires, variante GIF et absence de mutation des sources.
