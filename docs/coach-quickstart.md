# Étape 5 — Prise en main et parcours complets

Depuis l’accueil, le bouton **Mode d’emploi**, après les trois cartes de rendez-vous et de reprise, présente quatre repères : préparer une séance, préparer le match, passer du bilan à la séance suivante, enregistrer et retrouver son travail. Chaque rubrique ouvre le parcours correspondant sur les documents existants. Aucune nouvelle fiche n’est créée par le guide et il ne s’ouvre pas automatiquement. Il défile sur les petits écrans ; Fermer reste accessible et Échap rend le focus au bouton d’origine.

Dans la Bible, la pagination précède désormais les cartes, dans le même ordre visuel et clavier. Les étapes de préparation de séance sont masquées pendant la consultation de la Bible ; **Ma séance** et **Préparer ma séance** permettent de les retrouver. Sur ordinateur, les deux filtres principaux sont côte à côte pour limiter la hauteur de l’en-tête. Aucun exercice, texte ou filtre n’est retiré.

## Validation logicielle

- `tests/coach-quickstart-browser.py` : les quatre destinations, contenu et identité des documents conservés, aucun lancement automatique, fermeture clavier et retour du focus. Formats 1280×720, 1366×768, 1920×1080, 390×844, 320×740 et 844×390.
- `tests/full-week-journey-browser.py` : deux parcours continus avec les vrais boutons et formulaires, dans des profils locaux séparés. U15 découverte, six joueurs sans gardien ; Seniors confirmé, douze joueurs dont un gardien. Deux séances et un bilan par parcours, recharge, agenda, préparation de match mémorisée, objectifs transmis à la nouvelle séance et première séance intacte.
- `tests/site-final-browser.py` : parcours entre espaces, recherche Club simulée, historique, valeurs des documents, absence de débordement horizontal et d’IDs dupliqués.
- `tests/workspace-polish-browser.py` : Bible, pagination, filtres, fiche agrandie, ajout à une séance, retour et disponibilité des commandes aux tailles testées, sur toutes les pages du catalogue.
- `tests/exercise-classification-browser.py` : 65 fiches et filtres BMF/thème, conservation de la séance et impression.

Les tests plus anciens ont été adaptés aux commandes actuelles : **Autres outils** ouvre les menus ; la causerie est dans son onglet ; les filtres supplémentaires sont dans **Affiner la recherche**. Les vérifications de contenu et de conservation restent actives.

Contrôle visuel Chromium sur portable et téléphone émulé. Aucun compte Canva, WhatsApp ou éducateur réel n’a été utilisé. La semaine d’essai avec deux éducateurs et les contrôles sur leurs appareils restent à réaliser selon [la fiche d’essai](semaine-essai-educateurs.md).
