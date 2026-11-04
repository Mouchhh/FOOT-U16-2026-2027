# Notification d’entrée dans les bilans

Le choix modal d’entrée dans un bilan existant est remplacé par une barre intégrée au-dessus du module. Le texte et le bouton « Ouvrir le bilan » reprennent le document ; la croix masque la notification. Aucun dialogue, fond bloquant ou capture du focus n’est créé pour cette notification.

`report-entry-banner.js` conserve l’acquittement dans `sessionStorage`, séparément par coach et équipe, avec repli en mémoire si le stockage est indisponible. Une navigation entre modules conserve cet acquittement. Un rechargement de page et la déconnexion réinitialisent uniquement les clés de notification, sans effacer les données d’authentification ou les bilans. Un enregistrement réussi masque également la barre.

L’ouverture explicite utilise la version actuelle du brouillon et conserve les contrôles d’archivage et d’enregistrement. Les bilans validés restent disponibles dans leur historique. La création explicite d’un nouveau bilan conserve l’ancien avant d’ouvrir le formulaire, sans réintroduire le choix modal. Le fonctionnement des causeries est conservé.

Validation locale : `python3 tests/report-entry-banner-browser.py` et `python3 tests/document-completion-browser.py` (serveur HTTP sur le port 3016). Couvre la navigation non bloquée, l’acquittement, le rechargement, la déconnexion, la sauvegarde, les modifications récentes et les largeurs 1366/390/320 px.
