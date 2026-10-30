# Documents partagés par éducateur et par dossier

Dans **Club → Documents partagés**, choisir d’abord l’éducateur. Aucun catalogue
de tous les coachs n’est affiché par défaut. Ses dossiers présentent leurs
compteurs : Séances, Bilans, Causeries, Sorties de balle, Compositions, Tactique,
Animations et Effectifs. Ouvrir un dossier affiche au maximum douze documents ;
Afficher la suite en ajoute douze. Les fils de navigation permettent de revenir
aux dossiers ou de changer d’éducateur.

La recherche par titre et les filtres détaillés s’appliquent à l’éducateur et au
dossier ouverts. Changer d’éducateur ou de dossier efface la recherche précédente
pour éviter une liste vide à cause d’un ancien filtre. Les lectures détaillées
restent à la demande, par lots de cinquante et trois requêtes simultanées. Les
compteurs des dossiers utilisent uniquement les métadonnées déjà autorisées ;
choisir un dossier ne télécharge pas les photos ou documents des collègues.

## Classement sans copie ni migration

Les dossiers sont des vues sur les documents partagés existants. Il n’y a pas de
nouvelle bibliothèque, de déplacement physique ni de migration de base de données.
Séances et bilans suivent leur type ; effectifs et animations gardent leur
identité. Les tableaux nouvellement enregistrés portent un préfixe de classement
dans leur titre de métadonnées, distinct du titre et du contenu du document :
Composition, Causerie, Sortie de balle ou Plan de jeu. Ce préfixe permet aux autres
coachs de retrouver le même dossier sans télécharger le document entier.

Le classement automatique reconnaît une sortie de balle par son titre, un plan
par sa vue tactique, et une causerie par ses rubriques de jeu renseignées. Avant
l’enregistrement, le coach peut préciser **Dossier dans les documents partagés**
dans l’étape **Enregistrer / exporter** du Match. Ce réglage ne modifie que le
brouillon ; le bouton Enregistrer conserve le circuit habituel de sauvegarde,
versions, synchronisation et conflits.

Les anciens documents restent accessibles. Ceux dont le nom indique une causerie,
une sortie de balle, un plan, une animation ou un effectif rejoignent le dossier
correspondant. Un ancien tableau sans indication suffisante reste dans
Compositions ; le coach peut l’ouvrir, choisir son dossier et l’enregistrer.
Aucune modification distante automatique n’est faite sur ces anciennes versions.

Les autorisations du club et les validations sportives restent appliquées par le
serveur. Une consultation de collègue reste en lecture seule ; la copie conserve
le fonctionnement existant et laisse l’original intact.

## Vérifications

`tests/club-folders-browser.py` utilise des comptes et une API simulés : choix
obligatoire de l’éducateur, huit dossiers et compteurs, séparation causerie/sortie
de balle, pagination de 27 bilans en 12/24/27, recherche réinitialisée, consultation
sans modification du brouillon, vrai clic Enregistrer avec titre de classement
transmis au serveur simulé, rechargement du réglage, anciens titres et déconnexion.
Affichage vérifié à 320, 390, 844 et 1 366 pixels.

La suite de recherche détaillée contrôle toujours les 53 documents examinés par
lots de 50 et l’isolation du cache par compte et révision ; l’affichage est limité
à douze résultats par page. Les suites de navigation et de parcours hebdomadaire
passent également. Ces essais ne constituent pas une validation avec de vrais
comptes Supabase. Les anciennes suites club globales qui supposent un catalogue
tous-éducateurs dès l’ouverture ne sont pas annoncées passantes pour ce nouveau
parcours ; leur contrat d’entrée a changé.
