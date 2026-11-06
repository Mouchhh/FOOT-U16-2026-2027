# Animations tactiques et bibliothèque Club

Tactique ouvre l’éditeur de pions sans exiger une composition de onze joueurs. Les nouvelles animations sont personnalisées, avec un nom libre obligatoire à l’enregistrement. Les catégories prédéfinies sont retirées de l’interface ; les séquences historiques et leur moteur restent intacts. Le titre et la sauvegarde sont placés directement au-dessus du terrain, tandis que l’ouverture des séquences existantes reste repliable.

Club → Animations présente la bibliothèque locale de l’équipe active et les animations renvoyées par la bibliothèque authentifiée du club. La sauvegarde réutilise les documents `pionExplanation`, le journal et la file de synchronisation existants : aucun nouveau stockage serveur ni droit supplémentaire. Hors connexion, l’enregistrement reste local/en attente de synchronisation. La liste du club est limitée aux documents déjà autorisés et chargés par le service existant.

Le coach peut ouvrir une animation personnelle, créer sa copie d’un document du club ou ajouter une animation à la causerie active. L’association conserve un instantané complet dans `causerieAnimations` (maximum 20), avec les étapes, pions, trajectoires, vitesse et choix de passe. La causerie doit ensuite être validée pour enregistrer cette association avec le match. La sélection est également disponible directement dans Causerie. Retirer une animation de la causerie ne supprime pas l’original.

Le modèle et l’export existants lisent ces instantanés. Ils sont restaurés lors de la réouverture d’une causerie, restent disponibles après rechargement et sont absents d’un nouveau match. La suppression de la causerie retire aussi ses associations, en conservant les animations de la bibliothèque. Les erreurs de stockage conservent la sélection précédente.

Vérifications : création personnalisée et titre libre, sauvegarde canonique, association/rechargement, nouveau match, export OOXML/GIF/MP4 et conservation des mouvements, réouverture de causerie et affichage mobile.

## Nouvelle animation et réinitialisation (290)

Le bouton « + Nouvelle animation » utilisait la conversion du tableau courant : les pions déplacés et renommés d'une autre séquence devenaient donc le nouveau départ. Il appelle désormais une création explicite avec `fresh: true` : positions standards des deux équipes à onze, ballon au départ, une étape vide, aucun titre ni identifiant de séquence précédente. Les sélections de bibliothèque, la vitesse, le choix de passe, la lecture en cours et les gestes de déplacement sont réinitialisés. Les positions et déplacements de l'ancienne séquence ne sont pas copiés.

Sur une séquence personnalisée, « Réinitialiser » appelait `loadSimple('custom')`, qui sélectionne une étape sans effacer ses actions. Après confirmation, le bouton recrée maintenant le même tableau de départ neuf. L'annulation conserve la saisie et la lecture ; la validation arrête la lecture, supprime les étapes du brouillon ouvert et lui retire l'identifiant sauvegardé. Les animations déjà enregistrées et les compositions restent intactes ; enregistrer le nouveau brouillon crée une animation indépendante.

L'outil « Flèches de déplacement » conserve son comportement de conversion volontaire d'un tableau existant, via `createCustomSequence()` sans option fresh. L'ajout d'étapes conserve aussi les positions issues des étapes précédentes, nécessaire au mouvement continu de la séquence.

`tests/tactical-animation-reset-browser.py` couvre un ancien dessin enregistré, la création indépendante, l'annulation et la confirmation du reset pendant la lecture, l'effacement des flèches et de la sélection, la validité et la sauvegarde d'une nouvelle animation sans écraser l'ancienne ou la composition. Les tests existants de séquence et de bibliothèque couvrent la conversion, les mouvements et la réutilisation.

Validation 290 : le test ciblé passe aussi la réouverture d'une animation enregistrée et la lecture de ses deux étapes après création/réinitialisation. Les anciens tests `custom-sequence-browser.py` et `tactical-animation-library-browser.py` s'arrêtent sur des contrôles masqués par les réorganisations précédentes (champ de nom déplacé au-dessus du terrain et ancien sélecteur de causerie) ; ils ne constituent pas une suite intégrale passée pour ce correctif. Le test ciblé utilise le parcours de bibliothèque actuellement visible.
