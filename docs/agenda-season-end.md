# Fin saisonnière des semaines types

Les créneaux de semaine type s’arrêtent au 15 juin inclus. Le calcul rattache novembre 2026 et janvier 2027 à la même fin de saison : 15 juin 2027. Une configuration après le 15 juin appartient à la saison suivante.

Les nouvelles règles enregistrent `seasonEnd` par créneau. Pour les anciennes règles sans limite, le résolveur calcule la même borne depuis leur date de début. Agenda et pointage utilisent ce résolveur commun ; les séances récurrentes après cette borne ne sont plus projetées. Les séances préparées ou pointées dans la bibliothèque ne sont pas supprimées.

Une modification en cours de saison conserve la borne d’origine, et déplacer une occurrence après cette borne est refusé avec une explication. Le coach peut configurer explicitement une nouvelle semaine type pour la saison suivante, avec sa propre borne. L’extension d’une seule semaine avant la première configuration reste conservée.
