# Photos du club et photos personnelles dans le PPT

Le bouton PPT ouvre des options intégrées à la page, avant le téléchargement. Chaque slide possède un choix « Sans photo », les douze photos du club déjà présentes dans les assets, ou les photos chargées par l’éducateur. La couverture et la conclusion reprennent par défaut les photos du club.

La présentation reste à onze slides. Les pages sombres utilisent une colonne photo à droite, avec une séparation rouge écusson ; les textes restent sur le marine. Les pages blanches utilisent un encart en haut à droite, avec une largeur de titre adaptée pour ne pas recouvrir le visuel. La palette marine, bleu roi, blanc et rouge #E41F28 reste appliquée.

Les fichiers personnels acceptés sont JPG, PNG et WebP (20 Mo maximum chacun, dix images par contexte d’export). Ils sont décodés et redimensionnés dans le navigateur, puis réencodés en JPEG. Le réencodage ne conserve pas les métadonnées EXIF. Les photos personnelles sont affichées entières dans le cadre, avec des marges marine si nécessaire ; les photos du club sont recadrées sans déformation. Un aperçu est visible dans chaque ligne de sélection.

Les réglages et photos personnelles restent en mémoire, isolés par éducateur, équipe et identifiant de match. Ils ne sont pas ajoutés aux causeries sauvegardées, à la bibliothèque ni à la file de synchronisation du club. Seules les images sélectionnées entrent dans le fichier demandé. Recharger la page efface les photos personnelles de la zone de préparation ; Nouveau match rétablit son propre contexte. La déconnexion vide cette mémoire.

Le point d’entrée public `causerieExport.downloadCurrent()` reste disponible pour le téléchargement programmatique. Le clic UI utilise d’abord `causerieExportPhotos.open()`. `causerieExport.capture()` ajoute la sélection à l’instantané d’export ; `causerieEleven.build()` résout les images et les place avant le texte. Les variantes natives et GIF conservent les onze slides et leur structure.

Vérifications : ouverture des options au clic, import d’une photo personnelle, choix de slide, présence réelle de l’image dans le fichier PPTX, couleurs et images par défaut, absence de modification du document source, isolation Nouveau match, interface mobile et conservation des trajectoires natives et de la variante GIF.
