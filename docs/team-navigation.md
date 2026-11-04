# Espaces équipes et navigation personnelle

Le bouton « Mon équipe » affiche le contexte actif dans l’en-tête. Son panneau présente uniquement les noms des équipes créées, marque l’équipe active en rouge `#e41f28` et permet d’ajouter une équipe. La configuration reste séparée dans le profil. Les libellés sont rendus comme texte, sans interprétation HTML.

Le changement utilise `coachTeamSwitch` : sauvegarde de l’espace courant, mémorisation du module, sélection du contexte puis rechargement automatique. Le contexte reste figé pendant la durée de chaque page pour empêcher les callbacks différés et les écritures `pagehide` de viser l’équipe suivante. Les clés locales des bibliothèques, brouillons, agendas et récurrences sont distinctes ; les documents distants sont filtrés à l’hydratation. Les écritures de bibliothèques et les brouillons portant explicitement le contexte d’une autre équipe sont refusés. Une erreur de sauvegarde bloque le changement, sans abandonner le travail.

Les exercices de référence et les paramètres personnels restent communs au coach ; les documents historiques restent conservés. Cette séparation des contextes dans l’interface complète les contrôles de droits du serveur, sans les remplacer.

Le profil ouvre un menu au survol avec une souris, ou au clic/toucher : Mon Profil, Mes Préférences, Se Déconnecter. Les deux premières options ouvrent les sections existantes des paramètres ; la déconnexion conserve la sauvegarde préalable et le transport d’authentification existants. La photo et le nom se mettent à jour après sauvegarde du profil. La roue de paramètres est fixée en bas à gauche de la navigation ; son menu léger propose uniquement Préférences et Déconnexion. Sur mobile, elle reste au-dessus de la barre du bas.

Les panneaux sont des disclosures non bloquants, accessibles au clavier (flèches, Home/End, Échap), mutuellement exclusifs, fermés par clic extérieur et sortie du focus. Les formulaires de configuration existants restent inchangés.

Tests locaux : `tests/team-navigation-browser.py`, `tests/coach-teams-browser.py`, `tests/coach-account-browser.py`. Serveur HTTP : port 3016. Couverture : séparation des données, onglets concurrents, hydratation distante simulée, ajout/configuration, échec de stockage, survol/clic/clavier, modification du profil et largeurs 1366/390/320 px.
