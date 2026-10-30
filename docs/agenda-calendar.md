# Agenda en calendrier

L’onglet Agenda ouvre un calendrier mensuel du lundi au dimanche, avec mois
précédent/suivant, Aujourd’hui et sélecteur de mois. Les filtres semaine,
catégorie et éducateur restent accessibles dans **Filtrer l’agenda**. La vue
**Liste** et **Tout** conservent la consultation de toutes les dates.

## Éléments affichés

- Les séances de la bibliothèque sont inscrites à leur date et à leur horaire.
  Enregistrer une séance l’ajoute au calendrier ; changer sa date et enregistrer
  déplace le même événement, sans créer de copie.
- Les matchs proviennent des préparations datées des compositions. Une vue
  tactique, une animation ou un effectif ne crée pas de match. La préparation
  ouverte prime sur sa version enregistrée ; les compositions d’une même affiche
  sont dédupliquées. Un match sans horaire n’en reçoit pas un arbitrairement.
- Les bilans enregistrés sont indiqués à la date du match. Ils ne sont pas
  présentés comme un rendez-vous futur ayant une heure de rédaction supposée.

Cliquer sur un événement ouvre la préparation ou le document associé, avec les
mêmes sauvegardes et protections de brouillon. Cliquer sur le numéro d’un jour
montre ses événements complets sous le calendrier. **Séance ce jour** prépare un
nouveau brouillon daté, conserve le précédent dans la récupération, puis ouvre le
rendez-vous de séance. La séance ne rejoint la bibliothèque et le calendrier
qu’après Enregistrer.

Trois événements au maximum sont montrés par case ; le bouton de suite ouvre le
détail du jour. Sur téléphone, les repères S/M/B et leur légende évitent de
comprimer les titres ; les noms et horaires complets restent accessibles dans le
détail et les libellés des boutons. Les touches fléchées déplacent la sélection
par jour ou par semaine. La palette reste bleue et blanche.

Le calendrier représente les documents de l’espace du coach présents sur cet
appareil, y compris ceux déjà synchronisés dans sa bibliothèque. Il ne télécharge
pas automatiquement l’agenda de tous les autres éducateurs du club. Aujourd’hui
utilise l’heure de Paris ; le calcul des cases et des changements de mois utilise
des dates UTC sans dépendre des changements d’heure du navigateur.

## Vérifications

`tests/agenda-calendar-browser.py` utilise les vrais boutons de sauvegarde pour
ajouter une séance, la déplacer d’octobre à novembre, dater un match et enregistrer
un bilan. Il contrôle les cases du lundi au dimanche, le match non dupliqué, les
liens d’ouverture, un nouveau brouillon daté avec récupération, l’absence de
création automatique avant Enregistrer, le passage décembre/janvier, le 29 février,
les dates de Paris dans un navigateur américain, la liste, le rechargement et les
formats 320, 390, 844 et 1 366 pixels.

La suite Agenda/Présences conserve ses filtres et vérifie les présences, gardiens,
réponses inconnues, sauvegarde, récupération et refus de créneaux dupliqués. Son
test de changement de date utilise désormais le lendemain de la date initiale,
au lieu d’une date fixe qui pouvait être le jour courant. Les suites de navigation,
de liens entre espaces et de parcours hebdomadaire complètent ces contrôles.
