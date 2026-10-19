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

Les sauvegardes sont propres au navigateur et à l’adresse du site. Exporter les compositions avant d’effacer les données du navigateur. Sans activation de l’espace privé du club, pas de synchronisation entre appareils.

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

- Composition & plans de jeu : effectif, photos, numéros et placement.
- Vue épurée · mes joueurs : brouillon indépendant initialisé avec les 11 titulaires de la composition, mêmes numéros et mêmes positions. Flèches, adversaires (formation et placement libre), déplacements et consignes restent propres au plan. Revenir à Composition conserve son état. « Reprendre mes 11 depuis la composition » recopie explicitement les titulaires et leur formation sans effacer les adversaires ni les flèches du plan. Les schémas du carnet s’appliquent à la vue active. Les deux documents se sauvegardent séparément dans la bibliothèque et l’espace privé, et sont inclus dans la sauvegarde complète du coach.
  Elle conserve les photos et les numéros, tout en masquant les panneaux latéraux pour se concentrer sur les 11 titulaires.
- Explication · pions : tableau indépendant avec pions anonymes et ballon déplaçables, ajout/retrait/nommage et bouton avec/sans adversaires. Un tableau libre 11 contre 11, avec les numéros 1 à 11 dans chaque équipe, et quatre situations animées, chacune en trois étapes : pressing collectif, piège latéral, sortie courte, troisième homme. Changer d’étape recharge son schéma et demande confirmation. Ce tableau conserve sa propre sauvegarde locale, distincte des compositions ; il n’est pas inclus dans leur export JSON. Son bouton PDF imprime l’étape et le terrain visibles.

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

## Après-match · rapports

L’espace « Après-match · rapports » complète le terrain sans modifier la composition. Six rubriques reprennent et étendent le document de référence fourni par le coach :

1. Le match : équipe, adversaire, compétition, journée, date/heure, lieu, staff, organisation, durée, scores final et à la pause, buteurs et contexte. Le résultat est calculé à partir du score final ; aucun résultat n’est déduit si le score manque.
2. Suivi sportif : projet de jeu, animations défensive/offensive et état physique global, évalués sur 5 par demi-point avec observations. Tops et axes de progrès offensifs/défensifs, périodes, jeu avec/sans ballon, transitions et CPA.
3. Suivi humain : cohésion, attitude/investissement et gestion émotionnelle, focus individuel et récit du staff.
4. Joueurs & faits : import explicite des joueurs de la composition sans doublons, ajout manuel, statut, minutes jouées, note, observation et objectif individuel. Faits marquants avec minute/type/détail, triés chronologiquement dans la synthèse. Ces faits ne modifient pas automatiquement le score.
5. Plan d’action : priorité de la semaine, trois séances, critères de réussite, responsables, date de suivi et message au groupe.
6. Synthèse : aperçu complet prêt à imprimer.

La durée des nouveaux rapports reprend celle renseignée dans le profil d’équipe ; elle reste à saisir si le profil ne la précise pas. « Non évalué » ne signifie pas zéro. Aucune note ni donnée du match d’exemple n’est préremplie.

Le brouillon est conservé automatiquement dans le navigateur après modification. « Enregistrer le rapport » ajoute ou met à jour sa version dans « Mes rapports ». Ouvrir ou importer un autre rapport demande confirmation avant de remplacer le brouillon. Export/import JSON permet le transfert entre appareils. Un export PDF complet est disponible via impression et « Enregistrer au format PDF ». Les textes longs peuvent occuper plusieurs pages. Le PDF n’inclut pas l’interface du terrain.

Les observations restent dans le stockage du navigateur et ne sont pas envoyées à GitHub. Leur partage dans l’espace privé Supabase nécessite une activation et une connexion explicites. Exporter les rapports avant de vider les données du navigateur. Le PDF source de référence reste en dehors du dépôt ; il n’est pas publié.

Validation Chromium : six rubriques, résultat automatique, notes 3,5/5, observations sportives/humaines, import d’effectif sans doublons, temps de jeu, fait de match, plan, bibliothèque, rechargement, import/export JSON, PDF complet de plusieurs pages (texte extrait et première page inspectée), conservation de la composition et affichage mobile. Aucun accès à un service externe requis.

## Toutes les catégories grand terrain du Stade Mayennais

Le panneau « Mon équipe » est commun au terrain et à l’après-match. Catégorie libre (suggestions U14 à U20, Seniors, Vétérans, Loisirs), section masculine/féminine/mixte, groupe ou équipe (A, B, D1, R1…), nom personnalisé et durée habituelle sont configurables. Les suggestions ne déclarent pas l’existence de ces équipes au club et ne déterminent pas l’éligibilité ou les règlements d’une compétition.

La durée n’est pas imposée selon l’âge : le coach renseigne une durée entre 1 et 180 minutes conformément à sa compétition. Un nouveau rapport reprend catégorie, nom, organisation et durée du profil. Les rapports enregistrés gardent leurs informations historiques. La première ouverture d’un rapport vierge reprend aussi le profil choisi.

Le nom s’adapte automatiquement à la catégorie/section/groupe tant qu’il n’a pas été personnalisé. Le profil est inclus dans les compositions sauvegardées et exports JSON, et la catégorie figure dans l’en-tête et les exports. Les anciens fichiers sans ces champs restent acceptés ; une ancienne composition nommée U16 conserve son identité. Les nouveaux effectifs de démonstration utilisent « Joueur 1 », etc., et aucune catégorie n’est imposée à la première utilisation.

Changer le profil ne remplace pas les joueurs et ne modifie pas un ancien rapport. Pour retrouver plusieurs effectifs sur le même navigateur, enregistrer leurs compositions avec des noms distincts puis charger la composition souhaitée. Les profils ne constituent pas des comptes partagés : chaque coach utilise le même site avec son propre stockage local, et les transferts entre appareils passent par les exports/imports.

Les intitulés de séance ne sont plus limités aux U16 ; les propositions restent à adapter au niveau réel du groupe. Validation : seniors féminine B, catégorie de regroupement libre, nom personnalisé, durée validée, persistance, nouveaux rapports et rapports historiques, compatibilité U16, composition/export Canva et écran mobile testés dans Chromium.

## Séances de la semaine

L’espace se situe entre « Terrain & tactique » et « Après-match · rapports ». Il prépare des séances pour les équipes à 11 du club avec date (jour déterminé par le calendrier), horaire, durée de 30 à 150 minutes, 4 à 32 présents gardiens inclus, 0 à 4 gardiens en conservant au moins deux joueurs de champ, âge repère de 12 à 65 ans, compétences observées, contexte de pratique et espace disponible. Ces bornes sont celles de l’outil, pas des règles fédérales.

La bibliothèque comprend 24 fiches éditoriales du club : activation, technique, conservation, relance, pressing, défense, transitions, largeur, finition, duels, démarquage, CPA, gardiens et réinvestissement. Chaque fiche décrit objectif, méthode (exercice/situation/jeu), matériel proposé, organisation, consignes, points d’observation, réussite, simplification et progression. Les suggestions sont des bases de travail à valider par le coach ; elles ne sont pas des programmes individualisés de préparation physique.

Choisir un à trois thèmes puis « Proposer une séance complète » construit activation, ateliers, jeu de réinvestissement et retour au calme dont les durées totalisent exactement l’objectif. Les ateliers peuvent être ajoutés depuis la bibliothèque, retirés, réordonnés, minutés et annotés. Après une modification manuelle, un écart au temps prévu est signalé sans supprimer de contenu.

La répartition équilibre les ateliers en affectant exactement tous les présents, sans compter les gardiens deux fois. Les effectifs impairs utilisent un appui neutre selon le jeu ; les rôles et rotations sont explicités. Les surfaces tiennent compte de l’effectif par atelier, de l’âge, du niveau et de l’emprise disponible. En cas de surface contrainte, un message demande au coach de valider la densité et d’adapter le jeu. Sans gardien, des portes/mini-buts remplacent les buts gardés ; les contenus spécifiques de gardien ne sont pas supposés réalisables avec un spécialiste absent. Le contexte District/Régional/National est consigné ; il ne détermine pas automatiquement les compétences individuelles.

La vue semaine liste les séances enregistrées de la semaine de la date sélectionnée. La bibliothèque permet ouverture, duplication et suppression avec conservation du brouillon. Brouillon automatique, sauvegarde locale, export/import JSON et fiche PDF complète sont disponibles. Les blocs incluent les séries et récupérations dans leur durée, à organiser sur place. Le PDF est une fiche de terrain de plusieurs pages et comprend les consignes adaptées.

« Reprendre la priorité du rapport ouvert » copie la priorité et les axes de progrès vers l’objectif de séance, sans réécrire le rapport. Certains exercices disposent d’une illustration du principe dans les animations (pressing, piège latéral, relance, troisième homme) : une confirmation protège le tableau de pions existant et la séance reste conservée. L’illustration ne reproduit pas nécessairement tous les participants de l’atelier.

### Références FFF : vérification en attente

Le BMF, le BEF et le DES sont des diplômes d’entraîneur ; les exercices ne leur sont pas attribués ni classés selon eux. Le 16 octobre 2026, les accès HTTPS à https://maformation.fff.fr/ et https://www.fff.fr/ ont été refusés par le proxy (CONNECT 403), y compris après demande d’accès réseau. Les domaines ont été ajoutés au brouillon de configuration en préservant les autres domaines. Un enregistrement/publication des paramètres d’environnement et une nouvelle consultation restent nécessaires. Aucun texte officiel n’a pu être lu : les liens affichés sont des références à consulter, pas des citations vérifiées. Une revue et un rattachement à des ressources pédagogiques FFF précises restent à effectuer avant toute présentation comme contenus reconnus ou issus de ces formations.

Validation Chromium : 61 344 combinaisons d’effectif/gardiens/âge/niveau/espace/exercice vérifiées pour une répartition exacte ; 24 fiches, dates et horaires, durées totales exactes 30/45/60/90/120/150 min, effectif impair, matériel et rotations, ajout/retrait, notes, bibliothèque et vue semaine, import/export, lien avec le rapport, illustration animée avec séance conservée, PDF complet (extraction de texte et inspection visuelle), navigation et mobile. Le PDF source privé fourni pour les rapports reste en dehors du dépôt. Les données de séance ne sont pas envoyées à GitHub.

## Schémas des exercices

Les 24 fiches incluent désormais un croquis vectoriel avec joueurs numérotés, gardiens G, appuis, coupelles, cibles et intentions. Traits pleins : déplacements ; pointillés : passes ou frappes. Les zones à occuper sont mises en évidence selon le principe de l’exercice.

Le menu « Atelier illustré » permet de choisir un groupe de la répartition calculée : le schéma reprend son nombre exact de joueurs et de gardiens, ses dimensions et les rotations prévues. Les gardiens des jeux de conservation et circuits restent inclus dans les rôles au pied. Les dessins ne sont pas à l’échelle et représentent un principe, pas une séquence imposée ou une homologation fédérale.

Dans le PDF, les variantes différentes d’effectif, de gardiens ou de surface sont affichées une seule fois chacune ; les ateliers identiques ne sont pas dupliqués. Les consignes et la liste complète des ateliers accompagnent ces schémas.

Validation : les 24 fiches, 1 658 variantes d’ateliers vérifiées pour des effectifs de 4/5/11/17/23/32 joueurs et différents nombres de gardiens, comptes exacts des pions et gardiens, sélection de l’atelier, variantes PDF, SVG avec titre accessible et affichage mobile. Placement du gardien unique adapté aux finitions/relances et acteurs défensifs sur corner contrôlés.

## Profils des coachs et agenda nominatif

Le bandeau « Coach actif » permet de créer un profil avec prénom/nom, de le renommer et de passer d’un espace à l’autre. Compositions, profil d’équipe, rapports, séances, brouillons, tableau de pions et préférence d’orientation sont enregistrés sous des clés distinctes pour chaque coach. Changer de coach conserve les brouillons valides avant de recharger son espace. Les champs invalides ou un échec de stockage empêchent le changement afin d’éviter une perte silencieuse.

Les données précédentes restent accessibles dans « Coach principal · données existantes », profil renommable. Ce profil utilise les clés de stockage historiques ; aucune migration ni suppression des anciennes sauvegardes n’est effectuée. La clé du coach est figée pour toute la durée de la page : un événement pagehide de l’ancien coach ne peut pas écrire dans le nouvel espace.

« Agenda du coach » affiche son nom, les nombres de documents enregistrés, les séances classées par jour et horaire, un filtre mensuel et « Toutes les dates ». Cliquer sur une séance la rouvre dans l’espace de préparation. Seules les séances enregistrées dans la bibliothèque figurent dans l’agenda ; les brouillons ne créent pas d’événement.

« Sauvegarde du coach » télécharge un JSON regroupant les documents et les brouillons de son espace. « Restaurer un coach » vérifie le contenu puis crée un nouveau profil avec un identifiant neuf, sans écraser les profils existants. Les noms homonymes de restauration sont distingués. Le transfert entre ordinateurs se fait par ce fichier. Les nouvelles fiches de séance et les nouveaux rapports reprennent le nom du coach ; les rapports historiques gardent les informations qu’ils contenaient.

Ces espaces sont nominatifs, pas des comptes avec mot de passe. Toute personne utilisant le même navigateur peut sélectionner un profil. Ces profils locaux n’assurent pas la confidentialité entre utilisateurs du même appareil. L’espace privé optionnel ajoute une authentification pour les documents partagés entre appareils ; les documents locaux ne sont pas envoyés à GitHub. Conserver les sauvegardes exportées avant de nettoyer les données du site.

Validation Chromium : profil historique, renommage, création de deux coachs, absence de mélange des compositions/rapports/séances, changements et rechargements, agendas distincts avec dates/horaires, ouverture des séances, export d’un coach et restauration dans un profil neuf, affichage mobile ; aucune erreur JavaScript.

## Noms personnalisés et sauvegardes dans l’espace du coach

Les compositions, rapports et séances disposent chacun d’un titre libre (100 caractères maximum). Les titres sont distincts du nom de l’équipe et du nom du coach. Ils apparaissent dans les bibliothèques, l’agenda, les documents et les noms de fichiers exportés.

- Composition : champ « Nom de la composition », sauvegarde dans l’espace du coach actif. Enregistrer met à jour le même document grâce à un identifiant ; « Enregistrer une copie » crée un autre identifiant. Le bouton « Renommer » d’une composition enregistrée permet de modifier son titre sans charger une autre composition ni modifier les autres sauvegardes. Les anciennes compositions sans identifiant sont identifiées lors de leur chargement.
- Rapport : titre libre, bouton « Renommer », enregistrement qui met à jour le rapport courant et « Enregistrer une copie » qui conserve l’original.
- Séance : titre libre, bouton « Renommer » et duplication dans un nouveau brouillon, à enregistrer ensuite. Les dates et horaires restent séparés du titre.

Les boutons de renommage précisent le coach destinataire. L’espace du coach comprend aussi des accès directs aux compositions, rapports et séances. Les fichiers anciens sans titre restent compatibles et utilisent leur libellé précédent. Les sauvegardes globales d’un coach conservent les nouveaux titres et identifiants.

Validation Chromium : titres des trois types, renommage, mise à jour sans doublon, copies distinctes, noms de fichiers, agenda, rechargement, passage à un autre coach sans accès aux sauvegardes du précédent, anciens documents et mobile. Le transfert complet d’un espace local utilise l’export/restauration du coach ; les documents choisis peuvent aussi être partagés dans l’espace privé après son activation.

## Assistant ChatGPT manuel et extension sans clé API

La rubrique de séance « Préparer avec ChatGPT · sans clé API » prépare un prompt avec les paramètres du groupe, le catalogue de fiches et un référentiel paginé du projet sportif. Le coach copie la demande dans ChatGPT, envoie lui-même le message, puis rapporte la réponse JSON. L’application n’automatise aucune connexion ni utilisation du compte ChatGPT et ne consomme pas d’API.

Le contrôle de réponse vérifie les identifiants d’exercices, le total exact des minutes, les bornes, l’activation et le retour au calme, ainsi que les ids/pages cités dans le référentiel. Il ne valide pas automatiquement la justesse pédagogique ou l’interprétation du document : le coach doit relire le contenu. Un aperçu précède l’application et une confirmation protège le déroulé actuel. Modifier les paramètres du groupe après préparation empêche l’application d’une proposition devenue obsolète. Le brouillon et les schémas utilisent les mécanismes de séance existants.

Le référentiel commun est stocké localement hors des espaces individuels des coachs. Il est importé depuis un fichier privé ou fourni par l’extension remise au club. La synthèse du PDF « Projet sportif saison 26-27 » comprend 23 sections avec numéros de page et empreinte du document source, sans organigramme ni listes de personnes. Les règles seniors et horaires du PDF ne sont pas imposés aux jeunes. Le PDF et la synthèse réelle ne sont pas inclus dans le dépôt public ni dans le fichier HTML téléchargeable. La préparation d’un prompt ne réentraîne pas le modèle.

Les sources génériques de l’extension Manifest V3 sont dans browser-extension/. Le paquet privé remis au coach comprend en plus club-project.json, exclu du suivi Git. Installation manuelle dans Chrome/Edge en mode développeur, via « Charger l’extension non empaquetée ». L’extension nécessite activeTab, scripting et clipboardWrite, pas de permission sur ChatGPT. Elle vérifie le site actif, obtient la demande depuis la passerelle du site, puis copie et ouvre ChatGPT sur clic explicite. Elle ne soumet aucun message. Les limites et conditions du compte ChatGPT restent applicables ; aucune gratuité illimitée d’un fournisseur n’est garantie.

Le résumé du projet et l’objectif libre sont transmis à ChatGPT seulement si le coach les colle puis les envoie. Aucun effectif nominatif, photo ou rapport individuel n’est ajouté automatiquement. Relire l’objectif libre avant de le partager. Les propositions reprises portent leurs références et restent des documents du coach.

Validation : import du référentiel réel, prompt avec contexte et pages, absence de requête OpenAI/ChatGPT automatique, rejet des mauvaises citations, contrôle de durée et du groupe, import et sauvegarde de proposition, passerelle du site et interface d’extension simulée en navigateur, affichage mobile. Aucune installation réelle de l’extension dans le navigateur du coach ni conversation sur son compte ChatGPT n’a été exécutée. Le prototype de serveur API non publié a été retiré, la version livrée n’en dépend pas.


## Assistant de séance intégré et gratuit

Dans les séances, renseigner le groupe, la date et la durée, choisir une priorité puis « Proposer ma séance ». La date du prochain match est facultative ; à J0–J2, la proposition privilégie la qualité technique et les récupérations. Relire l’aperçu, demander une autre proposition si besoin puis « Utiliser cette proposition ». Ajuster et enregistrer dans l’espace du coach.

Chaque exercice proposé dispose d’un schéma adapté aux ateliers calculés, des consignes et de ses variantes. Ces schémas restent disponibles dans le déroulé sauvegardé et le PDF. Les propositions respectent la durée totale, avec activation et retour au calme.

Cet assistant utilise des règles et les fiches de la bibliothèque : ce n’est pas un modèle conversationnel entraîné ni une validation fédérale. Il fonctionne dans le navigateur sans clé API, serveur IA, compte ou extension et sans appel réseau pour produire une proposition après chargement du site. Le coach reste responsable de l’adaptation et de la charge réelle.

Un référentiel privé JSON peut être importé en option pour afficher les renvois paginés au projet sportif ; il reste dans ce navigateur et est partagé entre ses profils de coachs. Le document privé n’est pas publié. L’échange manuel avec ChatGPT reste accessible sous « Option avancée ». Les sauvegardes et leur transfert entre appareils utilisent les exports existants.

Validation Chromium : 936 combinaisons de thèmes, durées, effectifs et niveaux, présence d’un schéma pour tous les exercices, fonctionnement avec réseau bloqué, aperçu et variante, application, sauvegarde et rechargement, adaptation au match proche, import privé et pages citées, export PDF avec schémas, mobile et absence d’erreurs JavaScript.


## Site privé des éducateurs et synchronisation

Le site configuré ouvre une page d’accueil distincte, `accueil.html`, avec « Se connecter » et « S’inscrire ». Les formulaires d’accès gardent le site complet fermé jusqu’à la validation du compte par Supabase. Après connexion, l’éducateur utilise le site complet : terrain, tactiques, animations, séances, agenda, rapports et exports. Le prénom et le nom saisis à l’inscription sont validés côté serveur puis enregistrés dans le profil. « Coach actif » affiche cette identité, liée à l’identifiant authentifié ; le sélecteur est verrouillé sur son propre compte. Les comptes existants gardent leur nom enregistré. Après connexion, la rubrique « Travail du club » présente les profils des éducateurs et leurs documents, avec filtres par auteur et type ; les autres outils du site restent accessibles. La version locale sans données du club reste accessible explicitement via `?mode=local`.

Dans le site privé, **Enregistrer synchronise automatiquement** la séance, composition ou le rapport. Les brouillons restent personnels sur l’appareil. Les données existant uniquement dans l’ancien espace local peuvent être importées en choisissant son ancien profil et en confirmant le partage. Elles ne sont pas envoyées silencieusement lors de la première connexion. Les originaux locaux sont conservés. Aucun référentiel privé, export global ou document fourni dans la conversation n’est ajouté au dépôt public.

Le travail du club est actualisé toutes les dix secondes lorsque l’onglet est visible, et au retour sur la page ou à la reconnexion réseau. Chaque compte récupère automatiquement sa bibliothèque sur un autre ordinateur. Les mises à jour distantes ne remplacent pas un brouillon ouvert. Un collègue peut consulter les schémas et créer une copie indépendante ; seul l’auteur modifie ou supprime son original. Une suppression enregistrée par l’auteur est aussi synchronisée.

Les tâches de synchronisation restent sur l’appareil en cas de coupure et sont réessayées automatiquement. Les conflits conservent la version en ligne et les changements locaux ; ouvrir son document depuis « Travail du club » permet de récupérer la dernière version en conservant les différences du brouillon dans une copie locale. Les copies de sauvegarde restent locales tant qu’elles ne sont pas enregistrées pour synchronisation. Ce fonctionnement ne constitue pas une collaboration à plusieurs à chaque frappe ni une sauvegarde historique.

### Installation et migration des comptes

1. Installer [supabase/club.sql](supabase/club.sql) pour les tables et droits, si ce n’est pas déjà fait.
2. Exécuter [supabase/club-accounts.sql](supabase/club-accounts.sql) pour les inscriptions par invitation. Les comptes autorisés précédemment restent utilisables et leurs documents sont conservés.
3. Après installation des contrôles, activer les inscriptions dans les paramètres Authentication. Pour éviter la dépendance au service SMTP, la confirmation par e-mail peut être désactivée : l’accès initial est alors protégé par un code d’invitation individuel à usage unique, associé à l’adresse préautorisée et transmis par le responsable. Si la confirmation reste activée, configurer un service e-mail adapté et attendre sa confirmation.
4. Le responsable autorise une nouvelle adresse dans SQL Editor avec `select * from public.club_authorize_educator('adresse@exemple.fr','Prénom Nom');`. Il transmet individuellement le code retourné à l’éducateur. Celui-ci utilise « Créer mon compte » sur le site avec son adresse, son code et le mot de passe de son choix.

Les contrôles s’appliquent côté serveur : une adresse non autorisée ou un code absent/incorrect/consommé refuse la création, même avec un client modifié. Le prénom et le nom du formulaire servent uniquement à l’identité du profil, avec validation de leur longueur côté serveur ; ils ne donnent aucun rôle ou autorisation. Le nom approuvé de l’invitation reste le repli pour les anciens clients sans ces champs. Le code n’est stocké qu’en empreinte dans la liste privée et disparaît des métadonnées du compte. Les éducateurs ne peuvent ni lire les invitations ni en créer. Les identifiants PostgreSQL, clés secrètes et codes d’invitation ne doivent jamais être ajoutés au site public. [Guide complet](supabase/INSTALLATION.md).

Les URL et clés publiques du projet sont dans `club-cloud-config.js`. Les comptes et documents sont protégés par les règles PostgreSQL, indépendamment de l’affichage de la page. Les mots de passe ne sont pas enregistrés dans les sauvegardes du navigateur. La session reste dans l’onglet ; la déconnexion ferme l’accès à tout l’espace du club. Les caches/brouillons locaux peuvent rester sur l’appareil, à réserver aux appareils de confiance. Les sauvegardes du projet et exports de coach restent nécessaires.

### Validation

- PostgreSQL 17 temporaire : droits des visiteurs, membres, externes et révoqués, propriété des documents, écritures directes interdites, versions concurrentes, réinstallation sans perte et installation partielle.
- `tests/club-accounts-access.sql` : migration réexécutée, adresse autorisée avec code à usage unique, refus d’usurpation par la seule adresse, validation des noms de profil côté serveur, code retiré des métadonnées, invitations privées et retrait d’accès.
- Chromium avec Supabase simulé : accueil distinct, connexion/inscription, prénom/nom et coach actif, site complet privé, séparation de deux comptes sur le même navigateur, enregistrement et rafraîchissement entre ordinateurs, récupération automatique de sa bibliothèque, trois types de documents, schémas et copies, conflits préservant les brouillons, reprise après coupure, sessions, inscription invitée, révocation et mobile.

L’accès au vrai projet Supabase depuis cet environnement est bloqué par le proxy. L’installation de la migration dans le projet du club, ses paramètres Authentication et un essai avec deux vrais comptes restent à effectuer avant de confirmer son activation complète. Le plan gratuit peut convenir au démarrage dans ses quotas ; la disponibilité et les conditions du fournisseur restent à vérifier.


### Noms et présence des éducateurs

Un bandeau visible dans toutes les rubriques affiche les éducateurs connectés récemment ; cliquer sur un nom ouvre son profil dans « Travail du club ». Installer [supabase/club-presence.sql](supabase/club-presence.sql) après le schéma de base pour activer les pastilles vertes. Sans cette migration, le bandeau affiche honnêtement les noms des éducateurs autorisés et indique que leur statut attend son activation.

La présence est authentifiée et horodatée par le serveur, actualisée toutes les dix secondes dans un onglet actif. Elle expire après 90 secondes sans signal ; une fermeture brutale peut donc rester visible environ deux minutes avec le délai de rafraîchissement. Chaque page a sa propre session de présence : se déconnecter d’un appareil ne déconnecte pas un autre appareil du même coach. Les noms sont regroupés par compte, sans doublon entre appareils. Un départ est signalé au mieux à la déconnexion ou à la fermeture. Aucune adresse e-mail, IP ou liste de sessions n’est exposée. Les entrées anciennes sont nettoyées après un jour.

`tests/club-presence-access.sql` contrôle dans PostgreSQL les sessions multiples, doublons, départs et expiration, ainsi que les refus d’accès anonymes/non membres/révoqués et les tentatives d’écriture directe d’un horodatage ou d’une identité. Le test navigateur vérifie l’affichage de plusieurs noms, la disparition d’une présence expirée et le repli sans faux indicateur en ligne lorsque la migration manque.


## Outils tactiques séparés et explication à 11 contre 11

Le terrain de composition possède trois onglets d’outils : **Déplacements**, **Flèches**, **Adversaires**. Chaque onglet affiche ses commandes (replacer les joueurs ; tracer/effacer ; afficher/configurer la formation adverse). Le choix des onglets est accessible au clavier avec les flèches, Début et Fin. Les options de couloirs et impacteurs/finisseurs restent dans la barre de réglages.

Dans **Explication · pions**, le bouton **11 contre 11** charge un tableau indépendant : 11 bleus et 11 adversaires, chacun numéroté de 1 à 11, avec gardien n° 1. Le placement initial est un 4-3-3 dans chaque moitié de terrain. Chaque pion et le ballon restent déplaçables ; les adversaires sont masquables et les pions ajoutés prennent un numéro libre. Le chargement demande confirmation et ne remplace pas la composition du coach. Les positions sont conservées dans le brouillon local du coach. Les nouveaux espaces commencent sur ce tableau ; les situations déjà sauvegardées restent compatibles.

Ce tableau libre s’exporte en PNG ou PDF. Les quatre scénarios animés restent disponibles dans « Situation » ; leurs commandes d’animation et de vidéo réapparaissent lorsqu’un scénario est choisi. Elles sont masquées pour le tableau libre, qui ne prétend pas posséder une animation prédéfinie.

Validation : `python3 tests/tactical-tools-browser.py http://127.0.0.1:3016` vérifie les onglets, les adversaires, le dessin/effacement, le clavier, les 22 numéros, les déplacements et la visibilité, l’ajout/retrait, la sauvegarde, le paysage et le mobile, les exports PNG/PDF et une animation existante, sans modification de la composition.

### Séquences nommées dans Explication · pions

Saisir un nom puis « Enregistrer la séquence ». La bibliothèque par coach permet d’ouvrir, modifier, renommer (changer le nom puis enregistrer), copier et supprimer les séquences. Les pions, leur placement, le ballon, la visibilité adverse, la situation et son étape sont conservés. Pour une animation déjà lue, la sauvegarde reprend son départ avec vitesse et choix de dernière passe, afin de la relire. Ces séquences restent locales à l’appareil et sont incluses dans la sauvegarde complète du coach ; elles ne sont pas synchronisées dans Travail du club.

### Créer une séquence avec les flèches des pions

Dans Explication · pions, « Flèches de déplacement » crée une séquence personnalisée depuis les pions et le ballon présents. Glisser depuis un pion (bleu ou adverse) vers sa destination trace sa course ; glisser depuis le ballon trace sa passe. Chaque pion et le ballon peuvent avoir une destination par étape. « Étape suivante » reprend les positions d’arrivée pour préparer la suite (12 étapes maximum). Les boutons numérotés permettent de revenir modifier une étape ; les étapes suivantes repartent des positions recalculées. « Déplacer les pions » revient au départ pour ajuster le placement initial. Lecture, pause, retour au départ, vitesse, sauvegarde nommée, PNG/PDF et export vidéo fonctionnent aussi pour ces séquences. Les flèches du clavier permettent de régler une destination dans le mode flèches.

## Accueil privé des éducateurs

Après connexion autorisée, l’application ouvre l’accueil : logo du Stade Mayennais (extrait du projet sportif fourni), cinq cartes de rubriques, compteurs des documents du coach, et annuaire des éducateurs. Le bouton Accueil ou le logo ramène à cette page. Les outils existants et leurs sauvegardes restent accessibles par le bandeau.

L’annuaire conserve les éducateurs autorisés hors ligne. Une LED verte signale une activité serveur dans les 90 dernières secondes ; le rafraîchissement suit la synchronisation habituelle. La dernière connexion provient de `auth.users.last_sign_in_at`, via une fonction sécurisée qui ne renvoie ni adresse e-mail ni autre donnée d’authentification.

**Activation des dernières connexions :** réexécuter la version à jour de `supabase/club-presence.sql` dans Supabase → SQL Editor → Run. Le script est réexécutable et conserve les documents. Sans cette mise à jour, l’accueil fonctionne et les LED utilisent le service de présence déjà installé ; les dates restent « Non disponible », sans inventer d’historique. Aucun SQL n’a été exécuté sur le projet réel depuis cet environnement.

Le compte Instagram public `@stademayennais` et le site du club ont été refusés par le proxy réseau (CONNECT 403). Les photos ont ensuite été fournies dans « smfc 6.pdf » : la sélection du fond défilant utilise désormais les photos ouvertes en grand dans les quatre PDF transmis. Les photos sont hébergées par le site, sans chargement Instagram.

Validation : parcours navigateur avec Supabase simulé (accueil après connexion, navigation, sous-rubriques, LED/dernière connexion, migration absente, comptes isolés, accès révoqué, mobile) et tests d’autorisation sur PostgreSQL temporaire.

### Photos en fond de l’accueil

Le diaporama est prêt dans `home-slideshow.js` : fondu toutes les six secondes, photos précédente/suivante et pause, arrêt hors de l’accueil ou lorsque l’onglet est masqué. Le défilement démarre en pause si la réduction des animations est activée. Un voile bleu et des panneaux blancs gardent les textes lisibles.

Les photos doivent être fournies et placées dans `assets/photos/`, puis référencées dans `assets/home-slides.js` (12 maximum). Seules les images du site réellement chargées sont affichées ; les images absentes sont ignorées. Les quatre photos intégrées correspondent aux publications ouvertes en grand dans « smfc 2.pdf », « smfc 3.pdf », « smfc.pdf » et « smfc 6.pdf ». Elles ont été extraites sans modification et sont servies directement par le site. Les fichiers HTML Instagram renvoient à des dossiers d’images non joints ; leur contenu et les données du compte ne sont pas publiés.

Le fond défilant est activé avec les quatre photographies sélectionnées par le club, sans dépendance à Instagram. Les fichiers PDF et HTML sources restent hors du dépôt public.

### Navigation épurée et animations

La ligne de sous-rubriques sous le menu principal est supprimée. Chaque rubrique conserve ses outils internes. Les pages apparaissent avec un fondu et un léger glissement de 280 ms ; les menus, onglets et cartes ont un retour visuel au survol et au clic. Les changements restent immédiats, les animations précédentes sont annulées en cas de clics rapides et la préférence de réduction des animations est respectée.

### Enregistrements sans export JSON

Les boutons de téléchargement/restauration JSON des compositions, séances, rapports et espaces coach sont retirés. Les bibliothèques, brouillons automatiques et synchronisations Supabase sont conservés ; aucune donnée enregistrée n’est supprimée. Les exports PDF, image et vidéo restent disponibles. Le format JSON interne de stockage et les échanges de l’assistant ne sont pas modifiés.

### Composition PDF : uniquement le terrain

Les exports de composition affichent uniquement le terrain, les joueurs (photos, noms et numéros), et les options choisies : adversaires, flèches, impacteurs/finisseurs placés sur la pelouse. Le titre, le logo extérieur, les marges, le pied de page et le banc latéral sont retirés. Les formats 16:9, A4 portrait et paysage restent disponibles. Le bouton PDF de la composition ouvre désormais cet export autonome d’une page, sans passer par l’impression du site. Les PDF des séances et rapports ne changent pas.

### Préparation du match dans Composition & plans de jeu

Le champ de consignes libres est remplacé par un tableau inspiré de la photo fournie : date, type de rencontre, affiche, contexte, adversaire, quatre idées fortes, animation défensive, animation offensive et spécificités/CPA. « Préparer mon match » ouvre le formulaire ; les modifications restent en brouillon avec la composition. « Enregistrer avec la composition » utilise sa bibliothèque et sa synchronisation habituelles. Les collègues retrouvent la préparation dans l’aperçu du document partagé.

Les anciennes compositions restent valides sans ce nouveau champ. Les anciennes notes et les consignes générées par le carnet tactique restent accessibles dans « Notes existantes / carnet tactique ». Le PDF de composition reste limité au terrain.

### Construire une séance de A à Z

Le bouton « Créer ma séance de A à Z » ouvre une nouvelle séance vierge en gardant les paramètres du groupe. Le coach choisit effectif, gardiens, durée, jour, horaire et espace (terrain entier, demi-terrain, quart de terrain ou ancien espace réduit). « Mon exercice » permet de définir nom, durée, objectif, organisation, consignes, matériel, critère de réussite et dimensions. Un schéma indicatif est généré selon le type choisi et l’effectif ; il ne prétend pas interpréter les consignes libres.

Les exercices libres et ceux du catalogue peuvent être mélangés, déplacés et retirés. Le total, l’heure de fin et le temps restant sont recalculés. Les séances libres se sauvegardent dans la même bibliothèque, se dupliquent, s’impriment en PDF et se partagent via le service existant. Les anciennes séances restent compatibles ; aucune migration SQL n’est nécessaire.

## Parcours par rubrique

Les rubriques utilisent des étapes avec Précédent / Suivant :
accueil (tableau de bord, éducateurs), terrain (tableau, consignes et réglages,
enregistrement et exports), agenda (vue d’ensemble, calendrier), rapports
(les six rubriques existantes) et travail du club (éducateurs, documents,
outils personnels de partage). Les séances conservent leur parcours en quatre étapes.

Le module workspace-workflows.js déplace les éléments existants sans copier les
formulaires ni modifier les formats de données. L’effectif, le carnet tactique
et les rapports enregistrés peuvent être repliés. Sur ordinateur, les contenus
longs défilent dans leur page et les commandes de navigation restent accessibles.

Validation avec le site démarré sur le port 3016 :

    python tests/workspace-workflows-browser.py

## La Bible de l’éduc

Dans **Séances de la semaine → La Bible de l’éduc**, rechercher par moment du jeu, thème ou mots-clés. Le catalogue comprend 60 fiches et 30 références publiques. Chaque fiche présente un schéma proportionnel, l’objectif, les consignes et les séquences ; les dimensions, les quantités de matériel, le contexte de match, les principes tactiques et les sources se déplient à la demande.

L’organisation adapte les ateliers à l’effectif (2 à 80 présents, gardiens inclus), aux compétences et à l’espace disponible, y compris des dimensions libres. Les installations incompatibles et les acteurs manquants sont signalés. « Créer ma variante » permet de choisir un nom, les dimensions, les ateliers, le nombre de séquences, les récupérations et les consignes. La variante est conservée dans sa séance et dans son rendu PDF ou partagé. « Ouvrir dans l’atelier libre » copie les placements d’un atelier pour modifier le schéma et créer ses propres déplacements ; le coach conserve aussi l’accès au terrain vierge.

Les contenus sont des adaptations éditoriales du club, sans certification d’exercice BMF/BEF/DES ni entraînement d’un modèle d’IA. Les anciens identifiants d’exercices et les séances existantes restent compatibles. Aucune migration Supabase n’est nécessaire. [Référentiel, portée des sources et validation](docs/bible-sources.md).

### Démonstrations et critères par séquence

Les fiches proposent une démonstration guidée avec ballon et courses animés, lecture/pause, retour au départ, pas à pas, vitesse et avancement. Les schémas gardent leurs cotes et leur matériel. Le lecteur s’arrête quand la fiche est fermée, masquée ou remplacée ; le PDF conserve l’installation de départ.

« Mon groupe & mon terrain » permet de choisir pour chaque séquence le nombre de participants (gardiens compris), les gardiens, les dimensions et l’organisation : terrain unique, ateliers parallèles ou proposition automatique. Les joueurs hors exercice restent indiqués pour préparer leurs rotations. « Proposer les dimensions » recalcule un repère selon le groupe actif ; « Appliquer à toutes les séquences » copie explicitement les critères. Les nouvelles fiches commencent sur un terrain unique et les sauvegardes précédentes conservent leur organisation.

Les critères sont gardés dans le brouillon du bloc puis dans sa séance enregistrée, son PDF et son rendu partagé. Les aperçus de la bibliothèque conservent leurs réglages pendant la préparation ; ajouter l’exercice à la séance permet de les sauvegarder. Des participants absents ou un manque d’acteurs sont signalés sans inventer de joueurs ni forcer une division du groupe. Aucune migration Supabase n’est nécessaire.


### Répartitions et lecture pédagogique

Chaque fiche demande « Comment répartir ce groupe ? » et présente un terrain unique ou des ateliers équilibrés, avec au plus un joueur d’écart, gardiens compris. Seules les répartitions qui respectent les rôles et l’emprise disponible sont applicables. Le choix ajuste les dimensions pour la séquence courante ; les niveaux individuels restent à équilibrer par le coach. La liste compacte « Votre séance » permet d’atteindre ou retirer chaque exercice, avec recalcul de la durée et conservation des autres blocs.

Les démonstrations affichent une action à la fois : pions circulaires numérotés, acteurs mis en évidence, trajectoires courantes et destinations. Les passes rejoignent le receveur, les conduites gardent le ballon au pied et les courses adaptent leur durée aux mètres à parcourir. Des chemins courbes évitent les acteurs immobiles lorsque c’est possible ; cela reste une illustration pédagogique, pas un moteur de simulation d’opposition. Les boutons d’action et les arrêts sur image permettent d’expliquer le geste sans lancer toute l’animation. Les installations imprimées restent statiques.

### Fiche de terrain et exemple d’apprentissage

Chaque fiche distingue l’objectif, la mise en place réelle, le lancement, le score, les remises en jeu et les interventions du coach. L’accord entre ces éléments et le schéma prime sur l’animation. Le lecteur distingue l’installation (départ entouré, coach hors terrain, matériel) de l’exemple d’action ; le coach peut expliquer chaque étape en regardant le critère associé. Le sélecteur d’atelier actualise aussi sa fiche de terrain.

Les circuits de passes possèdent désormais trois postes matérialisés et un ballon par circuit, avec les joueurs supplémentaires derrière les postes. Les déplacements de la démonstration restent dans leur circuit. Le plan compte trois plots par circuit et contrôle un repère éditorial de 6 × 6 m utiles et 3 m entre circuits. L’activation individuelle garde un ballon par joueur, sans consigne de passes contradictoire. Les aperçus non personnalisés recalculent leurs dimensions lorsque le groupe change ; les choix explicites du coach restent conservés.

Les ressources FIFA de John Peacock, de coordination défensive en petits groupes et de prévention de la progression axiale ont été relues le 19 octobre 2026. Elles éclairent les observations et principes ; les organisations et règles proposées ici restent éditoriales, distinctes des séances précises publiées par FIFA.

### Adaptation à la catégorie et aux compétences

La catégorie (U13–U15, U16–U18 ou seniors, y compris les libellés mixtes) et le niveau de compétences pilotent la proposition : choix d’exercices, effectif souhaitable par atelier, espace proposé, règles, rapports d’opposition du rondo et rythme de répétition. Exemple à six joueurs : 5v1 en découverte, 4v2 en confirmé. Le classement de compétition ne transforme pas automatiquement un groupe en confirmé. Les repères restent éditoriaux et ajustables.

Chaque fiche affiche « Adapté à… » et la consigne retenue. Les longues séquences pédagogiques sont fractionnées en répétitions avec récupérations internes, sans dépasser la durée du bloc. Les variantes automatiques nouvelles suivent les changements de profil ; après personnalisation, les dimensions, consignes et temps choisis par le coach restent conservés. Les anciennes variantes sans indication d’origine automatique restent préservées. Aucune migration Supabase n’est nécessaire.
