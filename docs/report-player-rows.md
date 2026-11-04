# Saisie compacte des joueurs du bilan

Les lignes du bilan affichent les présences de la semaine, les minutes et les cartons. Dans l’onglet Joueurs, les champs avancés existants sont regroupés sous « Détails » : identité, association à l’effectif, statut, buts/passes et réglages de présence. Les contrôles sont déplacés dans le DOM, sans dupliquer leur état ni changer leurs gestionnaires.

Les créneaux sont résolus avec le même service que le pointage collectif : semaine du bilan, équipe active, occurrences réelles et passées, exceptions d’agenda comprises. Chaque présence est enregistrée via le service canonique avec contrôle de propriétaire, comparaison de version et conservation des réponses des autres joueurs. Deux créneaux le même jour sont distingués par leur horaire.

Dans la vue rapide, minutes et discipline créent au besoin une seule ligne liée à la fiche d’effectif. Les cartons provenant des faits marquants restent en lecture seule. Les totaux continuent de provenir des bilans enregistrés ; les présences validées synchronisent immédiatement l’effectif.

Les champs se répartissent sur plusieurs lignes sur mobile. Les sélecteurs restent tactiles et les cartes jaunes/rouges conservent leurs repères colorés (rouge du club : #e41f28).
