# Compte dédié à la revue Canva

Exécuter `supabase/club-canva-review.sql` dans SQL Editor après les migrations
club et comptes. Le script installe des protections sans créer de compte ni
supprimer les documents. Les autorisations ordinaires restent inchangées.
Les lectures REST des documents et profils sont limitées au compte de revue ;
les RPC de présence/activité et de références ont des protections distinctes.
Les écritures de documents restent limitées à leur propriétaire.

Puis, dans SQL Editor uniquement :

```sql
select * from public.club_authorize_canva_reviewer(
  'mouchetenzo+testcanva@gmail.com'
);
```

Cette adresse dédiée utilise la boîte Gmail du responsable. Ne pas inviter le
compte Canva de l'équipe de revue comme éducateur de production. Un compte
existant est refusé pour éviter toute conversion involontaire.
Le code d'activation retourné est confidentiel. S'inscrire depuis le site avec
cette adresse, ce code, prénom « Test », nom « Canva » et un nouveau mot de
passe. Ne partager les identifiants que dans les champs dédiés du portail Canva.
Le compte ne doit contenir que des données fictives. Tester dans une fenêtre
privée qu'il ne voit aucun document ou profil réel avant de le communiquer.

La connexion Canva utilise toujours le compte Canva du testeur. Une restriction
Canva liée au statut brouillon doit être traitée avec Canva ; ces règles SQL ne
publient pas l'intégration.

Ne pas réinstaller les anciennes migrations de présence/références après cette
migration sans la réexécuter : elles recréent les RPC d'origine. Après toute
nouvelle fonction SECURITY DEFINER lisant les données, vérifier son isolation.
Pour désactiver le compte, désactiver son invitation et son appartenance dans
`club_members` par son UUID (important si son adresse a changé).
Ne pas retirer sa ligne de `club_test_accounts` : cela lui redonnerait les droits
de lecture ordinaires s'il restait membre actif.
