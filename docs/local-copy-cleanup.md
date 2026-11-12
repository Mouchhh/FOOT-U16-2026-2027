# Bibliothèques sans doublons automatiques

Les documents réellement enregistrés et les brouillons ouverts restent disponibles. Les duplications explicitement créées par l’éducateur ne sont pas supprimées.

- Ouvrir une version partagée ne crée plus de document « Copie locale avant ouverture » dans les bibliothèques. Les différences sont conservées dans la récupération de secours existante, séparément des documents.
- Après récupération complète de la liste distante, les anciennes copies portant ce préfixe système sont retirées de la bibliothèque de l’équipe active si elles ne sont ni partagées, ni en attente d’envoi. Le nettoyage se fait à la connexion/synchronisation et pour chaque équipe consultée.
- Un instantané de récupération est écrit avant retrait. Si son stockage échoue, la copie reste intacte. L’opération ne déclenche aucune suppression distante et ne remplace pas le brouillon ouvert.
- Les fichiers d’autres éducateurs, les autres équipes, les effectifs et les animations avec importeur propre sont exclus de ce nettoyage.
- La récupération de secours reste volontaire : la reprise ouvre un brouillon ; seul un enregistrement explicite l’ajoute ensuite aux documents.

Vérifications : `tests/club-conflict-dialog-browser.py` couvre les trois types de bibliothèques, la conservation des différences, la protection des documents partagés/en attente/manuels, l’idempotence et l’échec de quota. Les tests de révisions, de conflits, de temporisation et de quota complètent cette vérification. Aucun effacement direct du navigateur utilisateur ni du serveur n’est effectué depuis l’environnement de développement.
