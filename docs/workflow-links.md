# Étape 3 — Relier les espaces

Dans la causerie, « Préparer le bilan de ce match » ouvre un aperçu du match source. Le coach peut créer un bilan avec le mécanisme existant `newReport` : identité, contexte, composition et préparation mémorisée avec ses objectifs. Le brouillon de bilan précédent est conservé par la récupération existante ; un échec de stockage bloque la création. Si date, adversaire, équipe et catégorie concordent, les bilans existants du coach sont proposés explicitement, sans modifier leurs observations. Une modification de la préparation ou du coach pendant l’aperçu impose sa réouverture.

Dans la première partie du bilan, un accès mène au plan d’action et à la préparation de séance existante. Les exercices gardent leurs références `matchSource`. Le déroulé de séance propose un retour au bilan correspondant, courant ou enregistré. Si ce bilan n’est plus disponible, la provenance et les objectifs restent lisibles sans ouvrir un autre document.

« Enregistrer et voir dans l’agenda » utilise le même enregistrement que le bouton habituel. Ce dernier transmet désormais son résultat à travers le contrôle de cohérence de séance. Après succès, l’agenda affiche la semaine du rendez-vous, sans filtres contradictoires, et met la fiche en évidence. Un échec de sauvegarde laisse la préparation ouverte. Rien n’est envoyé à un service externe par ces passages.

Une ancienne fenêtre fermée est retirée avant une nouvelle ouverture du dialogue bilan/séance pour éviter des IDs dupliqués pendant le délai de l’événement `close`.

Validation : `tests/workflow-links-browser.py` vérifie le parcours Match → bilan → séance → bilan/agenda, la fidélité de la préparation, la récupération du bilan précédent, la reprise d’un bilan existant, les deux échecs de stockage, une source absente et les fenêtres entre 320 px et 1366 px. Les suites navigation par tâches, confort, bilan vers séance, destination de séance, suivi de match et éditeur paysage passent également. Contrôle visuel Chromium sur portable et téléphone ; aucun essai avec un compte Canva ou WhatsApp réel pour cette étape.
