# Affichage du fichier fourni

À la demande du coach, les contenus et scripts du fichier « Exos foot.html » sont conservés intégralement. La seule différence dans `imported-exercises-view.html` est un lien vers `imported-exercises-theme.css`. Le test retire ce lien puis compare l’empreinte SHA-256 avec le fichier initial : toute autre modification, notamment aux données ou aux scripts, provoque un échec.

La feuille CSS indépendante et commentée reprend les couleurs du site (#142d50 / #2855a2 / blanc), ses polices système, bordures et boutons. Elle organise la fiche sur deux colonnes sur ordinateur et sur une colonne avec défilement du document sur mobile. Les couleurs des rôles dans les schémas et la logique des animations restent celles du fichier.

L’onglet Exercices affiche ce document dans un iframe. Le rangement et les sept fiches sont ceux du document d’origine. Les anciennes cartes et filtres du site sont masqués dans cet espace. Les onglets Séances et les outils personnels restent disponibles autour du document.

Le fichier n’est pas modifié pour y ajouter des boutons de création de séance : il propose ses commandes d’origine. Les copies précédemment enregistrées dans les séances restent lisibles. Les propositions automatiques des anciens exercices restent retirées.

Validation : `python tests/imported-exercises-browser.py` vérifie l’empreinte du fichier, les sept liens, la fiche, la lecture de l’animation, Coaching, Adapter, le retour au rangement et l’absence de débordement à 390 et 320 pixels.

Code de classement demandé : possession en bleu (#2855a2), perte en orange (#b45309), récupération en vert (#247342), sans ballon en rouge (#b92635). Le CSS identifie les moments par leur palette native ; les scripts du fichier restent inchangés. Les textes des moments restent visibles en complément de la couleur.

« Ludique » utilise le violet (#7041a6), distinct des quatre moments de jeu.
