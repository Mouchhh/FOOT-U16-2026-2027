# Aperçus visuels des ressources

Les six guides disposent chacun d’une illustration vectorielle thématique : coups de pied arrêtés, préparation physique, planification, construction de séance, échauffement et analyse vidéo. Ces illustrations éditoriales, accompagnées d’une icône, utilisent le bleu marine, le blanc et le rouge `#e41f28`. Elles représentent le sujet du guide, sans prétendre être une capture de son contenu.

Les mentions et badges « Fiche HTML » sont retirés des cartes. Les titres, descriptions, filtres, boutons Consulter et liens de téléchargement restent conservés. Le PDF CRM garde son aperçu documentaire et son indication de pagination. Les documents d’origine ne sont pas modifiés.

Les SVG sont définis localement à partir de chemins statiques, sans requête à un service externe. Ils sont décoratifs pour les lecteurs d’écran ; le bouton d’aperçu possède déjà le titre accessible du guide. La grille et les actions s’adaptent aux petits écrans.

Test Chromium : `tests/resource-previews-browser.py` vérifie six illustrations distinctes, les icônes, l’absence de badges HTML, l’aperçu PDF, la consultation, le téléchargement HTML identique octet pour octet, la recherche et les largeurs 1440/900/390/320 px.
