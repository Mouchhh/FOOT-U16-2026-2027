# Agenda · Vue d’ensemble & Rapports

Le premier sous-onglet Agenda remplace les compteurs génériques par une vue mensuelle, une comparaison prévu/réalisé et les accès aux documents de l’équipe active.

Sources : `agendaCalendarAllEvents` (récurrences, exceptions, imports, suppressions et contexte d’équipe existants), `playerAttendanceSessions.sessionFor`, bilans sauvegardés dédupliqués avec `playerStatsUniqueEvents`, et `monthlyPlayerSnapshot` pour l’assiduité et les minutes.

Le taux concerne seulement les événements planifiés échus. Une séance est documentée par un pointage valide comprenant au moins un présent/absent inclus. Un match est documenté par un bilan validé ou un score officiel. Un simple état « confirmé/préparé » ne prouve pas la réalisation. Les occurrences de séance à date/heure identiques sont fusionnées. Les bilans hors planning restent consultables sans augmenter artificiellement le dénominateur prévu. Les rappels administratifs et bilans ne sont pas comptés comme des séances ou matchs supplémentaires.

Le rapprochement match/bilan utilise en priorité la clé source de l’agenda, puis uniquement un adversaire normalisé et une date concordants si le résultat est unique. Le coach accède au bilan existant, à la séance ou à la préparation d’un bilan prérempli via les routes existantes.

Aucune donnée manquante n’est transformée en zéro : assiduité sur pointages connus, répartition min/max/moyenne sur joueurs avec minutes renseignées. Le volume est explicitement une estimation selon les durées prévues des séances pointées ; l’application ne mesure pas de durée réelle distincte. Le taux du mois précédent n’est affiché que s’il est calculable.

Exporter le Rapport Mensuel ouvre l’impression du navigateur avec une feuille dédiée (choisir Enregistrer au format PDF). Elle reprend la synthèse, les événements et les statistiques individuelles du mois, sans le menu du site. Nettoyage après `afterprint`, pour préserver la feuille dans les navigateurs dont l’impression est asynchrone.

Fichiers : `agenda-overview-reports.js/css`. Test : `python3 tests/agenda-overview-reports-browser.py`. Aucun changement de données ni appel Supabase supplémentaire.
