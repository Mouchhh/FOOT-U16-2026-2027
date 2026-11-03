# Profil éducateur et documents de ses équipes

Le menu Club propose **Éducateurs** et **Mon partage**. L’ancien accès autonome **Documents partagés** n’apparaît plus dans la navigation. Cliquer sur la carte d’un éducateur ouvre une page de profil avec deux onglets : **Profil** et **Documents partagés**. Le bouton **Tous les éducateurs** ramène au répertoire ; **Mon profil d’éducateur** ouvre son propre profil.

## Choix explicite de l’équipe

Le sélecteur **Équipe consultée** appartient au profil affiché. Lorsqu’un autre éducateur possède plusieurs équipes, aucune équipe n’est choisie implicitement. Une fois l’équipe sélectionnée, les documents, dossiers, compteurs, recherches et pages de résultats sont limités à cet éducateur et cette équipe. Le contexte reste visible dans la partie Documents. Changer d’équipe efface la recherche précédente pour éviter les résultats masqués par un ancien filtre.

Ce sélecteur ne change jamais `activeCoachTeam`, le brouillon ou l’identité du coach connecté. Sur son propre profil uniquement, le bouton **Utiliser cette équipe pour mon travail** effectue cette bascule explicitement via `coachTeamSwitch`, avec ses contrôles de sauvegarde et son isolation existants. Le choix d’équipe de travail est mémorisé avant la découverte de nouvelles équipes sur le serveur pour rester stable au rechargement.

## Informations disponibles et lectures

Le nom provient des membres autorisés du club. Pour son propre profil, la photo, le rôle et les coordonnées locales du compte sont réutilisés. Aucune photo, fonction précise ou coordonnée privée d’un collègue n’est inventée ou lue dans son stockage personnel.

Les équipes d’un collègue sont identifiées à partir du `teamContext` des documents partagés ; les anciens documents utilisent leur catégorie renseignée. Les documents sans rattachement restent dans À classer. Une équipe vide jamais partagée ne peut pas être déduite chez un collègue ; ses propres équipes configurées sont connues localement même sans documents.

La découverte se fait à l’ouverture du profil sélectionné, avec des lectures paginées des seuls champs utiles : identifiant, auteur, type, révision et champs JSON d’équipe/catégorie. La projection PostgREST exclut les photos, schémas et contenus pédagogiques. Les documents complets continuent à être chargés à la demande par les contrôleurs existants. En cas d’identification incomplète, un groupe explicite permet de consulter les documents dont l’équipe reste à identifier, avec un bouton Réessayer.

Le cache est associé au compte lecteur, à l’identifiant du document et à sa révision. Les réponses sont vérifiées contre l’auteur sélectionné, la session, la génération de connexion et le numéro de requête courant. Changer d’éducateur ou se déconnecter invalide les requêtes précédentes. Une réponse tardive ne peut pas remplir le profil courant avec les équipes de l’ancien éducateur.

## Conservation et navigation

Le composant déplace les contrôles de dossiers existants dans le profil, sans les copier ni modifier les documents, leur classement, leurs identifiants ou leurs droits. Les prévisualisations, copies indépendantes, suppressions autorisées, filtres détaillés et chargements de douze résultats restent assurés par leurs contrôleurs existants.

L’historique de navigation conserve uniquement l’auteur, l’identifiant d’équipe et l’onglet du profil, sans document ni secret. Lors d’un rechargement privé, le profil est restauré après authentification uniquement si le coach et l’équipe de travail correspondent et si l’éducateur demeure dans la liste autorisée.

## Fichiers et vérifications

`club-educator-profile.js` construit la page, charge les équipes et applique la portée. `club-educator-profile.css` conserve le bleu/blanc et le rouge du logo `#e41f28`, avec une présentation adaptée au tactile. Les fenêtres de consultation conservent leur croix rouge extérieure grâce au système global de fermeture ; le profil est une page, avec navigation de retour. Sidebar et barre mobile restent inchangées.

`tests/club-educator-profile-browser.py` couvre le parcours authentifié avec API simulée, deux équipes, les compteurs, la recherche, la pagination, la consultation sans modification du brouillon, le rechargement, les réponses tardives, le changement explicite de sa propre équipe et plusieurs tailles d’écran. `tests/club-folders-browser.py` suit désormais le parcours par profil et conserve les vérifications du classement et des anciennes données. Les tests de gestion d’équipes, paramètres, sauvegarde et alignement de la navigation complètent la vérification.
