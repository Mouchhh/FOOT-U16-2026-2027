# Causerie : éditeur épuré

`causerie-clean-editor.js` et `causerie-clean-editor.css` sont chargés après les modules de causerie existants. Ils réorganisent les contrôles d’origine sans créer de second formulaire ni modifier le modèle de sauvegarde.

- En-tête : **Télécharger en PPT**, **Valider**, **Fermer la causerie**, avec le raccourci discret **Mon Canva** qui conserve le gestionnaire d’export Canva existant.
- Les raccourcis « Gérer mes visuels », « Démonstrations », le panneau de vérification et le bloc « Après le match » sont retirés de cette vue. Les visuels restent accessibles depuis Engrenage → Préférences.
- Les barres globales d’enregistrement et de navigation/export en doublon sont masquées uniquement lorsque la causerie est active.
- Deux repères courts : date et match. Un champ « Information adversaire ».
- Grille à deux colonnes : Animation Défensive, Animation Offensive, Transition OFF/DEF, Transition DEF/OFF, CPA Défensif, CPA Offensif. Le Mot d’ordre final occupe toute la largeur. Une colonne sur mobile.
- Chaque phase possède un sélecteur « Choisir dans Mon Club », dépliable à la demande. Le résumé affiche le nombre de contenus sélectionnés. Recherche, filtres et cases d’origine sont conservés.

Les anciens champs redondants sont placés dans un conteneur caché, afin de conserver leurs valeurs et les fonctions historiques qui utilisent leurs identifiants. Les causeries enregistrées ne perdent aucune information. Les champs tactiques restent directement reliés aux données utilisées dans le PowerPoint.

`causerie-eleven-options.js` émet `causerie:options-rendered` après chaque actualisation. L’éditeur réintègre les nouvelles listes dans la bonne phase et conserve leur état déplié, sans dupliquer les contrôles.

Couleurs locales : marine `#0b192c`, blanc et rouge `#e31b23`. Actions courantes en bleu ; rouge réservé aux actions importantes existantes.

Vérifications : `tests/causerie-clean-editor-browser.py`, `tests/causerie-club-situations-browser.py`, `tests/causerie-eleven-slides-browser.py`, `tests/causerie-export-photos-browser.py`. Serveur local port 3016, Chromium. Contrôles de saisie, conservation des anciennes données, validation réelle, fermeture, export PPTX animé, import des visuels et largeurs 320 à 1440 px.
