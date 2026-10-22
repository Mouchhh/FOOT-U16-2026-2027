# Étape 17 · El crakito del club

22 octobre 2026. Vérifications navigateur Chromium, comptes Supabase simulés et
propositions locales. Aucun document ni droit du projet de production modifié.

## Aide exacte et provenance

- [x] L’assistant se présente comme une aide locale guidée : aucun modèle ChatGPT
  embarqué, recherche Internet, réentraînement ou service API prétendu.
- [x] Guides actualisés : présences avec effectif confirmé, états de sauvegarde,
  récupération, repères validés par pôle, exports et séparation du projet ChatGPT.
- [x] Recherche des guides par début de mot : « âge » ne correspond plus à
  « partage ». La question d’export de composition ouvre le terrain approprié.
- [x] Les objectifs libres saisis dans le dialogue sont conservés dans l’aperçu.
  Une correspondance explicite avec les thèmes du catalogue guide la proposition.
  Si aucun thème n’est reconnu, les thèmes existants sont annoncés comme conservés.
- [x] Les suggestions locales sont étiquetées comme propositions à relire, sans
  validation automatique. Les renvois au référentiel permettent d’ouvrir son texte
  et ses pages ; ils ne prétendent pas prouver l’interprétation sportive.
- [x] Une réponse inconnue reste inconnue : pas d’invention de faits de match,
  de personnes, de pages du référentiel ou d’homologation fédérale.

## Documents autorisés

- [x] Base commune accessible après authentification seulement. Lecture via les
  règles existantes du serveur ; auteur, version et date affichés.
- [x] Résumé présenté comme des extraits sans analyse IA. Le temps de déroulé d’une
  séance compte aussi l’installation, distinct de sa durée prévue.
- [x] Consultation du document en lecture seule, sans changer le brouillon actif.
  Le statut de repère est relu côté serveur avant le plein aperçu ; une information
  indisponible n’est pas transformée en validation sportive.
- [x] Référentiel importé conservé dans le stockage du coach, sans héritage d’un
  autre compte. Les anciens fichiers du profil local historique ne sont pas supprimés.
- [x] Déconnexion/révocation : conversation, aperçus, prompts et propositions vidés.
  Une réponse retardée ne peut pas réafficher un document après le départ du compte.
  Un refus d’accès à un document ferme immédiatement la session de l’assistant.
- [x] Les textes de document contenant des instructions ou du HTML restent des
  contenus à lire : ils ne sont ni exécutés ni traités comme un droit de validation.

## Proposition avant application

- [x] Séance locale : aperçu, comparaison du coach, du document, du contenu, du
  groupe, de l’objectif, de la date et du référentiel avant application.
- [x] Réponse importée : JSON et catalogue contrôlés, pages/sections existantes,
  durée exacte ; interprétation des citations explicitement à relire.
- [x] Changement de contexte ou de document : proposition obsolète refusée.
- [x] Application via remplacement protégé du brouillon, avec récupération de sa
  version précédente. Échec de stockage : document précédent conservé et proposition
  toujours disponible. Le formulaire retourne désormais réellement l’échec d’écriture.
- [x] Les notes ne sont plus tronquées silencieusement lors de l’application d’une
  proposition externe : dépassement de limite signalé avant remplacement.
- [x] Bilan proposé à partir de quatre champs remplis par le coach : avec ballon,
  sans ballon, priorité, critère observable. Aperçu avant/après ; seuls les champs
  renseignés sont remplacés. Aucun score, adversaire ou fait inventé.
- [x] Aucune application ne partage automatiquement la séance ou le rapport : il
  faut encore relire puis Enregistrer dans sa bibliothèque.

## Tests exécutés

- `tests/club-assistant-browser.py` : guides, limites, trame, navigation, aperçu,
  question inconnue, HTML inerte, mobile et clavier.
- `tests/assistant-review-browser.py` : objectif libre, contexte périmé, quota,
  récupération, citation inventée refusée, application locale/externe et rapport.
- `tests/assistant-shared-safety-browser.py` : deux comptes, référentiel séparé,
  auteur/version, texte hostile inerte, lecture seule, réponse après déconnexion,
  restauration du référentiel à son propriétaire et révocation immédiate.
- `tests/club-network-browser.py` : documents autorisés, résumé/aperçu commun,
  partage, conflits, déconnexion et retrait d’accès.
- `tests/training-learning.js` et `tests/training-learning-browser.py` : profils
  de groupe et propositions adaptées. Fixtures de navigation/panneau approfondi
  actualisées, sans changement des attentes pédagogiques.
- `tests/save-reliability-browser.py` : reprise des sauvegardes après refus d’écriture.
- `tests/site-final-browser.py` : parcours et affichages ordinateur/tablette/mobile.

## Limites explicites

Ce travail n’ajoute pas de service LLM distant. Le lien du projet ChatGPT ouvre un
service séparé ; les documents ne lui sont pas envoyés automatiquement. Copier une
demande y transmet son contenu seulement si le coach choisit de le coller.

Les champs du référentiel et les pages sont vérifiés structurellement, pas par
comparaison au PDF original ou certification fédérale. Un hash déclaré dans un
fichier importé ne prouve pas sa provenance. La pertinence des interprétations et
la réalisation de la séance restent à valider par le coach sur le terrain.
Les extraits autorisés ne constituent pas une analyse exhaustive du travail du club.

Le stockage local n’est pas un chiffrement de l’appareil. Les tests d’accès sont
simulés ; l’essai avec les comptes réels du club reste à effectuer. Aucune nouvelle
migration Supabase, clé API ou manipulation dans Canva nécessaire pour cette étape.
