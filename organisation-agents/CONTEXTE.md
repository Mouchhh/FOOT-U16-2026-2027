# Contexte du produit

Le Vestiaire sert actuellement au Stade Mayennais. Objectif : une plateforme commercialisable pour plusieurs clubs, couvrant séances, effectifs, présences, agenda, matchs, bilans, terrain tactique et causeries animées.

Architecture à vérifier avant chaque intervention : interface HTML/CSS/JavaScript, GitHub Pages, Supabase pour comptes et documents, services Render pour intégrations. Le dépôt contient aussi une passerelle WhatsApp. Sa présence ne prouve pas que le service est opérationnel.

Contraintes connues :
- Les animations sont nécessaires dans les exports ; préserver le format de causerie existant.
- Les conflits de version doivent conserver les différences locales. Ne pas réintroduire les boucles de retry sur conflits métier.
- Le quota navigateur et la restauration des sauvegardes nécessitent des tests réels.
- Les présences doivent se rattacher explicitement au bon joueur et à la bonne séance.
- Le widget classement FFF a été retiré à la demande du propriétaire ; ne pas le rétablir automatiquement.
- Avant commercialisation : démontrer l’isolation entre clubs, la récupération des données et la qualité de l’accueil client.

Priorités proposées, non encore approuvées comme programme autonome :
1. Cartographier les parcours critiques et vérifier les sauvegardes avec des données fictives.
2. Vérifier l’isolation multi-club et les coûts par club.
3. Préparer un parcours de démonstration et d’accueil d’un club pilote.
4. Proposer les offres commerciales à partir des fonctionnalités réellement disponibles.
