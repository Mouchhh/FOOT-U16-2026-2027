# Engrenage en bas à gauche

L’engrenage existant est placé dans le pied de la navigation, fixé en bas à gauche. Sur PC, un espace est réservé à ce pied pour laisser défiler les autres entrées sans les cacher. Sur mobile, il reste à gauche au-dessus de la barre inférieure et, dans le Bilan, au-dessus de la barre d’actions.

Au survol avec une souris ou au clic/toucher, il affiche uniquement « Préférences » et « Déconnexion ». Le panneau est un disclosure non bloquant monté au niveau du body pour échapper au débordement de la navigation. Il se ferme au clic extérieur, à Échap ou à la sortie du focus ; les flèches permettent de choisir les options.

Préférences ouvre un petit formulaire dans ce même panneau : page d’accueil par défaut, affichage compact et réduction des animations. La sauvegarde réutilise la validation et le stockage existants, sans grande fenêtre. Le menu Profil conserve séparément l’accès aux formulaires de profil/sécurité et du club. Déconnexion réutilise la sauvegarde préalable du travail et le flux authentifié existant ; aucun droit ni identifiant n’est modifié.

Tests Chromium : settings-menu-browser.py, coach-account-browser.py et team-navigation-browser.py. Vérifie position gauche, deux options uniques, survol/clic/clavier, préférences, erreur de stockage, appel de déconnexion et petites largeurs.
