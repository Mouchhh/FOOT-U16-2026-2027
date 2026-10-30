# Calendrier FFF dans l'agenda

Le lien de saison fourni pour le Stade Mayennais U17 est proposé dans le panneau « Calendrier FFF » :
https://epreuves.fff.fr/competition/club/548126-st-mayennais-f-c/equipe/2026_25254_U17_7/saison

Chaque coach enregistre le lien de son équipe et sa catégorie dans son stockage isolé (`vestiaire-fff-calendar`). Aucun mot de passe FFF, jeton FFF, scraping ou synchronisation automatique n'est utilisé. Le lien ouvre la page officielle. Le proxy de l'environnement de développement renvoie CONNECT 403 pour epreuves.fff.fr : l'existence d'un bouton d'export ICS sur la page fournie n'a pas pu être vérifiée. Ne pas annoncer un abonnement FFF opérationnel.

## Import réel disponible

Importer un fichier ICS fourni par le service s'il en propose un, ou un fichier CSV issu du modèle téléchargeable :

`date;heure;adversaire;lieu;competition;id`

Dates ISO ou JJ/MM/AAAA pour le CSV. L'heure est facultative ; elle reste inconnue si absente. L'identifiant stable sert à retrouver une rencontre reportée. Une colonne CSV facultative `statut` accepte `annulé`/`cancelled` pour une annulation. Le modèle ne contient aucune fausse rencontre.

Une prévisualisation permet de cocher les rencontres avant confirmation. Validation complète avant import ; 2 Mo et 1000 rencontres maximum. Le stockage est local et isolé par coach, il ne synchronise pas le calendrier entre ses appareils. Un quota conserve les données précédentes.

Les ICS utilisent UID et SEQUENCE : importer de nouveau le même UID actualise la rencontre au lieu de créer un doublon ; une version plus ancienne est ignorée. Les horaires UTC sont convertis en Europe/Paris, dates sans heure conservées sans inventer d'heure. Les événements récurrents sont refusés explicitement : un export par rencontre est nécessaire. Les fichiers sans identifiant stable affichent une limite explicite : un report peut créer une seconde rencontre ; il faut fournir un id stable en CSV. Aucune suppression de rencontre simplement absente d'un nouvel export.

Une annulation est mémorisée et disparaît des rencontres à venir importées ; une préparation déjà créée est conservée et étiquetée ANNULÉ dans l'agenda. Le bouton Retirer les matchs importés demande confirmation et ne supprime ni compositions ni causeries. Changer d'équipe demande également confirmation avant de remplacer les rencontres importées.

## Préparation du match

Les rencontres importées apparaissent comme Match FFF avec date/heure/lieu/compétition dans la fiche du jour. « Préparer ce match » crée une préparation avec les joueurs actuels, après confirmation et récupération du brouillon précédent. Les notes, flèches et anciennes consignes de match ne sont pas recopiées. L'import seul ne crée pas une composition pour chaque rencontre et ne publie rien au club.

Une clé de provenance relie la préparation à la rencontre importée et évite le doublon visuel pour la même date. Rouvrir reprend la préparation existante. Si la rencontre importée a changé de date, une confirmation permet de mettre à jour sa date en gardant la causerie et les joueurs. La sauvegarde explicite de la composition reste nécessaire.

## Vérification

`python tests/agenda-fff-browser.py` : lien validé, ICS/CSV, conversion Paris et changement de jour, refus des récurrences, aperçu, confirmation, réimport sans doublon, report avec même UID, versions anciennes ignorées, préparation/récupération, annulation, rechargement, quota et téléphone.

`python tests/agenda-calendar-browser.py` : agenda existant, séances, matchs, bilans, sélection de date, récupération, navigation et formats mobiles.

Ces vérifications utilisent des fichiers de test. Elles ne constituent pas une validation de l'export du site FFF ni un import du vrai calendrier U17.
