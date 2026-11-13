# Mettre en service l’espace Responsable

L’intégration ajoute une entrée Responsable au site existant et réutilise les comptes Supabase actuels. La configuration Canva, le projet Supabase et les documents ne sont pas remplacés.

1. Installer `supabase/club-management.sql`, puis `supabase/club-management-statistics.sql` dans le SQL Editor du projet du club.
2. Attribuer explicitement les rôles aux membres actifs (voir `docs/manager-workspace.md`). Aucun accès automatique n’est accordé à l’installation.
3. Vérifier `public.club_management_access` et tester avec les comptes désignés, un éducateur sans droit et un responsable limité à une catégorie.
4. Après le déploiement du site, recharger la page et se reconnecter si nécessaire. L’entrée Responsable apparaît seulement après la vérification des droits.

Un script personnalisé atomique destiné au propriétaire regroupe les deux migrations et les trois attributions demandées. Les adresses personnelles ne sont pas ajoutées au dépôt public. Si un compte manque ou est inactif, le script personnalisé annule l’installation sans créer de compte Auth, sans réactiver de membre et sans modifier de mot de passe.

Les droits portent sur ce projet Supabase dédié au club. Les responsables voient les versions partagées, jamais les brouillons locaux des appareils. Leurs droits d’édition et d’administration des comptes ne sont pas augmentés : cet espace est en lecture seule.
