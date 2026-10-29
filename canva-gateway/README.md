# Service Canva du Vestiaire

Service Node 24 indépendant, sans dépendance npm, pour les autorisations Canva
et l’import de présentations. Il ne partage ni les jetons ni le volume de WhatsApp.
Les tests utilisent exclusivement de faux comptes et de fausses réponses Canva.

Pour le mode gratuit choisi avec reconnexion possible, voir [Render gratuit](RENDER.md).

## Installation du serveur

1. Préparer un hébergement disponible, un domaine contrôlé et son accès HTTPS.
   Sur un PC derrière une box, vérifier DNS, redirection des ports et disponibilité
   avec le responsable réseau avant de considérer le service accessible.
2. Créer l’application dans le [portail Canva](https://www.canva.com/developers/apps),
   activer **Outside Canva → Canva REST APIs**, puis le scope
   `design:content:write`. Enregistrer précisément l’URL de retour
   `https://VOTRE-DOMAINE/oauth/callback`. Vérifier les conditions d’accès pour les
   autres coachs, et la nécessité éventuelle d’une validation de l’application.
3. Copier `env.example` en `.env` sur le serveur, renseigner domaine, identifiant
   et secret Canva, URL Supabase, clé publique et origine exacte du site.
4. Générer localement une clé de chiffrement :

   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   La conserver uniquement dans `TOKEN_ENCRYPTION_KEY` du `.env` serveur et une
   sauvegarde privée. Ne pas la copier dans le chat. Sa perte rend les autorisations
   stockées illisibles ; il faudra reconnecter les comptes. Ne pas la changer
   sans procédure de migration ou de reconnexion des coachs.
5. Depuis ce dossier, si aucun autre proxy n’occupe déjà les ports 80/443 :

   ```sh
   docker compose --profile https config --quiet
   docker compose --profile https up -d --build
   docker compose ps
   ```

   Avec un proxy HTTPS existant, utiliser `docker compose up -d --build` sans le
   profil `https`, puis ajouter une route de ce proxy vers `127.0.0.1:3001`.
   Si le proxy est lui-même conteneurisé, utiliser un réseau Docker commun et le
   nom du service au lieu de son propre `127.0.0.1`. Ne pas lancer deux Caddy
   concurrents sur les mêmes ports, notamment avec la passerelle WhatsApp.
6. Vérifier `/health` par HTTPS : `ok: true`, `service: club-canva`. Vérifier que
   `/api/status` refuse un accès anonyme ou une origine étrangère. Un healthcheck
   seul ne valide pas les comptes ni l’import Canva.
7. Modifier `canva-config.js` pour y mettre uniquement l’origine HTTPS du service
   contrôlé par le club. Aucun identifiant secret ne doit apparaître dans ce fichier.
   Publier cette configuration avec le site après les vérifications, en incluant
   `canva-return.html`. Le retour intermédiaire est accepté uniquement sur l’origine
   du site qui a initié le consentement ; il permet d’ouvrir automatiquement la
   présentation après la première autorisation, sans retirer les protections du popup.
8. Sur le site avec un coach autorisé : **Causerie · Canva → Connecter Canva**,
   consentir dans la nouvelle fenêtre, puis revenir et créer la présentation.
   Si la fenêtre est bloquée, autoriser son ouverture pour le site.
   Depuis le cadre **Mon Canva**, **Créer et ouvrir ma causerie dans Canva**
   enchaîne aussi autorisation initiale, création et ouverture automatique.

## Vérifications avant activation

```sh
npm test
```

Vérifier ensuite dans un vrai compte : consentement, refus, renouvellement,
révocation, import, rendu exact, modification des textes et isolement de deux
coachs. Les tests simulés ne prouvent ni l’approbation de l’intégration Canva,
ni l’accès du PC depuis Internet, ni la fidélité de la conversion Canva.
La construction Docker et les quatre tests dans un conteneur sans accès réseau
passent dans l’environnement de développement ; le démarrage non privilégié,
la réponse de santé et le refus d’une origine étrangère ont aussi été vérifiés.
Le déploiement HTTPS et le fonctionnement sur le PC Windows restent à valider.

## Comptes et données

- L’API authentifie chaque appel auprès de Supabase et vérifie l’adhésion active.
  Le jeton du coach ne sert qu’à son authentification, et n’est jamais enregistré.
- Le retour OAuth est lié au navigateur (cookie HttpOnly/SameSite=Lax/Secure),
  à un état aléatoire à usage unique et à PKCE. Il expire après dix minutes.
  L’initiation utilise un formulaire POST provenant uniquement de l’origine du
  site, avec authentification du coach ; aucun lien de démarrage partageable
  ne permet d’associer le compte Canva d’un autre navigateur. Le jeton du club
  transite par le corps HTTPS, jamais par l’URL, et n’est pas conservé.
- Jetons Canva chiffrés en AES-256-GCM avec identité du coach comme donnée
  authentifiée ; fichiers privés, écriture atomique. Les jetons restent côté serveur.
- Renouvellement et rotation des jetons sérialisés par coach. **Déconnecter Canva**
  demande la révocation distante et supprime la connexion locale. Si la révocation
  échoue, le site demande aussi son retrait manuel dans les paramètres Canva.
- Le serveur transmet le fichier uniquement à l’API Canva fixe, sans accepter
  d’URL arbitraire. Il ne conserve pas le fichier ; seuls les identifiants des
  vingt derniers imports sont gardés, accessibles au propriétaire pendant 24 h.
  Le titre du design Canva est limité à 50 caractères ; le titre complet reste
  dans les pages de la présentation.
- Ne pas monter le volume `canva-data` dans le site public. Protéger aussi le
  `.env`, les sauvegardes et l’accès administrateur de la machine.
- Faire tourner une seule instance du service pour ce volume : verrous et états
  OAuth sont locaux au processus. Un redémarrage interrompt les consentements
  en cours ; les autorisations déjà enregistrées restent conservées.
