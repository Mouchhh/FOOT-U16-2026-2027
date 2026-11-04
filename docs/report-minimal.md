# Bilan de match minimal

Le premier écran affiche le score, l’adversaire et la date nécessaires au rattachement du match, les faits marquants avec sélection des joueurs de l’effectif, les minutes par joueur et un bouton « Valider le bilan ».

Les premiers enseignements, le basculement vers le formulaire complet, le lien de choix d’exercices, l’avertissement de brouillon, le suivi des séances et le bloc « Du bilan au terrain » ne sont plus créés. La préparation historique reste conservée dans les données et les exports ; les onglets d’analyse et de plan d’action restent accessibles pour consulter les informations existantes. Le pointage des présences demeure dans son accordéon dédié.

Les minutes utilisent les identifiants stables de l’effectif. Modifier un buteur, passeur ou carton actualise uniquement les minutes affichées, sans rouvrir la fiche joueur ni réintroduire le formulaire détaillé. La validation réutilise la sauvegarde existante : elle ferme le module après réussite et conserve le travail en cas d’échec.

Validation locale : tests/report-minimal-browser.py, tests/report-effectif-sync-browser.py, tests/document-completion-browser.py et tests/report-entry-banner-browser.py. Vérifie la suppression des blocs, les faits/minutes, les statistiques cumulées, la conservation des données historiques, la validation et les largeurs mobiles 390/320 px.
