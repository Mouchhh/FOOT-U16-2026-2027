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
