# Présences WhatsApp · Stade Mayennais

Cette passerelle lit les réactions **sous un message précis** annonçant une séance : 👍 présent, 👎 absent, autre réaction ou aucune réponse à confirmer. Elle ne publie pas de messages dans WhatsApp. Ce n’est pas une API officielle Meta : elle utilise `whatsapp-web.js` avec une session WhatsApp Web et peut se déconnecter ou cesser de fonctionner si WhatsApp change. Un test avec le groupe réel reste nécessaire.

## État actuel

Le code serveur, le panneau du site et les tests sont préparés. **Aucun hébergement n’est provisionné, aucun compte WhatsApp n’est associé et la lecture réelle n’est pas activée sur le site public.** La configuration `whatsapp-config.js` reste vide jusqu’au déploiement et au contrôle de l’URL HTTPS du club.

## Parcours du coach

1. Se connecter au site avec son compte éducateur autorisé.
2. Dans **Séances de la semaine → Groupe & rendez-vous**, ouvrir **Présences WhatsApp**.
3. Associer son compte en scannant le QR depuis WhatsApp → Appareils connectés → Connecter un appareil. Ne transmettre ce QR à personne. L’association accorde au serveur une session du compte WhatsApp ; les extractions de présence de cette application sont limitées au groupe et aux messages choisis.
4. Choisir le groupe de son équipe, puis le message du bon jour. Les derniers messages texte disponibles sont proposés, pas tout l’historique.
5. Le site relit les réactions à l’ouverture de la séance, puis périodiquement tant que la rubrique est visible. Une réaction retirée revient à confirmer ; une réaction modifiée remplace la précédente.
6. Vérifier les noms, exclure les coachs et non-joueurs, identifier les gardiens, puis valider. Le site relit les réactions avant l’application : si elles ont changé, une nouvelle validation est demandée.
7. L’effectif du brouillon et les propositions automatiques d’exercices suivent les présents validés. Les dimensions et variantes personnalisées restent conservées ; les installations devenues incompatibles restent signalées. Enregistrer la séance pour partager le résultat au club.

Le choix du groupe et jusqu’à douze associations de séances sont conservés sur le serveur par compte éducateur. Une famille réagissant pour plusieurs joueurs doit être corrigée manuellement par le coach. Aucune absence n’est déduite d’un silence.

## Hébergement nécessaire

Il faut un serveur Linux avec Docker Compose, un stockage **persistant**, un domaine ou sous-domaine pointant sur ce serveur et les ports 80/443 accessibles. Chaque compte WhatsApp utilise un navigateur Chromium : prévoir au moins 4 Go de RAM pour commencer avec peu de comptes, surveiller l’usage et augmenter la capacité pour plusieurs coachs. Un hébergement gratuit en veille sans disque persistant ne convient pas à un usage fiable. Aucun achat n’est effectué par ces fichiers.

GitHub Pages conserve le site. Supabase continue de gérer les comptes éducateurs ; il ne peut pas héberger le navigateur permanent de cette passerelle. Aucune migration SQL ni clé `service_role` n’est nécessaire : chaque requête utilise la session Supabase du coach et vérifie qu’il est toujours membre actif.

## Installation sur le serveur du club

Ces commandes sont destinées à l’administrateur du serveur, après création de celui-ci et configuration du domaine :

```sh
git clone https://github.com/Mouchhh/FOOT-U16-2026-2027.git
cd FOOT-U16-2026-2027/whatsapp-gateway
cp env.example .env
```

Renseigner dans `.env` : `GATEWAY_DOMAIN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (clé publique uniquement), `ALLOWED_ORIGINS=https://mouchhh.github.io`, et le nombre maximal de sessions. Ne pas mettre de jeton WhatsApp, mot de passe personnel ou clé secrète Supabase dans ce fichier. L’authentification WhatsApp est créée ensuite par l’association sur le site.

```sh
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Caddy obtient le certificat HTTPS lorsque le domaine pointe correctement vers le serveur. Vérifier `https://VOTRE-DOMAINE/health` : la réponse doit indiquer `ok: true`. L’API privée doit refuser les appels sans connexion éducateur et les origines étrangères.

Modifier ensuite **dans le dépôt du site** `whatsapp-config.js` :

```js
window.CLUB_WHATSAPP_GATEWAY='https://whatsapp.votre-domaine.fr';
```

N’utiliser que le domaine du serveur contrôlé par le club. Le site lui transmet le jeton de connexion du coach pour vérifier ses droits. Cette URL est une configuration du responsable ; elle n’est pas saisie librement par les coachs. Publier ce changement après contrôle du serveur, puis réaliser le premier test réel avec un coach volontaire : association, groupe, message, 👍, 👎, retrait de réaction, validation et adaptation de la séance.

## Données et exploitation

- Une session de navigateur par compte éducateur, dans le volume Docker privé `whatsapp-data`. Ce volume contient des identifiants de connexion WhatsApp : ne jamais le placer dans le dépôt ni le rendre public. Protéger le compte de l’hébergeur et chiffrer les sauvegardes éventuelles.
- API sans accès anonyme aux QR, groupes ou présences. Chaque requête authentifie le jeton auprès de Supabase et contrôle l’adhésion active. Les comptes ne peuvent pas lire les collectes des autres.
- Seuls le groupe sélectionné, l’annonce choisie, les noms nécessaires et leurs réactions de présence sont exposés au coach. Les identifiants techniques des participants sont remplacés par des identifiants pseudonymes propres au coach. L’application ne renvoie pas leurs numéros de téléphone.
- Les collectes de séances datant de plus de 30 jours sont supprimées lors de la lecture des enregistrements. Il y a au plus douze séances conservées par coach. Les sessions WhatsApp restent liées jusqu’à déconnexion ou invalidation par WhatsApp.
- Le bouton **Déconnecter WhatsApp et effacer mes collectes** supprime la session locale et ses collectes. Le coach peut aussi révoquer l’appareil depuis son téléphone.
- Un éducateur révoqué dans Supabase ne peut plus accéder à l’API. Pour libérer une session navigateur déjà démarrée, le responsable peut redémarrer le service : aucune session n’est restaurée avant une nouvelle requête authentifiée autorisée.
- Faire connaître au groupe l’utilisation des réactions pour préparer l’effectif et ne collecter que ce qui sert à la séance. Les parents, éducateurs et réponses concernant plusieurs joueurs doivent être vérifiés par le coach.

## Tests et développement

Node 24, Chromium et Python Playwright sont utilisés pour le développement. Les dépendances sont verrouillées ; Puppeteer est maintenu à une version corrigée dans `overrides` et son téléchargement de navigateur est désactivé au profit de Chromium système.

```sh
PUPPETEER_SKIP_DOWNLOAD=true npm ci --ignore-scripts --no-fund
npm test
npm audit --omit=dev
```

Les tests serveur utilisent un adaptateur WhatsApp simulé et un faux service Supabase : ils vérifient l’isolation, les réactions et leur retrait, les messages hors groupe et la révocation. Les tests navigateur du dépôt vérifient l’application à une séance. Ils ne prouvent pas une connexion réelle à WhatsApp ni la disponibilité de l’hébergement.

## Si le club veut uniquement du gratuit

Une piste est [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) avec une machine virtuelle **Always Free**, à condition qu’une capacité adaptée soit disponible et que les conditions actuelles du fournisseur le permettent. Les pages officielles n’ont pas pu être consultées depuis cet environnement (proxy HTTP 403) : l’éligibilité, les quotas et les modalités d’inscription doivent donc être vérifiés sur le site du fournisseur avant toute création de ressource. Ne pas assimiler un crédit d’essai temporaire à une gratuité permanente.

Le responsable doit créer lui-même le compte de l’hébergeur et vérifier que la machine et le stockage choisis restent dans l’offre gratuite, sans conversion vers un compte payant. Un nom DNS gratuit contrôlé par le club peut servir à HTTPS ; le certificat est géré par Caddy. Aucune offre payante ni nouvelle ressource cloud n’a été souscrite dans ce travail. Sans compte d’hébergeur éligible et sans machine disponible, le service reste préparé mais non déployé.

Pour une construction derrière un proxy d’entreprise, le Dockerfile accepte le certificat de confiance public du proxy via le secret de construction `build_ca`. Ne jamais désactiver la vérification TLS :

```sh
docker build --secret id=build_ca,src=/chemin/vers/autorite-du-proxy.pem -t stade-mayennais-whatsapp .
```

Ce certificat n’est pas nécessaire sur un serveur disposant d’un accès HTTPS habituel ; il n’est pas conservé dans l’image.
