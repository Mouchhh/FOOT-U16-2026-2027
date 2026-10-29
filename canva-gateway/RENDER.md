# Render gratuit, avec reconnexion Canva si nécessaire

Ce mode est choisi par l’utilisateur le 29 octobre 2026 : les autorisations
peuvent être perdues lorsque l’instance gratuite redémarre ou est remplacée.
Le coach réautorise alors Canva. Les présentations déjà créées restent dans son
compte Canva ; le service n’efface pas ces documents.

## Avant de déployer

Les fichiers préparés dans l’espace de travail doivent d’abord être publiés dans
le dépôt GitHub que Render lit. En particulier : `canva-gateway/server.mjs`,
`package.json` et, pour un Blueprint, `render.yaml`. La seule connexion GitHub
dans Render ne publie pas les modifications locales.

Choisir le plan **Free** effectivement proposé par le tableau de bord. Ne pas
ajouter de disque persistant ni de base de données payante. Le Blueprint fourni
ne déclare qu’un service `plan: free`, sans disque ni base. Il n’a pas été déployé.
Les pages publiques de documentation Render ont renvoyé HTTP 403 depuis cet
environnement : les conditions et quotas actuels doivent être vérifiés dans
Render, sans supposer une disponibilité permanente ou un montant futur.

## Création manuelle du Web Service

| Réglage | Valeur |
|---|---|
| Dépôt | `Mouchhh/FOOT-U16-2026-2027` |
| Branche | Celle qui contient effectivement les nouveaux fichiers publiés |
| Nom | `vestiaire-canva` |
| Language / Runtime | **Node**, sans Docker local |
| Root Directory | `canva-gateway` |
| Build Command | `node --check server.mjs` |
| Start Command | `node server.mjs` |
| Instance Type | **Free** |
| Health Check Path | `/health` |

Le service n’a aucune dépendance npm. Il écoute le `PORT` fourni par Render sur
`0.0.0.0`. Render assure HTTPS ; Caddy et Docker Compose ne sont pas utilisés.

Renseigner les variables dans Render, jamais dans le chat ou le dépôt :

| Variable | Valeur |
|---|---|
| `NODE_VERSION` | `24` |
| `DATA_DIR` | `/tmp/vestiaire-canva` (temporaire) |
| `CANVA_CLIENT_ID` | Identifiant de l’application Canva du site |
| `CANVA_CLIENT_SECRET` | Secret de cette application, dans Render uniquement |
| `TOKEN_ENCRYPTION_KEY` | 64 caractères hexadécimaux aléatoires, voir ci-dessous |
| `SUPABASE_URL` | URL publique déjà utilisée par le club |
| `SUPABASE_PUBLISHABLE_KEY` | Clé publique déjà utilisée par le site, jamais une clé service_role |
| `ALLOWED_ORIGINS` | `https://mouchhh.github.io` |

L’adresse HTTPS est lue dans `RENDER_EXTERNAL_URL`, fournie par Render. Ne pas
inventer une URL avant la création du service. Un `PUBLIC_URL` explicite reste
possible pour un domaine personnalisé, et prend alors priorité.

Pour générer la clé sur Windows sans installer Node, ouvrir PowerShell et exécuter :

```powershell
$canvaKeyBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($canvaKeyBytes)
-join ($canvaKeyBytes | ForEach-Object { $_.ToString("x2") })
```

Coller le résultat directement dans `TOKEN_ENCRYPTION_KEY` sur Render. Ne pas
transmettre cette valeur dans une conversation ni la mettre dans GitHub.

## Brancher Canva et le site

1. Vérifier `https://ADRESSE-DONNEE-PAR-RENDER/health` : réponse JSON
   `ok: true`, `service: club-canva`. Ce contrôle seul ne valide pas Canva.
2. Dans l’application Canva, inscrire exactement
   `https://ADRESSE-DONNEE-PAR-RENDER/oauth/callback` comme URL de redirection.
3. Mettre l’origine HTTPS Render dans `canva-config.js`, puis publier le site,
   y compris `canva-return.html` et les fichiers d’export.
4. Tester avec un coach autorisé : autorisation, création, ouverture, exactitude
   de tous les textes et schémas. Puis reconnecter après un redémarrage du service
   si ses autorisations ont disparu. Aucune connexion réelle n’est validée ici.

## Limites acceptées

- L’instance gratuite peut se mettre en veille ; son premier réveil peut prendre
  du temps. Un problème de réveil ne signifie pas que les identifiants sont faux.
- Les autorisations chiffrées et les identifiants des derniers imports ne sont
  pas garantis après redémarrage/redéploiement. Il peut être nécessaire de
  reconnecter Canva ; ce n’est pas forcément à chaque clic.
- Ne pas ajouter de trafic artificiel pour maintenir l’instance éveillée.
- Si les quotas gratuits sont épuisés, le service peut être indisponible. Vérifier
  la situation dans Render avant toute décision de changement de plan.
