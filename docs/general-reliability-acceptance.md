# Étape 18 — fiabilité générale

Recette du 22 octobre 2026. Ce document distingue les contrôles logiciels des
validations sur le service et les appareils réels. Aucun compte du club n'a été
créé, modifié ou utilisé pour les essais.

## Vérifications réalisées

| Domaine | Résultat et preuve |
|---|---|
| Inscriptions et autorisations | `club-accounts-access.sql` : invitation à usage unique, noms validés, pas de droits accordés par le nom, invitations privées, révocation. PostgreSQL temporaire PGlite. |
| Pôles sportifs | `club-poles-access.sql` : migration historique, trois types de documents, interdiction d'approuver/retirer dans l'autre pôle, catégories inconnues refusées, pas d'auto-promotion. |
| Présences des éducateurs | `club-presence-access.sql` : accès authentifié, plusieurs sessions dédupliquées, déconnexion, expiration, horodatage serveur, sessions privées. |
| Gros volume | `reliability-volume-browser.py` : 10 000 métadonnées, 100 coachs, 50 fiches initiales, compteurs exacts et recherche par titre sans lecture des contenus. Calcul des compteurs en un parcours au lieu d'un parcours par coach. Budget de régression 2,5 s ; environ 15 ms sur la machine de test, sans garantie pour tous les appareils. |
| Navigation et affichage | `site-final-browser.py`, `workspace-dropdowns-browser.py` : six menus, sous-pages, conservation composition/séance/rapport, retour, clavier et Échap, absence d'identifiants dupliqués ou de débordement horizontal aux dimensions testées. |
| Petits écrans et tactile | 320 × 568 et 844 × 390 pour le partage ; téléphone émulé 390 × 844 avec sélection du menu et déplacement réel par événements tactiles Chromium. Un téléphone émulé ne valide pas Safari sur iPhone. |
| Édition | `exercise-board-browser.py`, `terrain-size-browser.py` : matériel, clavier, images d'animation indépendantes, enregistrement/rechargement, terrain stable après changements de vue. |
| Photos et comptes | `coach-squad-browser.py` : portraits, effectif propre au compte, enregistrement, changement de compte, conflit résolu par joueur, conservation en cas d'échec local. Ce test ne prouve pas une charge réseau de milliers de portraits. |
| Enregistrement | `save-reliability-browser.py` : quota local, journal de reprise, rechargement, réponse perdue, deux modifications successives, conflit entre fenêtres, suppression et recréation. Voir les limites de la [recette 15](save-reliability-acceptance.md). |
| Restauration applicative | `club-restore-access.sql` : aller-retour transactionnel sur base temporaire avec photo/payload, UUID propriétaire, révision, validation et pôle inchangés ; droits toujours actifs ; compte Auth absent → refus et aucun lot partiel. |

## Outils administrateur

[Guide de sauvegarde et reprise](club-backup-guide.md), scripts Bash
`club-backup.sh` et `club-restore.sh`. Aucun bouton JSON ajouté dans le parcours coach.
Les archives sont exclues du dépôt. La restauration contrôle une cible vide sous
verrou, dans la même transaction que l'import ; elle ne supprime pas de données.

**Portée du test :** la syntaxe Bash et les contraintes/restaurations de données
ont été vérifiées. Les exécutables PostgreSQL natifs pg_dump/pg_restore/psql
n'étant pas installés ici, le cycle d'archive de ces scripts doit encore être
exécuté sur le projet de test de l'administrateur. Ce contrôle SQL temporaire
ne constitue pas une restauration complète Supabase et ne teste pas Auth/Storage.

## Conditions restant à valider avant une réception définitive

- Chrome/Edge Windows, Firefox et Safari iPhone réels. Ici, Chromium uniquement ;
  l'installation de Firefox a échoué (téléchargement HTTP 403). Pas de résultat
  annoncé pour un moteur qui n'a pas pu être lancé.
- Une semaine complète avec deux éducateurs sur deux appareils, incluant
  déconnexion, coupure réseau, travail simultané et récupération.
- Un dump puis une restauration native du projet de test, comptes Auth et
  configuration compris ; noter durée et date. Programmer ensuite les sauvegardes
  privées avec le responsable du club. Aucun automatisme de production installé.
- Essai terrain d'un échantillon d'exercices et import des exports dans le vrai
  compte Canva : les recettes 9 et 16 restent applicables.
- Mesure avec le volume réel de photos/documents et la connexion du club. Le
  test synthétique de métadonnées ne simule pas toute la charge Supabase.

Le logiciel a une recette reproductible ; ces essais externes restent ouverts.
Ils ne doivent pas être cochés uniquement parce que le site est publié.
