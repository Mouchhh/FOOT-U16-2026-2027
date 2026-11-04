# Effectif épuré et catégories

Les cartes, la fiche de statistiques et l’aperçu partagé de l’effectif n’affichent plus les numéros de maillot. Le champ de numéro est masqué dans l’éditeur d’effectif. Les valeurs historiques restent stockées pour les compositions et les numéros de match, sans être réécrites lors d’une modification de catégorie ou de disponibilité.

En haut de l’effectif, « Effectif de l’équipe » apparaît lorsque le coach possède plusieurs équipes. Il utilise la bascule existante avec sauvegarde préalable et contexte figé : aucune liste transversale ne mélange les joueurs, bilans ou agendas d’équipes différentes.

Chaque joueur peut avoir une `primaryCategory` (texte de 30 caractères maximum) et une `availability` facultative : Disponible, À confirmer ou Indisponible. Ces champs sont modifiables dans sa fiche. Les anciennes fiches sont compatibles : la catégorie de l’équipe sert de valeur d’affichage par défaut, sans migration destructive. Une catégorie principale différente de l’équipe d’accueil permet de décrire un joueur qui joue dans une catégorie supérieure ; elle ne transfère pas sa fiche entre les bibliothèques d’équipes. Lorsque plusieurs catégories principales existent dans le même effectif, un filtre dédié permet de les afficher séparément.

La carte conserve l’avatar/photo recadré, le nom, le poste, les métriques compactes et deux indications discrètes : catégorie principale et disponibilité. Sans disponibilité déclarée, le dernier pointage enregistré est affiché ; sans donnée, le statut reste « À renseigner ». Aucune forme physique n’est inventée à partir des statistiques. La fiche détaillée reprend les mêmes indications.

Les photos conservent `object-fit: cover` et des avatars circulaires ; les cartes blanches restent aérées et les badges de catégorie utilisent le rouge du club.

Tests Chromium : squad-categories-browser.py, squad-clean-browser.py, coach-squad-browser.py, report-effectif-sync-browser.py. Couverture : absence de numéros visibles, métadonnées, modification sans altération des anciens numéros, filtre, bascule entre équipes, conservation au rechargement, photos, publication simulée de l’effectif, statistiques et mobile.
