# Affichage du fichier fourni

À la demande du coach, `imported-exercises-view.html` est une copie **octet pour octet** du fichier « Exos foot.html ». Le test conserve son empreinte SHA-256. Aucune modification de présentation, de données, de couleurs, de police, de commande d’adaptation ou d’animation n’est appliquée au fichier.

L’onglet Exercices affiche ce document dans un iframe. Le rangement et les sept fiches sont ceux du document d’origine. Les anciennes cartes et filtres du site sont masqués dans cet espace. Les onglets Séances et les outils personnels restent disponibles autour du document.

Le fichier n’est pas modifié pour y ajouter des boutons de création de séance : il propose ses commandes d’origine. Les copies précédemment enregistrées dans les séances restent lisibles. Les propositions automatiques des anciens exercices restent retirées.

Validation : `python tests/imported-exercises-browser.py` vérifie l’empreinte du fichier, les sept liens, la fiche native, Coaching, Adapter, le retour au rangement et l’absence de débordement à 390 et 320 pixels.
