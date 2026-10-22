# Étape 14 · Travail du club et repères sportifs

22 octobre 2026. Logiciel vérifié dans Chromium (ordinateur/mobile) avec Supabase
simulé ; autorisations exécutées dans PostgreSQL embarqué PGlite, base temporaire.
Aucun document, compte ou droit de production n’a été modifié pendant ces tests.

## Parcours

- [x] Recherche par titre, auteur, type, catégorie, thème et dates conservée.
  Filtre supplémentaire : partagé / proposé / validé. Les filtres détaillés
  conservent les lots de 50, le signalement de recherche partielle et les erreurs.
- [x] Auteur, version et date visibles. Badge compact, sans ouvrir une fiche.
- [x] Consultation des collègues en lecture seule ; ajout de « Consulter sans
  modifier » pour ses propres fiches, sans remplacement du brouillon.
- [x] Copie indépendante, nouvel identifiant, auteur du compte actif. Original et
  brouillon ouverts conservés. La copie ne reprend ni la proposition de repère,
  ni une validation, ni les présences nominatives de la séance d’origine.
- [x] Validation depuis l’aperçu, après lecture, uniquement pour un responsable
  désigné. Confirmation explicite, nom du validateur et version affichés.
- [x] Décision dans une table serveur distincte du contenu modifiable par l’auteur.
  Un champ JSON « validé » ne donne aucun statut ni droit.
- [x] Nouvelle version : retour à proposé ; validation ancienne refusée. Retrait
  explicite d’une décision possible. Retrait du rôle ou désactivation du responsable :
  ses décisions ne sont plus présentées comme valides.
- [x] Droits d’auteur des originaux inchangés : le responsable ne peut pas modifier
  le document d’un collègue parce qu’il dispose du droit de validation.
- [x] Absence de migration ou erreur : validation non confirmée, aucun faux badge
  validé. Documents toujours consultables/copiables ; session et cache isolés.
- [x] L’aperçu ouvert reprend les changements de statut après actualisation.
- [x] Script SQL réexécutable, conserve les responsables et décisions existants.

## Tests exécutés

- `tests/club-references-browser.py` : deux comptes, consultation, décision,
  filtres, copie de collègue et de soi-même, refus sur version périmée,
  migration absente, déconnexion, mobile.
- `tests/club-work-browser.py` : recherche, lots, comptes et filtres.
- `tests/completion-report-search-browser.py` : recherche détaillée, cache.
- `tests/club-network-browser.py` : trois types de document, partage,
  plusieurs appareils simulés, conflits, coupures, copies et retrait d’accès.
- `tests/site-final-browser.py` : parcours généraux, brouillons et tailles d’écran.
- `tests/club-references-access.sql` : rôles, RLS, faux champs de validation,
  droits d’auteur, révisions, retrait, réinstallation, accès inactif et anonyme.
  Ce fichier est prévu pour une base PostgreSQL vide : jamais la production.

## Activation restante dans le projet réel

- [ ] Exécuter `supabase/club-references.sql` dans SQL Editor (après `club.sql`).
- [ ] Désigner le véritable responsable sportif selon
  [le guide](../supabase/INSTALLATION.md#repères-du-club-et-validation-sportive-étape-14).
- [ ] Essayer proposition → lecture → validation → nouvelle version avec deux
  comptes réels du club. Vérifier que le compte ordinaire ne peut pas valider.

L’accès administrateur Supabase n’est pas disponible dans cet environnement.
La publication du site n’installe pas une migration SQL. Cette étape reste
explicitement en attente d’activation réelle pour la validation sportive ; la
recherche et le partage habituels continuent à fonctionner sans cette migration.
Une validation interne au club ne constitue pas une homologation fédérale.
