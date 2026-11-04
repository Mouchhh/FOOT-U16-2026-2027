# Moments marquants et suivi des joueurs

L’étape interne `players` garde son identifiant pour les navigations existantes, mais s’intitule « 3 · Moments marquants ». Elle ne rend plus la liste individuelle. Trois champs narratifs facultatifs sont conservés dans `analysis` : `strongMoments`, `weakMoments`, `keyOpponentEvents`. Les anciens bilans restent valides sans ces champs ; les textes nouveaux sont contrôlés, sauvegardés avec le bilan et ajoutés à sa synthèse/export.

Les présences, minutes et cartons restent dans la première partie du bilan. Le sous-onglet « Suivi des joueurs » de Votre effectif présente les cumuls de la saison sélectionnée, les bilans datés et le détail des présences du joueur choisi. Il réutilise le modèle statistique existant, sans nouvelle collection ni duplication de compteurs, dans l’équipe active.

Le bouton « Effectif » rétablit les lignes habituelles. Le rappel mensuel rétablit cette vue avant d’afficher son récapitulatif. Les anciennes données individuelles restent stockées dans leurs bilans d’origine.

La vue Moments marquants utilise désormais le registre canonique des faits de match : ajouts rapides de but pour nous, but adverse, carton jaune et carton rouge, avec minute et sélecteur de joueur. Le type « Carton adverse » permet de consigner la discipline adverse sans alimenter les statistiques de notre effectif. Le passeur est facultatif. Les anciens types de faits restent affichés lorsqu’ils existent déjà dans un bilan, sans suppression de données. Les trois champs narratifs sont disponibles sous « Notes complémentaires ».
