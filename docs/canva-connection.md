# Connexion Canva · prérequis et travail restant

Objectif : chaque coach autorise son compte Canva depuis son espace, crée une
présentation à partir de sa causerie complète, puis ouvre le document modifiable
dans Canva. Réutiliser l’autorisation tant qu’elle reste valide et permettre sa
révocation. Ne pas confondre cela avec la session du navigateur sur canva.com.

## État du 29 octobre 2026

- Génération locale de la présentation et de ses textes modifiables implémentée.
- Service `canva-gateway` et interface connectée implémentés, testés avec faux
  comptes et faux services : PKCE, consentement, chiffrement, renouvellement,
  import asynchrone, lien d’édition et déconnexion.
- Le responsable a créé l’application Canva et renseigné les variables dans Render.
- Il a confirmé la réponse `ok: true` de `https://canva-educateur-smfc.onrender.com/health`.
- Sa capture du portail montre l’URL de retour correcte et « All changes saved ».
- L’origine Render est renseignée dans `canva-config.js`. Aucun secret n’est ajouté au site.
- Le consentement et l’import réels restent à tester avec le compte autorisé du coach.
- Les pages de documentation canva.dev renvoient un refus du proxy cloud.
  Leur indisponibilité a été contournée en consultant le dépôt officiel Canva,
  sans désactiver TLS ni chercher de clés.

Source consultée : [Canva Connect API Starter Kit](https://github.com/canva-sdks/canva-connect-api-starter-kit),
commit `3ebbea49148be8c1d762dea7c917eb4174e3c52d`, notamment `README.md`,
`openapi/spec.yml` et `client/ts/sdk.gen.ts`. L’API expose un import binaire
asynchrone (`POST /v1/imports`, puis `GET /v1/imports/{jobId}`). La création
requiert `design:content:write`. Revalider la documentation et les formats
d’import acceptés au moment de connecter réellement le service.

## Première action du responsable

1. Ouvrir [le portail développeur Canva](https://www.canva.com/developers/apps).
2. Créer une application pour Le Vestiaire, puis activer l’intégration hors
   Canva : **Outside Canva → Start integrating → Canva REST APIs**, selon les
   indications actuelles du portail officiel.
3. Conserver l’identifiant de l’application. Générer et conserver le secret
   uniquement dans un stockage sécurisé côté serveur ; jamais dans le dépôt,
   le JavaScript du site, une capture d’écran ou une conversation.
4. Avant de renseigner l’URL de retour, choisir l’adresse HTTPS du futur service.
   L’URL du site GitHub Pages n’est pas à elle seule un serveur OAuth.

Les libellés et conditions d’accès au portail peuvent évoluer. Vérifier quels
coachs peuvent utiliser l’intégration et si une validation Canva est nécessaire.

## Service préparé, activation et validation réelles restantes

Le kit officiel impose un échange OAuth Authorization Code avec PKCE côté
serveur : le point d’échange utilise un secret client et ne peut pas être appelé
directement depuis le navigateur. Le seul site statique ne suffit donc pas.
Le service séparé est disponible dans [canva-gateway](../canva-gateway/README.md),
avec les étapes d’installation et la configuration à renseigner uniquement
sur le serveur.

- Choisir l’hébergement HTTPS ; le PC Windows prévu pour WhatsApp n’est pas
  considéré comme un service public prêt tant que Docker, disponibilité et
  accès HTTPS ne sont pas vérifiés. Garder les services et leurs secrets séparés.
- Les tests locaux vérifient l’authentification du coach et son adhésion active,
  le `state` à usage unique lié au navigateur, PKCE, le chiffrement des jetons,
  leur renouvellement et l’isolation des imports entre deux coachs.
- Les routes d’état, de connexion, de retour, d’import et de déconnexion sont
  préparées. Le site réutilise `causerieExport.build`, attend la réussite de
  l’import et ne propose que les liens d’édition renvoyés par Canva.
- Valider ces mécanismes avec les vrais comptes et paramètres de l’hébergement.
- Comparer enfin le rendu réel Canva au fichier source : chaque rubrique et
  texte, pages longues, photos, schémas, mobile, et modification des textes.

La configuration du site vise maintenant le service Render. Les tests locaux et
simulés ne valident pas un consentement ou un rendu réel dans Canva. Le premier
essai du coach après publication reste nécessaire. Le réveil Render est géré par
une reprise bornée des seules lectures de l’état de connexion ; les créations ne
sont pas répétées automatiquement. Fermer la fenêtre pendant ce réveil annule
l’intention de création, même si la réponse du serveur arrive plus tard.

## Bouton de création dans la causerie (291)

Le bouton visible « Créer / voir ma causerie dans Canva » conservait le handler de l'ancienne fenêtre de préparation. Il lance désormais `createAndOpen`, également utilisé par le raccourci personnel : l'état du compte est vérifié puis, s'il est connecté, le document courant est préparé et importé. Le lien d'édition renvoyé par Canva est proposé dans la fenêtre ; aucun onglet vide n'est ouvert pendant l'encodage.

Si le compte n'est pas connecté, le formulaire affiche une invitation explicite à cliquer sur « Connecter Canva ». Ce clic réel réserve la fenêtre OAuth synchroniquement pour éviter les blocages de popup après une vérification réseau asynchrone. Après l'autorisation, l'import demandé est lancé. L'ancien bouton purement préparatoire conserve son ouverture sans import et le helper `openPreparation` permet de tester ce parcours séparément.

Le lancement est protégé contre les clics répétés. Les erreurs qui surviennent avant l'ouverture de la fenêtre sont aussi affichées à côté des actions de la causerie et n'entraînent plus de rejet de Promise sans retour utilisateur. La préférence PPT et le brouillon restent conservés ; Canva reçoit un clone en version MP4.

`tests/canva-create-button-browser.py` clique sur le vrai bouton de l'éditeur, vérifie un import unique, l'absence d'onglet vide, l'autorisation par clic explicite puis l'import, et une erreur de préparation visible. Les requêtes du service et de Canva sont simulées. Le test premium vérifie séparément le fichier PPTX transmis avec MP4. La lecture de `/health` du service Render réel a été tentée et répétée avec accès réseau : elle est refusée par la passerelle de cet environnement avant connexion au service (CONNECT 403). Aucun résultat de disponibilité réelle ni consentement/import réel dans Canva n'est revendiqué.

## Envoi des causeries animées et fichier de secours (292)

La capture du coach montre un compte Canva connecté, puis une erreur réseau/délai dans `createPresentation` : le message précédent parlait indistinctement du réveil du service. Le frontend limitait toutes les requêtes à 30 secondes, le serveur la réception à 45 secondes et son envoi vers Canva à 30 secondes. Ce diagnostic n'établit pas à lui seul que le délai était la seule cause (un échec réseau/CORS peut produire le même TypeError).

Les POST d'import disposent maintenant de 120 secondes côté navigateur, de 120 secondes pour la réception serveur et de 90 secondes pour l'appel d'import Canva. Aucun POST n'est réessayé automatiquement, afin de ne pas créer de doublons. Le message distingue un échec d'envoi d'un réveil du service. Les changements serveur nécessitent le déploiement du nouveau commit dans Render ; la mise à jour GitHub Pages ne déploie pas elle-même le service Render. Si son Auto Deploy est actif sur main, le push le déclenche ; sinon utiliser Manual Deploy → Deploy latest commit, sans changer les variables.

Toutes les animations restent des MP4. Le bitrate cible est réduit de 3,5 à 1,5 Mbit/s sans changer les mouvements, les dimensions ou la durée. La progression de chaque vidéo est affichée, puis les étapes d'assemblage, d'envoi avec taille en Mo et d'import sont distinctes. Un watchdog interrompt un encodeur qui ne termine pas dans la durée du clip + 15 secondes et libère les pistes de capture.

La limite serveur de 20 Mo est vérifiée avant tout envoi. Si l'envoi échoue ou si le fichier dépasse la limite, le Blob PPTX déjà préparé est conservé dans la fenêtre et proposé au téléchargement via « Télécharger cette causerie animée (.pptx) ». Ce fichier embarque les MP4 réellement générés ; ce n'est pas une version statique et il ne demande pas de nouvel encodage. Son téléchargement vérifie toujours le compte/coach/équipe courant. Il permet de présenter avec PowerPoint pendant une indisponibilité de Canva ; aucun succès d'import réel Canva n'est annoncé sur cette base.

Validation : tests serveur et fallback OAuth ; test premium du fichier reçu par un service Canva simulé ; test de cinq clips H.264 avec lecture/pause/reprise et mouvements ; test d'envoi réseau interrompu avec téléchargement du même PPTX animé, limite 20 Mo, absence de retry POST, durée configurée et watchdog d'un MediaRecorder ne déclenchant jamais stop. Le service Canva réel n'est pas testé depuis cet environnement, dont la passerelle refuse sa connexion réseau.
