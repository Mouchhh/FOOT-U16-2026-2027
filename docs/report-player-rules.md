# Bilan : présences, adversaire et contrôle disciplinaire

Le pointage intégré au bilan permet de sélectionner un créneau existant, même non pointé, ou de créer une séance passée de la saison du bilan avec sa date, son heure et son nom. Les séances à la même date et à la même heure sont reprises plutôt que dupliquées. Chaque réponse présent/absent/à confirmer est enregistrée immédiatement par défaut via le même service de pointage que l’agenda ; les fiches sont recalculées après réussite. Les réponses à confirmer n’ajoutent aucune absence. Le mode manuel avec confirmation groupée reste disponible en décochant « Enregistrement immédiat ». Les conflits et erreurs conservent les réponses à l’écran.

Les événements « But contre » et « Carton adverse » n’exposent pas la sélection de vos joueurs et ne contribuent pas à leurs statistiques. Le bouton « + Fait adverse » accélère leur saisie. La précision textuelle est rangée dans un détail replié. Les anciennes données restent lisibles ; le nouveau type de carton est accepté par le modèle du bilan et ses exports.

Un événement « But pour » doit désigner un joueur présent dans l’effectif avant tout enregistrement ou validation. Le message apparaît dans le formulaire sans fenêtre supplémentaire. Le passeur reste facultatif. Un brouillon peut encore contenir un but en cours de saisie ; les rapports historiques non attribués restent lisibles. Un but adverse ne demande pas de joueur de notre effectif. Le score n’est pas modifié automatiquement.

Les minutes directement saisies sont associées à l’identifiant stable du joueur et cumulées à la validation, comme auparavant. Les corrections d’un bilan remplacent sa contribution plutôt que l’ajouter une nouvelle fois.

## Série de cartons retenue

L’alerte porte sur les **jaunes**, les rouges conservant leur indicateur distinct. Elle est calculée depuis les bilans de match enregistrés, datés, de l’équipe et de la saison sélectionnées, après dédoublonnage. Les séances, dates futures et autres équipes sont exclues.

Une série commence au premier jaune et compte ce match comme le premier des dix. Elle avance à chaque bilan où le joueur figure, sauf « Non entré » ou zéro minute sans jaune. Trois jaunes dans cette série déclenchent une alerte rouge sur la carte et la fiche détaillée. La série expire avant le onzième match éligible ; un nouveau jaune démarre alors la suivante. Les rencontres absentes de la base ne sont pas inventées. L’alerte indique une suspension potentielle à vérifier, sans prononcer une suspension administrative.

Le contenu du bilan reprend une hauteur naturelle, avec l’espace réservé à la barre d’actions hors du flux : le dernier pointage reste accessible et la barre demeure fixée au-dessus de la navigation mobile.

Tests Chromium : report-player-rules-browser.py, report-attendance-inline-browser.py, report-events-browser.py, report-effectif-sync-browser.py, report-causerie-import-browser.py, document-completion-browser.py. Vérifie le pointage sans agenda préparé, la correction immédiate, les buts non attribués, les cartons adverses, les minutes, les bornes du dixième/onzième match et les petits écrans. Safari/macOS reste non vérifié dans cet environnement.
