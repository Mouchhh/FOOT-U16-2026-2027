# Rééquilibrage bleu / rouge (248)

Les actions courantes (création, validation de bilan, enregistrement d’exercice/animation, export mensuel), sélections, onglets et badges ordinaires utilisent désormais le bleu #2855a2. La variable d’accent courant `--club-accent` devient bleue ; `--club-logo-red` et `--club-red` restent #e41f28 pour les usages sémantiques.

Les suppressions, alertes d’erreur/discipline, cartons rouges et croix de fermeture conservent leur rouge. Les couleurs métier des pions, équipes, matériel et schémas ne sont pas remappées. Le rouge des matchs non préparés dans le calendrier conserve sa fonction de rappel important.

Dans Moments marquants, les trois champs Temps forts, Temps faibles et Faits de jeu majeurs adverses sont retirés, ainsi que leur volet Notes complémentaires. Les valeurs des bilans existants restent dans les données et exports ; les événements buts/cartons restent éditables.

Style final : `interface-blue-balance.css`. Test : `python3 tests/interface-blue-balance-browser.py`, plus les tests Analyse et Vue d’ensemble Agenda.
