# Sauvegarde et reprise du club — administrateur

La synchronisation conserve la dernière version partagée, pas un historique de secours.
Les PDF ne permettent pas de restaurer les documents modifiables. Les brouillons,
exercices libres non partagés et séquences locales restent propres au navigateur.
Ne pas effacer les données du navigateur avant de les enregistrer ou de les conserver.

## Ce qui est couvert

Les scripts `scripts/club-backup.sh` et `scripts/club-restore.sh` conservent les
membres, invitations, documents (photos intégrées comprises), responsables de pôles
et validations. Le dump PostgreSQL prend une vue cohérente de ces cinq tables.
La présence temporaire en ligne n'est pas restaurée.

**Ce n'est pas une sauvegarde complète du projet Supabase.** Authentication
(comptes, identifiants, accès), les réglages Auth, les secrets serveur, les objets
Storage et les fichiers de la passerelle WhatsApp doivent être sauvegardés par
leur procédure propre. Les scripts SQL du dépôt conservent la structure et les droits.
Voir la [documentation Supabase de sauvegarde et restauration](https://supabase.com/docs/guides/platform/backups).
La disponibilité des sauvegardes automatiques dépend de l'offre ; ne pas supposer
qu'un compte gratuit dispose d'une restauration automatique.

## Préparer une sauvegarde

1. Installer les outils PostgreSQL `pg_dump`, `pg_restore`, `psql` compatibles avec
   la version serveur (utiliser la même version majeure pour ces trois outils).
2. L'administrateur configure un service `club_source` dans `pg_service.conf` et
   le mot de passe dans son fichier `pgpass`, hors du dépôt. Utiliser les paramètres
   PostgreSQL du tableau de bord Supabase, avec SSL ; pas la clé publique du site.
   Ne jamais envoyer le mot de passe dans cette conversation ou le JavaScript.
3. Depuis Bash (WSL sous Windows), dans le dépôt :

   ```bash
   PGSERVICE=club_source bash scripts/club-backup.sh /dossier-prive/club-2026-10-22.dump
   ```

4. Conserver l'archive chiffrée, sur un autre appareil ou stockage privé, avec la
   date et le commit du site. Elle contient des données personnelles et les empreintes
   des invitations. Ne jamais la placer dans GitHub Pages ou un dossier public.
5. Répéter au moins chaque semaine et avant une migration ; conserver plusieurs dates.
   Une archive lisible par pg_restore n'est pas encore une restauration validée.

## Répéter la reprise, sur un projet de test séparé

1. Arrêter les écritures sur la cible de test. Installer les mêmes migrations SQL,
   dans l'ordre de `supabase/INSTALLATION.md`. Ne pas connecter les coachs à cette cible.
2. Restaurer les comptes Auth par la procédure Supabase adaptée au projet, **avec
   les mêmes UUID** : recréer seulement les adresses mail génère d'autres identifiants
   et ne suffit pas. Une reprise complète peut demander l'aide de l'administrateur
   Supabase. Ne pas désactiver les clés étrangères pour contourner cet obstacle.
3. Les cinq tables applicatives doivent être vides. Le script ne les efface jamais.
   Une installation avec des comptes déjà présents peut avoir créé des membres ou
   invitations : préparer une cible réellement vide avec l'administrateur.
4. Configurer un **autre** service PostgreSQL `club_test`, puis :

   ```bash
   PGSERVICE=club_test bash scripts/club-restore.sh --empty-target /dossier-prive/club-2026-10-22.dump
   ```

   Le contrôle du vide et la restauration sont sous verrou dans une seule transaction.
   Une cible occupée ou un compte manquant entraîne un refus et un retour en arrière.
   N'utiliser que des archives de confiance produites par le script ; un dump SQL
   est du code exécuté avec les droits de l'administrateur.
5. Comparer nombres de documents, UUID propriétaires, révisions, photos, pôles et
   validations. Se connecter comme deux éducateurs : lecture partagée, modification
   de ses seuls documents, refus d'un compte révoqué, validation du seul pôle autorisé.
6. Noter la date, l'archive, la durée et le résultat. Ne basculer la production
   qu'après cet essai et la vérification des accès et de la configuration du site.

Les scripts ne restaurent pas le projet en production automatiquement et ne
remplacent pas la sauvegarde Supabase complète. Aucun exercice de reprise du
projet réel n'a été effectué depuis cet environnement, qui n'a pas ses accès.
