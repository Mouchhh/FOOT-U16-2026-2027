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

## Carnet du coach

Le bouton « Parcourir les tactiques » ouvre 30 fiches réparties entre défendre, construire, attaquer, transitions et phases arrêtées. Recherche par mot-clé et filtre par catégorie. Le sélecteur de formation propose 21 systèmes.

« Appliquer le schéma » nécessite 11 titulaires et demande confirmation avant de remplacer positions, formation, flèches et consignes. Les identités, photos et remplaçants sont conservés. L’attaque va vers le haut du terrain. Les schémas sont des supports pédagogiques sans adversaires, à adapter au contexte et au niveau des joueurs ; ils ne simulent pas un match. Le gardien portant le numéro 1 est conservé au but ; à défaut, le dernier titulaire sert de gardien.

« Annuler la dernière tactique » restaure l’état précédent, y compris ses consignes. Cette annulation est disponible uniquement dans la session courante et remplace aussi les modifications faites depuis l’application. Enregistrer la compo permet de conserver durablement un plan. Les consignes sont incluses dans le PDF et l’export JSON.

Les fiches sont une synthèse pédagogique des principes usuels du football, pas un inventaire exhaustif ou une méthode officielle FIFA/UEFA. Les liens de ressources permettent d’approfondir.

Validation : les 21 formations ont chacune 11 positions valides ; les 30 plans ont été appliqués en navigateur avec vérification de la conservation des joueurs, de la validité de l’état et des flèches. Recherche, catégories, confirmation, annulation, rechargement, banc, mise en page PDF et mobile vérifiés.

## Adversaires et remplaçants sur la pelouse

« Adversaires » affiche ou masque 11 pions adverses. Le nom, la couleur et la formation adverse (21 systèmes) sont indépendants de votre équipe. Les adversaires attaquent vers le bas, votre équipe vers le haut. Leurs pions sont déplaçables à la souris, au doigt et avec les flèches du clavier ; « Replacer les adversaires » rétablit leur formation. Masquer l’adversaire conserve ses positions. Les tactiques du carnet modifient uniquement votre équipe.

Les remplaçants apparaissent directement sur le terrain avec un repère « R », une bordure distincte et leur photo éventuelle. Ils se placent initialement le long du côté droit et peuvent être déplacés librement. Leurs positions sont indépendantes des positions des titulaires. « Remplaçants » masque/affiche ces pions et le panneau de gestion. « Faire entrer » conserve 11 titulaires en échangeant le statut des deux joueurs. Les pions R restent des remplaçants tant que le changement n’est pas effectué.

La sauvegarde locale, les exports/imports JSON et les PDF reprennent les deux équipes et les remplaçants selon la visibilité choisie. Les anciens fichiers sans équipe adverse restent compatibles.

Validation : choix de formation adverse, déplacements souris/clavier des deux nouveaux types de pions, visibilité persistante, conservation dans les tactiques, changement, sauvegarde/export/import, rendu PDF et écran mobile vérifiés dans Chromium.
