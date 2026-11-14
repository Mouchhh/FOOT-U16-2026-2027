# Repères Agenda → Causerie → Bilan

Ajout ciblé au site Stade Mayennais, sans remplacer les éditeurs, menus ou exports existants.

- Un petit bandeau précise catégorie, adversaire, date et horaire sur Composition, Causerie et Bilans.
- Le prochain rendez-vous de la catégorie active peut préremplir une préparation vierge. Une préparation déjà enregistrée pour cette rencontre est reprise.
- À l’entrée des Bilans, un brouillon vierge peut reprendre le dernier match joué (14 jours maximum), sa causerie enregistrée et son bilan existant s’il est unique.
- L’identité est `fffFixtureKey` / `agendaSourceKey` ; les documents manuels utilisent l’identifiant de composition. Les anciens bilans sans clé ne sont reconnus que par une date et un adversaire identiques et non ambigus.
- Si deux rencontres sont proposées le même jour, aucun choix automatique n’est fait. Le bandeau demande de choisir dans l’Agenda.
- Un travail non enregistré sur un autre match n’est jamais déplacé automatiquement. Le bandeau propose le rendez-vous pertinent ; les mécanismes de conservation et d’erreur de stockage restent actifs.
- « Nouveau match » reste une création volontairement vierge. Les créations et choix explicites depuis l’Agenda ou les archives conservent leur parcours.
- Un report de date est signalé sans modifier silencieusement le document ou la bibliothèque. Le lien stable reste reconnu.
- Un bilan existant et son analyse ne sont pas écrasés par une nouvelle version de causerie. L’actualisation reste volontaire dans l’outil déjà présent.
- Une préparation d’un autre identifiant de rencontre ne peut pas être liée automatiquement, même si sa date et son adversaire sont identiques.

Aucune migration Supabase, nouvelle table, nouvelle bibliothèque ou modification de droits. Aucune purge de données locales.

## Vérifications

`python3 tests/match-continuity-browser.py` (serveur local port 3016) vérifie le parcours réel : données de l’Agenda, causerie enregistrée, rechargement puis bilan du même match, analyse conservée, report de date, clés contradictoires, ambiguïté, création volontairement vierge et largeurs 1440/390/320.

Régressions ciblées : reprise de causerie, import et continuité bilan, éditeur propre, contenu complet des exports et cohérence des séances avec l’Agenda. Les tests Canva utilisent une passerelle simulée ; aucun compte réel n’est sollicité.

Deux tests anciens ont aussi été exécutés et leurs limites reproduites sur la version de référence 17ab956, sans ces ajouts : `document-completion-browser.py` attend un retour automatique au bilan après rechargement alors que la navigation revient à l’accueil ; `agenda-match-actions-browser.py` exige une fenêtre de reprise absente pour un simple brouillon. Ces attentes ne sont pas modifiées par ce correctif. Le parcours réel et les erreurs de stockage sont couverts par le nouveau test ciblé.
