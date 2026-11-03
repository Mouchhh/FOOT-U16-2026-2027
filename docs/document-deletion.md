# Suppression des causeries et bilans

`document-deletion.js` et `document-deletion.css` ajoutent une action rouge visible en tête des deux fiches, y compris après validation. Le bouton existant `report-delete` est déplacé et réutilisé, sans doublon. La confirmation est un dialogue natif avec titre, description, focus initial sur Annuler, Échap et croix externe rouge via le système global existant. La suppression est effectuée uniquement par « Oui, supprimer ».

Le compte, l’équipe, l’identifiant et le contenu du document sont vérifiés à la confirmation. Un changement pendant la confirmation impose de la rouvrir. Les écritures passent par le stockage déjà isolé par coach et équipe et par le mécanisme de synchronisation existant. Les écritures précédentes sont restaurées si une écriture suivante échoue ; si la restauration échoue aussi, l’interface indique explicitement une suppression incomplète et conserve le document ouvert.

Pour un bilan, l’entrée est retirée de `vestiaire-reports`, le brouillon est remplacé par un bilan vide, les versions locales du même identifiant et sa récupération sont retirées. Les autres bilans, notamment des copies ayant un identifiant différent, sont conservés. Le rendu existant recalcule les statistiques de l’effectif.

La causerie fait partie de la composition. Sa suppression vide les rubriques de préparation et la marque de validation dans le brouillon, l’enregistrement correspondant, la vue tactique liée et les copies locales correspondantes. La date, le libellé du match, l’adversaire, la composition, les joueurs et les notes tactiques propres au tableau restent conservés. Les médias et sélections de démonstrations de cette causerie sont également vidés. Les documents d’un autre identifiant ne sont pas supprimés. Les anciennes archives administratives d’incidents de synchronisation ne sont pas effacées globalement.

L’éditeur, les bibliothèques, l’historique et l’agenda sont actualisés sans rechargement. Aucun remplacement avec archivage automatique n’est utilisé pour la suppression, afin de ne pas créer une nouvelle copie du document supprimé.

Validation : `tests/document-deletion-browser.py` vérifie annulation, succès, échec du stockage avec restauration, changement de document, rouge exact, croix externe, nettoyage d’un bilan, préservation de la composition et formats mobiles. Les suites `document-completion-browser.py` et `player-statistics-browser.py` couvrent les parcours connexes.
