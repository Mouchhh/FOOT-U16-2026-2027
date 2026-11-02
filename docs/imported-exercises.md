# Affichage du fichier fourni

À la demande du coach, les contenus et scripts du fichier « Exos foot.html » sont conservés intégralement. Les seules différences dans `imported-exercises-view.html` sont les liens vers la feuille CSS et le module de classement visuel. Le test retire ces liens puis compare l’empreinte SHA-256 avec le fichier initial : toute autre modification, notamment aux données ou aux scripts, provoque un échec.

La feuille CSS indépendante et commentée reprend les couleurs du site (#142d50 / #2855a2 / blanc), ses polices système, bordures et boutons. Elle organise la fiche sur deux colonnes sur ordinateur et sur une colonne avec défilement du document sur mobile. Les couleurs des rôles dans les schémas et la logique des animations restent celles du fichier.

L’onglet Exercices a retrouvé ses cartes, sa recherche, ses filtres par thème et sous-partie, sa pagination et ses fiches ouvrables. Il montre les 28 exercices fournis (7 Banide, 11 Toro et 10 Opposition), avec les couleurs convenues. Chaque fiche conserve les données et les fonctions de son document d’origine. `imported-exercises-classification.js` organise uniquement l’index en cinq thèmes et sous-parties, en lisant `FICHE_MOMENTS` et les propriétés `moment` / `sub` des exercices. Les douze sous-parties convenues restent visibles même vides ; Ludique garde « Version simple ». Chaque exercice est affiché une seule fois. Ce module ne modifie ni les données, ni les fonctions de la fiche, ni l’animation. Les cartes affichent un aperçu du schéma de référence, les métadonnées du fichier et les actions de consultation et d’ajout. Les onglets Séances et les outils personnels restent disponibles autour du document.

Le fichier source reste disponible et inchangé hors des liens de présentation. `supplied-exercise-engine.js` isole ses fonctions d’origine, sans les réécrire et sans l’appel de remplacement de page. `supplied-exercise-base.css` reprend sa feuille initiale. Les fiches sont rendues dans un Shadow DOM avec le thème du club ; les commandes Adapter, Coaching et animation restent celles du fichier.

L’ajout crée une copie dans la séance avec la durée originale et tous les textes, une répartition calculée par le moteur fourni pour les paramètres de la séance et un instantané animé compatible avec l’éditeur existant. Le bouton Adapter de la fiche est un simulateur indépendant ; le bandeau d’ajout précise les paramètres réellement utilisés. Une alerte du moteur est présentée avant ajout et un échec de stockage conserve la séance antérieure. Les copies précédemment enregistrées dans les séances restent lisibles. Les propositions automatiques des anciens exercices restent retirées.

Validation : `python tests/imported-exercises-browser.py` vérifie l’empreinte du fichier, la copie exacte des fonctions fournies, les cartes, les cinq filtres, la sous-partie, la recherche, la pagination, la fiche, la lecture de l’animation, Coaching, Adapter, l’ajout et son rechargement, et l’absence de débordement à 390 et 320 pixels.

Code de classement demandé : possession en bleu (#2855a2), perte en orange (#b45309), récupération en vert (#247342), sans ballon en rouge (#b92635). Le CSS identifie les moments par leur palette native ; les scripts du fichier restent inchangés. Les textes des moments restent visibles en complément de la couleur.

« Ludique » utilise le jaune (#f2c94c), avec des intitulés bleu foncé (#142d50) et des accents ocre (#856400) pour la lisibilité.


## Ajout des Toro

Le fichier « Exos foot - Toro.html » ajoute 11 variantes aux 7 Banide. Aucun Banide n’est supprimé. `imported-toro-view.html` garde le fichier reçu à l’identique, hormis un lien CSS de présentation. Empreinte du fichier initial : `6b6166161cf45260eab4a7b6b94307c5315cfce8b3a552004244151775920c17`.

`supplied-toro-engine.js` contient les fonctions exactes du fichier sans l’appel automatique qui remplacerait toute la page. `supplied-toro-base.css` contient sa feuille de style initiale. Le registre `supplied-exercise-registry.js` dirige chaque fiche, adaptation et schéma vers le moteur de son propre fichier. Il ne réécrit aucune règle, disposition, animation ni méthode de calcul. La feuille de thème et les cinq couleurs existantes s’appliquent ensuite dans le Shadow DOM, comme pour les Banide.

Les Toro rejoignent les thèmes et sous-parties à partir de leurs propriétés originales `moment` et `sub`. La recherche inclut le nom de famille : « Toro » retrouve aussi « Double 3 contre 1 », sans changer son titre. Les identifiants des 11 Toro sont acceptés par le validateur des exercices sauvegardés, tout en conservant les identifiants Banide.

`tests/toro-exercises-browser.py` vérifie l’intégrité du fichier, des fonctions et du CSS initial, les 11 variantes, la conservation des données, l’identité des schémas calculés pour 8, 16 et 22 joueurs (hors UUID générés), les commandes de fiche et animation, l’ajout des 11 variantes, leur rechargement et la présentation mobile. Le test Banide reste exécuté avec les nouveaux comptes du catalogue commun.


## Ajout des Oppositions

Le fichier « Exos foot - Opposition.html » ajoute 10 fiches. `imported-opposition-view.html` conserve le fichier reçu, avec le seul lien de présentation supplémentaire. Empreinte SHA-256 du fichier initial : `a6b5adaf1e8c25b274c90e09e34508e2509a940f716f6d1b5b23be27ffadff02`.

`supplied-opposition-engine.js` contient les fonctions et données originales, sans l’appel automatique de remplacement de page. `supplied-opposition-base.css` reprend le CSS initial à l’identique. Le registre utilise ce moteur pour les schémas, adaptations et fiches d’opposition ; les moteurs Banide et Toro restent inchangés.

Le thème existant s’applique sans ajouter de couleur : possession `#2855a2`, perte `#b45309`, récupération `#247342`, sans ballon `#b92635`, Ludique `#f2c94c` avec les accents ocre et les textes bleu foncé déjà définis. Les couleurs des rôles et les données techniques à l’intérieur des schémas restent celles du fichier fourni.

`tests/opposition-exercises-browser.py` vérifie le fichier et ses fonctions/CSS exacts, les 10 variantes, les schémas calculés pour 8/16/22 joueurs, les cinq bandes de couleur, les commandes de fiche, Coaching, Adapter, la lecture de l’animation, l’ajout des 10 fiches et leur rechargement, puis la mise en page à 390 et 320 px. Les tests Banide et Toro vérifient également la conservation des fonctions précédentes dans le catalogue commun de 28 fiches.
