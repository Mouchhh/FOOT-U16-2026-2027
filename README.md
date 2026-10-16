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
- Ajouter ou supprimer des joueurs, changer la couleur et écrire les consignes. Chaque fiche permet d’ajouter une photo et de choisir « Sur le terrain » ou « Impacteur / Finisseur ».
- Le bouton « Impacteurs / Finisseurs » affiche ou masque le banc sans supprimer ses joueurs. « Faire entrer » permet de choisir le titulaire qui sort ; le impacteur / finisseur prend sa position. Les changements de formation conservent les impacteurs / finisseurs sur le banc.
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

« Appliquer le schéma » nécessite 11 titulaires et demande confirmation avant de remplacer positions, formation, flèches et consignes. Les identités, photos et impacteurs / finisseurs sont conservés. L’attaque va vers le haut du terrain. Les schémas sont des supports pédagogiques sans adversaires, à adapter au contexte et au niveau des joueurs ; ils ne simulent pas un match. Le gardien portant le numéro 1 est conservé au but ; à défaut, le dernier titulaire sert de gardien.

« Annuler la dernière tactique » restaure l’état précédent, y compris ses consignes. Cette annulation est disponible uniquement dans la session courante et remplace aussi les modifications faites depuis l’application. Enregistrer la compo permet de conserver durablement un plan. Les consignes sont incluses dans le PDF et l’export JSON.

Les fiches sont une synthèse pédagogique des principes usuels du football, pas un inventaire exhaustif ou une méthode officielle FIFA/UEFA. Les liens de ressources permettent d’approfondir.

Validation : les 21 formations ont chacune 11 positions valides ; les 30 plans ont été appliqués en navigateur avec vérification de la conservation des joueurs, de la validité de l’état et des flèches. Recherche, catégories, confirmation, annulation, rechargement, banc, mise en page PDF et mobile vérifiés.

## Adversaires et impacteurs / finisseurs sur la pelouse

« Adversaires » affiche ou masque 11 pions adverses. Le nom, la couleur et la formation adverse (21 systèmes) sont indépendants de votre équipe. Les adversaires attaquent vers le bas, votre équipe vers le haut. Leurs pions sont déplaçables à la souris, au doigt et avec les flèches du clavier ; « Replacer les adversaires » rétablit leur formation. Masquer l’adversaire conserve ses positions. Les tactiques du carnet modifient uniquement votre équipe.

Les impacteurs / finisseurs apparaissent directement sur le terrain avec un repère « I/F », une bordure distincte et leur photo éventuelle. Ils se placent initialement le long du côté droit et peuvent être déplacés librement. Leurs positions sont indépendantes des positions des titulaires. « Impacteurs / Finisseurs » masque/affiche ces pions et le panneau de gestion. « Faire entrer » conserve 11 titulaires en échangeant le statut des deux joueurs. Les pions I/F restent des impacteurs / finisseurs tant que le changement n’est pas effectué.

La sauvegarde locale, les exports/imports JSON et les PDF reprennent les deux équipes et les impacteurs / finisseurs selon la visibilité choisie. Les anciens fichiers sans équipe adverse restent compatibles.

Validation : choix de formation adverse, déplacements souris/clavier des deux nouveaux types de pions, visibilité persistante, conservation dans les tactiques, changement, sauvegarde/export/import, rendu PDF et écran mobile vérifiés dans Chromium.

## Trois vues pour expliquer

- Composition & plan de jeu : effectif et outils complets.
- Vue épurée · mes joueurs : conserve les joueurs, photos, formations, flèches et boutons de visibilité. Cache les panneaux latéraux et le catalogue pour se concentrer sur le terrain. Les impacteurs / finisseurs restent sur le terrain si leur affichage est activé.
- Explication · pions : tableau indépendant avec pions anonymes et ballon déplaçables, ajout/retrait/nommage et bouton avec/sans adversaires. Quatre situations, chacune en trois étapes : pressing collectif, piège latéral, sortie courte, troisième homme. Changer d’étape recharge son schéma et demande confirmation. Ce tableau conserve sa propre sauvegarde locale, distincte des compositions ; il n’est pas inclus dans leur export JSON. Son bouton PDF imprime l’étape et le terrain visibles.

Les 30 fiches proposent désormais un déclencheur, une réussite observable, une progression de séance pour les U16 et une question au groupe. Les intentions hors phases arrêtées partent des pions réellement placés. Ces adaptations restent des supports pédagogiques, pas des simulations ni des prescriptions universelles.

### État des références

Les consultations directes des domaines officiels FIFA Training Centre, UEFA, IFAB et England Football ont été refusées par le proxy réseau (HTTP CONNECT 403) le 15 octobre 2026. Les domaines nécessaires ont été ajoutés au brouillon de configuration de l’environnement, sans preuve d’application à la machine. Les liens affichés sont des ressources pour approfondir : ils ne constituent pas des sources consultées ni une validation officielle de nos fiches. Une revue documentaire avec citations précises reste à effectuer après déblocage de l’accès. Ne pas présenter ces fiches comme vérifiées ou approuvées par ces organismes.

Validation : trois vues, quatre scénarios et leurs douze étapes, déplacement du ballon et des pions, nommage/ajout/retrait, opposition masquable, état séparé, 30 fiches enrichies, PDF A4 d’une page et affichage mobile vérifiés dans Chromium.

## Orientation du terrain

Le bouton « Terrain paysage » / « Terrain portrait » est disponible au-dessus des modes. Il pivote le jeu sans modifier les coordonnées enregistrées, maintient noms, portraits et numéros à l’endroit, et adapte les déplacements souris/tactiles et clavier. En paysage, votre équipe attaque vers la droite et les adversaires vers la gauche. La préférence est conservée dans le navigateur, indépendamment des exports JSON ; le PDF reprend l’orientation visible. Retour au portrait en un clic.

Validation : conservation des positions au basculement, déplacements souris et clavier dans les deux vues, adversaires, PDF, écran mobile sans débordement et préférence après rechargement vérifiés avec Chromium.

## Animations tactiques

Dans « Explication · pions », « Lire la séquence » anime les étapes depuis le tableau courant ; « Cette étape » joue uniquement l’intention sélectionnée. Pause/reprise, retour au départ et vitesses 0,5× / 1× / 2× sont disponibles. Les déplacements sont interpolés ; une passe déplace le ballon, pas le joueur. Les actions de déplacement d’une étape sont simultanées. Le choix « Trouver le 6 » / « Revenir au gardien » sélectionne une seule des alternatives de la dernière étape de sortie courte.

Les pions ajoutés restent présents ; les intentions prédéfinies concernent les pions du scénario. Retirer un pion retire son intention animée. La reprise manuelle d’un pion interrompt la lecture ; un changement de situation/étape repart d’un nouveau tableau. Changer d’onglet ou imprimer met en pause. Le PDF reste une image fixe de l’état visible ; pas d’export vidéo. La sauvegarde conserve les positions, pas un lecteur en cours. Cette première version anime les quatre situations pédagogiques du mode pions, pas les compositions avec photos ni les 30 fiches du catalogue.

Validation : quatre séquences complètes, déplacements effectifs des pions et du ballon, pause/reprise, retour au départ, alternatives de passes, lecture d’une étape, interruption manuelle, conservation de la composition et affichage paysage/mobile vérifiés dans Chromium.

## Exporter vers Canva

Dans « Explication · pions » :

- « Télécharger la vidéo » crée localement une vidéo Full HD 1920 × 1080, de l’étape visible à la fin du scénario, à la vitesse choisie. Utiliser « Revenir au départ » ou l’étape 1 pour exporter toute la séquence. Les positions, le choix de passe, l’orientation et la visibilité des adversaires sont repris.
- L’encodage utilise MediaRecorder : MP4 H.264 quand le navigateur le propose, puis MP4 ou WebM en repli. Un navigateur récent est recommandé. Aucun son ni serveur de conversion.
- Garder l’onglet visible pendant la création ; le masquage annule l’export. « Annuler l’export » interrompt sans modifier le tableau. La durée de création suit la durée de l’animation.
- « Image PNG » télécharge l’état visible en Full HD pour une diapositive fixe.
- Dans Canva, ouvrir la création, choisir « Importer » puis « Importer des fichiers », sélectionner le fichier téléchargé et le déposer sur la page. Le lien « Ouvrir Canva » ouvre simplement Canva : il ne transfère rien et ne requiert pas d’accès au compte.

L’export est une vidéo ou une image aplatie : les pions ne sont pas des objets individuellement modifiables dans Canva. Cette fonction concerne le mode pions ; l’export des compositions avec photos reste disponible en PDF.

Validation : PNG inspecté, MP4 H.264 1920 × 1080 décodé avec ffprobe/ffmpeg et comparaison de deux images distinctes, repli WebM, annulation, masquage d’onglet, conservation des données et affichage mobile vérifiés. L’import effectif dans un compte Canva n’a pas été exécuté.

## Composition propre pour Canva (photos et numéros)

Dans le panneau de droite, « Compo propre pour Canva » ouvre un aperçu indépendant de la page web. Le format par défaut est une présentation paysage 16:9, 2560 × 1440 pixels. Des formats A4 portrait et paysage restent disponibles.

- PNG HD : image nette avec noms, numéros, photos et logo incorporés. Importer le PNG dans Canva sur une présentation 16:9 et l’ajuster à la page.
- PDF propre : téléchargement direct d’une page contenant le rendu incorporé, sans fenêtre d’impression ni dépendance aux polices/CSS lors de l’import. Le PDF paysage Canva conserve le ratio 16:9 (960 × 540 points) ; les variantes A4 utilisent les dimensions A4.
- Les impacteurs / finisseurs sont regroupés dans une zone séparée ; ils n’encombrent pas le terrain de la composition. Adversaires et flèches sont masqués par défaut et activables dans l’aperçu. Les couloirs, panneaux et consignes ne figurent pas dans cet export de composition.
- Le choix de format pivote le terrain pour exploiter la page ; les positions et sauvegardes de l’application restent inchangées.
- Le PNG et le PDF sont aplatis : les pions ne sont pas modifiables séparément dans Canva. Modifier la compo dans l’application, puis exporter à nouveau si nécessaire. L’ancien PDF tactique via impression reste disponible pour les consignes.

Validation : téléchargement PNG 2560 × 1440 inspecté, PDF 16:9 une page décodé par Poppler, PDF A4 portrait et paysage, portraits/numéros, impacteurs/finisseurs, options et affichage mobile vérifiés dans Chromium. Aucun import dans un compte Canva n’a été exécuté.
