# Matchs et bilans : listes sans brouillons

Les choix de reprise et sélections principales utilisent uniquement les bibliothèques explicitement enregistrées. Le document courant non enregistré et les copies automatiques de récupération ne sont plus ajoutés comme choix supplémentaires. Les boutons « Versions précédentes » sont retirés des écrans Match et Bilan. Les causeries proposées à l’import viennent elles aussi des compositions enregistrées, avec leur filtrage équipe/match habituel.

L’agenda et la prochaine rencontre issue des compositions n’affichent plus un document de match simplement autosauvegardé. Les rencontres FFF déjà importées restent présentes : elles constituent des rendez-vous indépendants du brouillon de préparation.

Le travail en cours et les copies de récupération restent conservés sur l’appareil. Une navigation vers son formulaire ne le supprime pas ; reprendre un document déjà enregistré dont le formulaire est en cours d’édition conserve ces modifications. « Nouveau bilan » produit toujours un nouvel identifiant même si aucun bilan n’est encore enregistré. Un clic explicite sur Enregistrer ou Valider rend le document disponible dans les listes normales.

Tests : saved-only-browser.py, report-entry-banner-browser.py, report-causerie-import-browser.py, document-completion-browser.py. Couverture : brouillon absent des listes et de l’agenda, conservation du formulaire, apparition après enregistrement, import des seules causeries enregistrées et nouvelle création.
