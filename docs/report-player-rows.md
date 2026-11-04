# Saisie compacte des joueurs du bilan

Les lignes du bilan affichent les présences de la semaine, les minutes et les cartons. Dans l’onglet Joueurs, les champs avancés existants sont regroupés sous « Détails » : identité, association à l’effectif, statut, buts/passes et réglages de présence. Les contrôles sont déplacés dans le DOM, sans dupliquer leur état ni changer leurs gestionnaires.

Les créneaux sont résolus avec le même service que le pointage collectif : semaine du bilan, équipe active, occurrences réelles de la semaine complète, exceptions d’agenda comprises. Chaque présence est enregistrée via le service canonique avec contrôle de propriétaire, comparaison de version et conservation des réponses des autres joueurs. Deux créneaux le même jour sont distingués par leur horaire.

Dans la vue rapide, minutes et discipline créent au besoin une seule ligne liée à la fiche d’effectif. Les cartons provenant des faits marquants restent en lecture seule. Les totaux continuent de provenir des bilans enregistrés ; les présences validées synchronisent immédiatement l’effectif.

Les champs se répartissent sur plusieurs lignes sur mobile. Les sélecteurs restent tactiles et les cartes jaunes/rouges conservent leurs repères colorés (rouge du club : #e41f28).

Les trois créneaux hebdomadaires restent visibles même lorsque le dernier est à venir. Le pointage anticipé est explicite et demeure hors des cumuls statistiques jusqu’à la séance. Le service générique de pointage conserve par défaut son filtre sur les séances passées ; les vues hebdomadaires demandent explicitement la semaine complète.

Le bandeau collectif « Pointer les présences » est retiré de l’interface. Le service de pointage canonique et les contrôles des lignes joueurs restent actifs. L’analyse tactique regroupe les six champs existants dans quatre sections : offensif, défensif, transitions et phases arrêtées ; aucun ancien texte n’est supprimé ni recomposé.
