# Finalisation des parcours du club

Travail réalisé rubrique par rubrique, sans supprimer les menus déroulants, le
survol, les étapes liées ni les données existantes. Les critères sont vérifiés
avant de passer à la rubrique suivante ; une réussite technique ne remplace pas
l'observation pédagogique par un éducateur sur le terrain.

| Étape | Livrable et critères | État |
|---|---|---|
| 1 · Sauvegardes | Récupération d'un brouillon remplacé, séparation par coach, erreurs explicites et absence d'écrasement après échec | Vérifié (tests dédiés) |
| 2 · Séances | Relecture objectif/effectif/espace/durée, corrections choisies, duplication datée | Vérifié (tests dédiés) |
| 3 · Accueil & agenda | Rendez-vous utiles, reprise du travail, semaine suivante sans ressaisie | Vérifié (tests dédiés) |
| 4 · Terrain | Annuler/rétablir, placement et changements simples, export fidèle | Vérifié (tests dédiés) |
| 5 · Bible | Audit complet des formats/variantes, contexte match lisible, démonstrations et matériel vérifiés | Vérifié (tests dédiés) |
| 6 · Après-match | Bilan rapide et détaillé, priorités convertibles en préparation sans perte du brouillon | Vérifié (tests dédiés) |
| 7 · Travail du club | Recherche par éducateur/catégorie/thème/date, distinction brouillons et documents partagés, références identifiées | Vérifié (tests dédiés) |
| Contrôle transversal | Menus, survol, Suivant/Précédent, téléphone/ordinateur, persistance et partage | Vérifié (tests dédiés) |

Les vérifications seront documentées avec leur portée et leurs limites. Aucun
statut d'homologation fédérale ne sera attribué aux exercices par ces contrôles.

## Vérifications effectuées

- Sauvegardes : remplacement avec copie de récupération, rechargement, restitution,
  espaces séparés par coach et refus d’écraser après une erreur de stockage.
- Séances : comparaison du déroulé à la durée prévue, thèmes hors priorités,
  séquences et dimensions, effectif actif, matériel maximal à un instant donné.
  La répartition des durées reste un choix du coach et demande de revoir les récupérations.
- Accueil/agenda : reprise du brouillon, prochain rendez-vous, duplication datée,
  changement d’année, copie choisie d’une semaine et avertissement des créneaux déjà utilisés.
- Terrain : annuler/rétablir indépendant pour chaque vue, clavier, erreur de stockage,
  maintien du placement lors de l’ajout depuis l’effectif ; PDF autonome d’une page.
  L’historique récent est en mémoire pour la visite ; la récupération des brouillons est persistante.
- Bible : voir [l’audit des 63 fiches](bible-release-audit.md) et son
  [relevé détaillé](bible-release-audit.json). Les trois variantes sont explicites dès
  la lecture rapide, avec conservation de la lecture approfondie.
- Rapports : bilan essentiel/détaillé utilisant les mêmes données, priorités vers
  des exercices compatibles, conservation des blocs/date/notes existants et retour
  arrière après échec de stockage.
- Club : recherche facultative par auteur/type/catégorie/thème/date, lecture limitée
  à 50 nouveaux documents par demande, résultats partiels signalés, cache lié au
  compte et à la révision. Les repères sont proposés par leur auteur et ne sont pas
  présentés comme validés par le club ou la fédération.
- Partage : deux navigateurs avec service Supabase simulé, trois types de documents,
  conflits, coupures, reprise automatique, invitations et retrait d’autorisation.
  Aucun changement de schéma SQL ni de droits Supabase n’est nécessaire à cette livraison.
- Navigation : six menus, survol et traversée du panneau, clavier, écran tactile,
  Précédent/Suivant et conservation des brouillons. Terrain stable après changements
  d’onglet ; recherche de la Bible et premier écran utiles à 1366 × 768.

## Tests reproductibles

Serveur de développement lié à `127.0.0.1:3016` ; Chromium et Playwright requis.

```sh
python tests/club-completion-browser.py
python tests/terrain-history-browser.py
python tests/completion-report-search-browser.py
python tests/club-network-browser.py
python tests/coach-squad-browser.py
python tests/report-training-browser.py
python tests/bible-quality-browser.py
python tests/workspace-hover-steps-browser.py
python tests/workspace-dropdowns-browser.py
python tests/terrain-size-browser.py
python tests/workspace-polish-browser.py
node tests/bible-release-audit.js
node tests/bible-pedagogical-motion.js
node tests/bible-design-variants.js
```

Ces contrôles vérifient le logiciel et des contrats football explicites. Ils ne
constituent ni une homologation des exercices ni une simulation exhaustive des
choix possibles d’un adversaire. Le partage réel dépend du service Supabase déjà
configuré ; les tests d’intégration n’envoient aucune donnée de coach au service réel.
