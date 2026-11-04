# Pions anonymes et numéros par match

Après « Nouveau match », le terrain affiche les emplacements anonymes de la formation (4-3-3 par défaut). Un changement de formation recalcule leurs positions. Ces emplacements sont des éléments visuels sans nom, numéro ou photo ; ils ne sont pas enregistrés comme des joueurs et n’entrent pas dans les convocations, bilans ou statistiques.

Cliquer un emplacement ouvre le sélecteur existant de l’effectif, qui permet aussi de créer un joueur. La validation ajoute uniquement le joueur choisi, lié à sa fiche globale, à la position de l’emplacement. Choisir un joueur déjà sur le terrain le déplace sans le dupliquer. Les emplacements non affectés restent anonymes.

« Numéro pour ce match » peut être saisi avant de choisir le joueur. Sur un pion déjà affecté, « Enregistrer le numéro » permet de changer uniquement son numéro de match, de 1 à 99. Sa fiche dans Votre effectif reste inchangée. Le numéro persiste dans la composition au rechargement ; les changements de formation conservent les affectations existantes. Une nouvelle remise à zéro retire toutes ces affectations et affiche à nouveau les emplacements anonymes.

Tests : composition-empty-slots-browser.py, composition-player-picker-browser.py et match-new-browser.py. Vérifie les pions vides, les changements de système, la sélection au clic, le numéro local, le rechargement, la remise à zéro, l’ancien sélecteur et les petits écrans.
