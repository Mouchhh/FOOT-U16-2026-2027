# Bilan quotidien gratuit, sans appel à une IA

Le workflow `.github/workflows/daily-report.yml` prépare un récapitulatif Git de la veille à 8 h 30, Europe/Paris. GitHub peut retarder les exécutions. Deux horaires UTC permettent de couvrir été et hiver ; un seul envoie le rapport. Une relance manuelle peut renvoyer un e-mail : vérifier la boîte avant de relancer.

## Ce qui est réellement disponible

Le résumé de l'exécution GitHub contient les commits de main datés de la veille et les limites du rapport. Aucun agent IA n'est exécuté. Les conversations ChatGPT, tests locaux et validations humaines ne sont pas collectés automatiquement. Les pôles sans rapport sont explicitement signalés. Le bilan ne constitue pas une preuve de déploiement.

## Activer l'e-mail sans nouveau service payant

Une boîte Gmail existante peut envoyer le message avec un mot de passe d'application, si cette fonctionnalité est disponible sur le compte. Activer la validation en deux étapes puis créer un mot de passe d'application dans les paramètres de sécurité Google. Ne pas utiliser le mot de passe habituel. Certains comptes ne permettent pas les mots de passe d'application ; dans ce cas, laisser l'envoi désactivé plutôt que désactiver les protections du compte.

Dans GitHub → dépôt → Settings → Secrets and variables → Actions → Secrets, créer :

| Secret | Valeur à saisir uniquement dans GitHub |
|---|---|
| REPORT_SMTP_HOST | smtp.gmail.com |
| REPORT_SMTP_USER | Adresse Gmail d'envoi |
| REPORT_SMTP_PASSWORD | Mot de passe d'application Google |
| REPORT_FROM | Même adresse Gmail d'envoi |
| REPORT_TO | Adresse du destinataire choisie par le propriétaire |

Dans l'onglet Variables, créer `REPORT_EMAIL_ENABLED` avec la valeur `true` uniquement après configuration. Aucun destinataire ni identifiant n'est enregistré dans le dépôt.

Dans Actions → « Bilan quotidien — 8 h 30 Paris » → Run workflow : faire un essai, vérifier le résumé et la réception du mail, y compris les indésirables. Un envoi accepté par le serveur SMTP ne garantit pas la livraison finale.

## Gratuité et arrêt

Aucun appel API IA, serveur supplémentaire ou abonnement payant n'est configuré. Vérifier les quotas et paramètres de facturation GitHub du compte : pour un dépôt privé, le temps Actions consomme le quota inclus. Ne pas activer de dépassement payant. Sur les dépôts publics, GitHub peut désactiver les tâches programmées après une période d'inactivité.

Pour arrêter les e-mails, mettre `REPORT_EMAIL_ENABLED=false`. Pour arrêter toutes les exécutions, désactiver le workflow dans Actions. Les résumés GitHub héritent de la visibilité du dépôt : ne jamais mettre d'informations clients privées dans les messages de commit.
