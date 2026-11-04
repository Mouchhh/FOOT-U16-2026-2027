# Création d’un match entièrement vierge

`newBlankMatch` construit un nouvel objet depuis l’identité de l’équipe active. Il ne clone aucun match : nouvel UUID, zéro joueur, aucune formation sélectionnée, aucune note ni flèche et préparation neuve. Le bouton « Nouveau match », la commande de nouvelle causerie et le choix « Créer un nouveau match » partagent cette logique. La création depuis l’agenda ou une rencontre FFF ne reprend que les renseignements explicites de cette rencontre ; aucun joueur, placement ou contenu pédagogique n’est hérité.

`matchWorkspaceInstall` conserve d’abord une copie de récupération de la composition et du plan ouverts. Il réinitialise les clés du brouillon tactique, du mode terrain et du dernier lien Canva, puis écrit la nouvelle composition en dernier. En cas d’échec il tente de restaurer les valeurs précédentes, conserve l’état visible et signale l’erreur. Les bibliothèques enregistrées, l’effectif, les autres équipes et la session de connexion ne sont jamais effacés.

Après réussite, les références de composition et plan, l’annulation tactique, le glisser-déposer, l’éditeur de joueur, la photo temporaire et les champs de causerie sont réinitialisés. Une lecture de photo commencée sur l’ancien match ne peut plus alimenter le nouveau. Les listes de sélection sont désélectionnées. Les démonstrations de causerie déjà indexées par coach/équipe/document utilisent naturellement le nouvel ID sans reprendre la sélection précédente.

La formation vide est désormais un état valide, représenté par « Choisir un système ». Repositionner sans système ne provoque pas d’erreur ; créer un plan tactique demande d’abord un système. Les joueurs de l’effectif peuvent être ajoutés explicitement depuis un sélecteur au-dessus du terrain. Une création vide reste vide au rechargement sans ouvrir un choix de reprise pour elle-même.

Les matchs enregistrés restent scellés sous leur ID dans la bibliothèque. Le choix historique conserve aussi ses protections contre les clics devenus obsolètes et archive les versions précédentes avant création. « Réutiliser pour un prochain match » demeure l’action explicite de copie, distincte de « Nouveau match ».

Tests Chromium : `tests/match-new-browser.py`, `tests/document-completion-browser.py`, `tests/causerie-archive-browser.py`, `tests/coach-teams-browser.py`. Couverture : état vierge, identifiant distinct, rechargement, historique intact, effectif conservé, sélection volontaire, clic obsolète, échec de stockage, nouvelle causerie, création FFF et petits écrans. Safari/macOS non testé dans cet environnement.
