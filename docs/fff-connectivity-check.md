# Vérification de l’intégration FFF

Les requêtes HEAD vers la page officielle du classement et vers l'hôte api-dofa.fff.fr ont été tentées, puis répétées avec demande d'accès réseau. Elles échouent au CONNECT de la passerelle de cet environnement : HTTP 403, serveur `envoy`. Il ne s'agit pas d'une réponse exploitable du serveur FFF. Les en-têtes X-Frame-Options et Content-Security-Policy de la FFF n'ont pas pu être consultés ; aucune conclusion positive ou négative sur l'encadrement n'est tirée. Aucun flux partenaire ou droit d'accès API n'a été confirmé.

La capture du coach établit séparément que le relais Supabase a reçu un HTTP 403 lors de sa demande à la FFF. Elle n'indique pas la raison exacte de ce refus et ne démontre pas à elle seule qu'un accès partenaire est obligatoire.

`fff-integration-check.html` est un diagnostic indépendant, sans modification de l'accueil ou des profils. À l'initiative de l'utilisateur, il effectue depuis le navigateur :

- une lecture CORS publique, avec `credentials: omit`, délai de 12 secondes et limite de 4 Mo ;
- un affichage de la même page dans un iframe sandboxé, sans autoriser la navigation du parent.

La visibilité du véritable tableau est confirmée manuellement : l'événement load d'un iframe peut aussi se produire en cas de blocage et n'est jamais considéré comme une réussite. Un échec fetch de type réseau/CORS reste décrit comme ambigu. Les résultats restent dans la page, sans stockage, télémétrie ni envoi de secrets. La page teste le lien U17 fourni par le coach ; ce n'est pas une nouvelle source de données ni une preuve d'autorisation d'utilisation.

Si la lecture est autorisée avec un tableau reconnu, une récupération directe dans le navigateur devient techniquement envisageable. Si seul le cadre est visible, un affichage officiel intégré est techniquement envisageable dans ce navigateur. Si les deux échouent, un flux autorisé ou une solution proposée par la FFF/le District devra être étudié. La page ne prétend pas avoir vérifié ces résultats réels.

`tests/fff-integration-check-browser.py` vérifie, avec des réponses simulées, la séparation entre lecture et cadre, l'absence de succès sur simple load, la confirmation visuelle, le refus HTTP 403 et la remise à zéro d'un nouveau test.
