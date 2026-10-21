# Effectif réutilisable par éducateur

## Utilisation

« Terrain & tactique » → « Compositions » → « Mes joueurs enregistrés » dans
l'effectif. Le même répertoire est accessible par « Mon espace · agenda » →
« Mes joueurs ».

Créer une fiche avec prénom/nom, numéro, photo et poste habituel, ou utiliser
« Récupérer les joueurs de la compo » pour enregistrer les joueurs déjà nommés.
Les pions génériques « Joueur 1 », etc. ne sont pas importés. Recherche par nom
ou numéro, filtre par poste et modification des fiches sont disponibles.

« Utiliser » permet de remplacer un pion en conservant sa position et son rôle,
ou d'ajouter le joueur aux Impacteurs / Finisseurs. La photo est copiée dans le
brouillon. Enregistrer ensuite la composition pour la partager. La sélection
modifie toujours la composition, y compris si la vue épurée est actuellement
ouverte ; le plan de jeu reste indépendant.

Un joueur déjà associé à la composition ne peut pas être ajouté deux fois.
La détection inclut aussi les fiches historiques identiques, non encore associées.
Modifier ou retirer une fiche de l'effectif ne modifie pas les compositions
existantes. Jusqu'à 100 fiches sont enregistrables par éducateur ; la limite
existante de 30 joueurs par tableau est conservée.

## Stockage et synchronisation

Le répertoire est un document typé de la bibliothèque de compositions, avec un
identifiant stable `effectif-<identifiant du coach>` et un champ `squadDirectory`
(version 1). Sa liste de pions est vide ; il est exclu de la liste et du compteur
des compositions. Le document dispose d'un aperçu d'effectif dans Travail du
club et n'est jamais ouvert comme un terrain vide. Aucun changement SQL requis.

Il utilise les clés de stockage par coach, les autorisations existantes,
la file hors ligne, les révisions optimistes et les indicateurs de synchronisation.
Les autres éducateurs autorisés peuvent le consulter comme les autres documents
du club ; seul son propriétaire peut le modifier. Les profils locaux restent
sur l'appareil tant qu'ils ne sont pas liés à un compte privé.

En cas de versions concurrentes, ouvrir l'effectif depuis Travail du club : les
joueurs distincts sont réunis et chaque fiche différente exige un choix explicite
entre appareil et club. La révision attendue est mise à jour avant partage, et
une nouvelle modification distante sera à nouveau protégée par le contrôle serveur.
Une fiche ouverte pendant un rafraîchissement ne peut pas être enregistrée
silencieusement au-dessus d'une modification distante de la même fiche.

Les photos sont recadrées localement en JPEG carré de 180 px. Le répertoire est
validé (100 fiches, identifiants uniques, numéros 1–99, photos en données image,
volume total plafonné) ; un échec local ne remplace pas les données précédentes.

## Vérification

`tests/coach-squad-browser.py` utilise de vrais contextes Chromium et un upload
photo, avec simulation à la frontière du service de partage. Il vérifie les
places, le banc, l'isolation des coachs, le rechargement, les doublons, les
modifications de profil, la file versionnée, la lecture sur un deuxième navigateur,
la résolution des conflits, les limites du stockage et l'affichage mobile.

`tests/club-network-browser.py` vérifie les parcours de connexion et de partage
existants avec un Supabase simulé. Ces tests n'utilisent pas les comptes réels
ni les données des éducateurs et ne prouvent pas la disponibilité du serveur réel.
