# Exercices fournis par le coach

Source : fichier « Exos foot.html » joint le 30 octobre 2026. Il contient sept variantes du jeu Banide, et non une bibliothèque de plusieurs familles. Les consignes, objectifs, coaching, posture, attendus, variantes et attribution du fichier sont conservés. Les références bibliographiques restent celles du fichier, sans certification indépendante.

`imported-exercises-engine.js` isole le moteur et les données du fichier dans une fonction. Aucun appel au remplacement de la page d’origine n’est exécuté. Le rendu d’origine est contenu dans un Shadow DOM, avec une feuille locale et les bandeaux bleu et blanc ; aucune police ou dépendance distante n’est nécessaire.

La Bible affiche uniquement ces sept fiches et les classe selon les intentions et sous-parties du club. Les anciens exercices restent uniquement lisibles dans les documents déjà enregistrés. Les anciennes propositions automatiques ne sont pas réactivées : les nouvelles fiches s’ajoutent après lecture et validation du coach.

Le formulaire prend l’effectif de la séance, propose des groupes et permet une répartition inégale des joueurs et gardiens. Les sommes doivent correspondre à la séance, avec deux joueurs de champ minimum par groupe. Chaque groupe a une fiche et un schéma adaptés par le moteur fourni. Les minima, le manque de gardiens et l’espace insuffisant produisent des avertissements ; la validation de l’éducateur reste nécessaire. Les distances sont des propositions, et ne garantissent pas la pertinence d’une situation hors de ses effectifs prévus.

L’ajout crée un bloc personnel indépendant : tous les textes, la répartition et un instantané animé compatible avec l’éditeur existant sont sauvegardés dans la séance. L’instantané reprend les positions et déplacements ; les terrains et flèches sont rendus par l’éditeur du site. Les fichiers du club et la fiche terrain utilisent ce même bloc. Si un éducateur reprend une copie importée intacte, le formulaire recalcule la fiche pour son effectif. Une modification libre de son contenu enlève le lien à la fiche importée et conserve le fonctionnement habituel des exercices personnels.

Vérifications : `python tests/imported-exercises-browser.py` (147 adaptations, sept ajouts et rechargement, filtres, groupes inégaux, reprise à 14 joueurs, rollback du stockage plein, mobile) et `python tests/training-sections-browser.py` (création et réutilisation personnelles existantes).
