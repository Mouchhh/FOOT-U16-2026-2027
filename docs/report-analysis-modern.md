# Bilan · Analyse aérée

La vue sportive utilise deux cartes : Animations & Transitions (transitions et CPA) et Pistes de progrès & Axes de travail (priorité de la semaine, progrès avec/sans ballon). Les points forts restent modifiables dans un volet discret. Les compléments et évaluations sont repliés par défaut.

Les champs écrivent directement les propriétés existantes de `currentReport.analysis`, `currentReport.plan.priority` et `currentReport.ratings` via les mécanismes d’enregistrement existants. Aucune migration ni suppression de notes. Les notes historiques et les exports restent conservés. Les anciennes demi-notes restent affichées et inchangées tant que le coach ne choisit pas une nouvelle note ; les nouveaux boutons proposent 1 à 5 ou Non évalué. Les observations associées restent accessibles.

Les ateliers suggérés sont des étiquettes déterministes, calculées localement sur les mots-clés des observations/axes de travail (maximum quatre). Elles ne modifient aucun exercice ni plan de séance et ne constituent pas une génération IA.

CSS dédié `report-analysis-modern.css`, rendu dans `report-structure.js`. Fond #f8fafc, cartes blanches, validation rouge #e41f28. Grille à deux colonnes sur grand écran, une sur mobile.

Test : `python3 tests/report-analysis-modern-browser.py` — deux cartes, édition, suggestions en direct, conservation des notes historiques/demi-notes, sauvegarde et rechargement, format mobile et action de validation rouge.

## Ajustement 246

La carte est renommée Animations et reçoit directement les champs existants `withBall` / `withoutBall`, déplacés depuis les compléments. Le volet Points forts est retiré de l’interface ; ses anciennes valeurs `topAttack` / `topDefence` restent stockées et exportables. Le libellé Transitions devient Récupération / perte, sans changer la propriété enregistrée. Les compléments occupent désormais la troisième place de la même grille, repliés par défaut, avec adaptation sur les écrans plus étroits.

## Carte ouverte 247

Compléments et évaluations sportives est une section ouverte identique aux deux autres cartes. Notes sur 5 et observations sont visibles directement ; aucun volet déroulant dans cette carte. Les valeurs enregistrées sont inchangées.

## Parcours simplifié 251

L’onglet Plan d’action est retiré des navigations. Les anciennes routes `plan` sont redirigées vers Analyse. Deux champs uniquement sont proposés dans le bloc Pour la prochaine séance en bas d’Analyse : priorité (`plan.priority`) et exercice envisagé facultatif (`plan.sessionExercise`). La priorité n’est plus dupliquée dans la carte Pistes de progrès. Les autres propriétés de l’ancien plan ne sont pas effacées ; si elles sont renseignées, un volet Informations conservées permet de les relire. Les anciennes clés de navigation sont gardées pour ne pas décaler les index des parcours mémorisés.
