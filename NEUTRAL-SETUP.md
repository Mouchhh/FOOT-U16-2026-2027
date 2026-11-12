# CRUZA — deuxième installation neutre

Branche indépendante : feat/cruza-club-neutre. Le site SMFC reste sur main.

## Démonstration
Servir ce dossier avec `python3 -m http.server 3060`, puis ouvrir http://localhost:3060/accueil.html.
Utiliser une origine différente du site SMFC : le stockage du navigateur est isolé par origine. Aucun joueur ni calendrier du club n’est préchargé. Les sauvegardes de démonstration sont locales et ne sont pas partagées.

## Installer un club pilote
1. Héberger cette version sur un domaine ou sous-domaine distinct. Ne pas la publier à la place du site existant.
2. Personnaliser le nom, les couleurs, le logo et les coordonnées dans Club. Les réglages actuels sont propres au compte/navigateur ; ce n’est pas une administration globale multi-clubs.
3. Créer un projet Supabase dédié, appliquer les migrations du dossier supabase selon sa documentation, puis renseigner son URL et sa clé publique dans club-cloud-config.js. Tester les permissions avec deux comptes avant d’inviter le club.
4. Déployer une passerelle Canva dédiée, configurer les secrets et les URL OAuth, puis renseigner canva-config.js. WhatsApp reste désactivé.
5. Renseigner la source FFF de ce club. Aucun lien officiel n’est présélectionné.
6. Adapter les pages légales aux coordonnées du responsable réel avant ouverture publique. Ne pas activer les workflows de reporting hérités pour un autre destinataire.

Cette version est une base de démonstration indépendante, pas une validation commerciale ni un service multi-clubs mutualisé. Les archives historiques et les tests du dépôt peuvent encore mentionner le club d’origine ; ils ne constituent pas des données de démonstration.
