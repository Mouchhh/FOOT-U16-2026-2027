# Accueil personnel et épuré

Le tableau de bord conserve ses trois cartes : prochaine séance, prochain match,
travail à reprendre. Le fond photographique est limité au bandeau d’accueil,
avec ses commandes de défilement, pause et respect du mouvement réduit. Le
reste de la page retrouve des surfaces blanches et bleues.

Un seul bonjour reprend le nom du compte connecté ; sans compte lié, il utilise
le profil local actif. Le profil local générique apparaît comme « Bonjour coach ».
Le bandeau Coach actif et la répétition du compte ne sont plus affichés au-dessus
du tableau de bord. Leurs contrôles existants restent accessibles dans **Tous mes
outils → Mon profil et ma connexion**. Le profil verrouillé d’un compte lié reste
verrouillé ; sa sélection locale n’est pas exposée par cette réorganisation.

Sous le bonjour, la dernière date d’enregistrement est calculée depuis les vraies
bibliothèques enregistrées de ce coach sur cet appareil : séances, bilans et
compositions/effectif. Les dates de rendez-vous, de brouillon et les horodatages
futurs ne sont pas présentés comme une sauvegarde. Sans enregistrement, le texte
l’indique ; si le stockage est illisible, il le signale. La date est affichée en
heure de Paris, et n’est pas présentée comme un succès de synchronisation au club.

La navigation Tableau de bord/Éducateurs reste accessible en haut. Les flèches
redondantes en bas de l’accueil sont retirées de l’affichage pour ne pas recouvrir
les cartes sur téléphone. Aucun rendez-vous, document ou joueur n’est créé par
l’ouverture de l’accueil. Le compteur de joueurs reprend les fiches de l’effectif.

## Vérifications

`tests/home-welcome-browser.py` vérifie les noms local/compte, l’exclusion des
brouillons, la date réelle d’enregistrement en heure de Paris même dans un
navigateur américain, le stockage indisponible, l’accès aux contrôles de profil,
les photos limitées au bandeau et l’absence de débordement à 320, 390, 844 et
1 366 pixels. La suite du tableau de bord et la navigation par tâches passent.
Le test du diaporama commence désormais explicitement hors accueil avant de
vérifier sa visibilité, puisque l’accueil est la page d’entrée du site.

Les deux anciens conteneurs de compte et de profil sont maintenant masqués dès
le HTML et maintenus masqués après initialisation. Seuls leurs vrais contrôles
(sélection locale autorisée, édition du profil, accès club et déconnexion) sont
déplacés dans les réglages facultatifs. Le test force l’état connecté et une
réactivation des conteneurs pour vérifier qu’ils restent invisibles. Les liens
de connexion de la page d’entrée utilisent également la nouvelle version.
