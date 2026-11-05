# Bilan · Analyse aérée

La vue sportive utilise deux cartes : Animations & Transitions (transitions et CPA) et Pistes de progrès & Axes de travail (priorité de la semaine, progrès avec/sans ballon). Les points forts restent modifiables dans un volet discret. Les compléments et évaluations sont repliés par défaut.

Les champs écrivent directement les propriétés existantes de `currentReport.analysis`, `currentReport.plan.priority` et `currentReport.ratings` via les mécanismes d’enregistrement existants. Aucune migration ni suppression de notes. Les notes historiques et les exports restent conservés. Les anciennes demi-notes restent affichées et inchangées tant que le coach ne choisit pas une nouvelle note ; les nouveaux boutons proposent 1 à 5 ou Non évalué. Les observations associées restent accessibles.

Les ateliers suggérés sont des étiquettes déterministes, calculées localement sur les mots-clés des observations/axes de travail (maximum quatre). Elles ne modifient aucun exercice ni plan de séance et ne constituent pas une génération IA.

CSS dédié `report-analysis-modern.css`, rendu dans `report-structure.js`. Fond #f8fafc, cartes blanches, validation rouge #e41f28. Grille à deux colonnes sur grand écran, une sur mobile.

Test : `python3 tests/report-analysis-modern-browser.py` — deux cartes, édition, suggestions en direct, conservation des notes historiques/demi-notes, sauvegarde et rechargement, format mobile et action de validation rouge.
