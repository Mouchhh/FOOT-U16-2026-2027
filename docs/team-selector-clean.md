# Sélecteur Mon équipe simplifié

Le sélecteur reste dans le groupe supérieur droit, près du profil. Son panneau contient uniquement les noms des équipes créées et l’action « + Ajouter une équipe ». Le contexte technique `unassigned` n’est pas proposé ; le bouton affiche « Choisir une équipe » tant que ce contexte est actif. Aucune donnée ni équipe historique n’est supprimée.

La phrase explicative, les détails redondants et le bouton « Configurer l’équipe active » sont retirés de ce menu. L’équipe active est identifiée par son accent rouge et `aria-pressed`. Les fonctions de configuration restent accessibles dans le profil du coach, séparément du sélecteur rapide.

La bascule conserve le mécanisme existant de sauvegarde et de contexte figé : sélection, rechargement automatique et restauration du module dans l’équipe choisie. Les effectifs, bilans, séances et agendas gardent leurs clés distinctes. Le panneau est aligné à droite sur PC et reste à l’intérieur de l’écran sur mobile.

Validation Chromium : team-selector-clean-browser.py, coach-teams-browser.py, team-navigation-browser.py et settings-menu-browser.py. Vérifie le menu sans contexte technique, l’ajout et la configuration, la sauvegarde et les changements d’équipe, les bibliothèques séparées et les petites largeurs.
