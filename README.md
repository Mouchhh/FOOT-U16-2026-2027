# Le Vestiaire

Tableau tactique de football, en français, utilisable sur ordinateur, tablette et mobile. Sans dépendance ni compte. Les données et photos restent dans le stockage du navigateur ; aucune photo n’est envoyée à un serveur.

## Démarrer

Depuis ce dépôt :

```sh
python3 -m http.server 3000 --bind 0.0.0.0
```

Ouvrir le site sur le port 3000. Aucun build nécessaire. Les polices Google sont facultatives, des polices système prennent le relais hors connexion.

## Utilisation

- Modifier un joueur depuis l’effectif ou par double-clic sur le terrain : prénom, numéro, photo. Les photos sont recadrées et compressées localement.
- Déplacer les joueurs à la souris, au doigt ou avec les flèches du clavier quand un joueur est sélectionné.
- Choisir une formation : 4-3-3, 4-4-2, 4-2-3-1, 3-5-2 ou 3-4-3. « Replacer » rétablit ses positions.
- Activer « Flèches », puis tracer sur le terrain pour illustrer les déplacements. La gomme efface toutes les flèches.
- Ajouter ou supprimer des joueurs, changer la couleur et écrire les consignes. Chaque fiche permet d’ajouter une photo et de choisir « Sur le terrain » ou « Remplaçant ».
- Le bouton « Remplaçants » affiche ou masque le banc sans supprimer ses joueurs. « Faire entrer » permet de choisir le titulaire qui sort ; le remplaçant prend sa position. Les changements de formation conservent les remplaçants sur le banc.
- « Sauvegarder en PDF » ouvre la fenêtre d’impression : choisir « Enregistrer au format PDF ». La mise en page A4 inclut les portraits, le logo, les flèches, les couloirs et le banc selon leur visibilité, ainsi que les consignes. Des consignes très longues ou un banc fourni peuvent occuper des pages supplémentaires.
- « Enregistrer la compo » ajoute une sauvegarde à « Mes compositions ». Cliquer sur une sauvegarde la recharge. Le travail courant est aussi conservé automatiquement.
- Exporter un JSON pour conserver ou partager une composition avec photos, positions, flèches et consignes. Importer ce JSON sur un autre appareil pour la modifier.

Les sauvegardes sont propres au navigateur et à l’adresse du site. Exporter les compositions avant d’effacer les données du navigateur. Pas de synchronisation entre appareils.

## Validation

```sh
node --check app.js
```

Les parcours fonctionnels ont été vérifiés avec Chromium : édition, formations, déplacement, flèches, photos, sauvegarde, rechargement, export/import et affichage mobile. Le banc, les remplacements, la persistance des portraits et de la visibilité, la compatibilité des anciennes compositions ainsi que la génération PDF A4 ont également été vérifiés.
