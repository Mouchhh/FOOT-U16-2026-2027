# Animations tactiques et bibliothèque Club

Tactique ouvre l’éditeur de pions sans exiger une composition de onze joueurs. Les nouvelles animations sont personnalisées, avec un nom libre obligatoire à l’enregistrement. Les catégories prédéfinies sont retirées de l’interface ; les séquences historiques et leur moteur restent intacts. Le titre et la sauvegarde sont placés directement au-dessus du terrain, tandis que l’ouverture des séquences existantes reste repliable.

Club → Animations présente la bibliothèque locale de l’équipe active et les animations renvoyées par la bibliothèque authentifiée du club. La sauvegarde réutilise les documents `pionExplanation`, le journal et la file de synchronisation existants : aucun nouveau stockage serveur ni droit supplémentaire. Hors connexion, l’enregistrement reste local/en attente de synchronisation. La liste du club est limitée aux documents déjà autorisés et chargés par le service existant.

Le coach peut ouvrir une animation personnelle, créer sa copie d’un document du club ou ajouter une animation à la causerie active. L’association conserve un instantané complet dans `causerieAnimations` (maximum 20), avec les étapes, pions, trajectoires, vitesse et choix de passe. La causerie doit ensuite être validée pour enregistrer cette association avec le match. La sélection est également disponible directement dans Causerie. Retirer une animation de la causerie ne supprime pas l’original.

Le modèle et l’export existants lisent ces instantanés. Ils sont restaurés lors de la réouverture d’une causerie, restent disponibles après rechargement et sont absents d’un nouveau match. La suppression de la causerie retire aussi ses associations, en conservant les animations de la bibliothèque. Les erreurs de stockage conservent la sélection précédente.

Vérifications : création personnalisée et titre libre, sauvegarde canonique, association/rechargement, nouveau match, export OOXML/GIF/MP4 et conservation des mouvements, réouverture de causerie et affichage mobile.
