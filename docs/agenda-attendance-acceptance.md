# Étape 12 · Agenda et présences

22 octobre 2026. Parcours vérifié dans Chromium, ordinateur et téléphone.

## Agenda et duplication

- [x] Filtres combinés par semaine, catégorie et éducateur indiqué dans la fiche.
  Choisir une semaine remet à zéro le mois ; Toutes les dates efface ces deux dates.
- [x] Les filtres sont repris par la mémoire de navigation, dans l’espace du coach.
  Les documents des autres comptes restent dans Travail du club : l’agenda ne
  contourne pas les droits pour charger leurs bibliothèques personnelles.
- [x] Duplication d’une séance ou d’une semaine conservant les originaux, les contenus,
  les notes, les variantes et les horaires ; nouveaux identifiants.
- [x] Contrôle central avant écriture : équipe, catégorie, éducateur, date et heure
  identiques refusés, y compris dans un même lot. Aucun lot partiellement ajouté
  lorsqu’un conflit est détecté. Le contrôle porte sur la bibliothèque chargée ;
  ce n’est pas une contrainte d’unicité serveur entre appareils simultanément hors ligne.
- [x] Les copies ne reprennent pas les réponses de présence ni leur validation.

## Présences sans service externe

- [x] Accès depuis Groupe, date & rendez-vous → Présences de la séance.
- [x] Liste initiale issue de Mes joueurs enregistrés, ou ajout manuel par nom.
  Gardien et inclusion dans l’effectif modifiables explicitement.
- [x] Trois états distincts : Présent, Absent, Sans réponse / à confirmer.
  Aucune réponse manquante transformée automatiquement en absence.
- [x] Enregistrer les réponses conserve la liste dans le brouillon, sans changer
  l’effectif utilisé par la séance. Enregistrer ensuite la séance permet son partage.
- [x] Checkbox de vérification obligatoire avant Valider l’effectif ; toute modification
  de réponse, inclusion ou gardien annule cette confirmation.
- [x] Présents et gardiens seuls retenus après validation ; noms distincts, au moins
  deux joueurs de champ, 80 présents et 12 gardiens maximum.
- [x] Adaptation après validation, avec conservation des variantes manuelles et
  relecture des installations devenues incompatibles.
- [x] Changement de date/horaire : validation périmée signalée ; réponses remises à
  confirmer dans la nouvelle fenêtre, sans appliquer silencieusement un nouvel effectif.
- [x] Fenêtre devenue obsolète refusée si coach, séance ou rendez-vous a changé.
- [x] Échec d’écriture : effectif précédent conservé et aucune validation annoncée.
- [x] Fermeture avec réponses non enregistrées protégée ; fermeture à la déconnexion.
- [x] Réponses et validation retrouvées après rechargement ; affichage sans débordement
  horizontal sur téléphone et bouton désactivé tant que les critères ne sont pas remplis.

## WhatsApp

Le parcours existant relit les réactions du bon message avant validation et exige
une confirmation du coach. Il utilise désormais la même écriture protégée et conserve
une photographie des réponses dans la séance. Son intégration est testée avec une
passerelle simulée, pas avec les conversations réelles du club.

Le fichier de configuration de passerelle reste celui du club. Cette livraison
n’installe pas de serveur, n’associe pas un compte WhatsApp et n’affirme pas que
la lecture automatique des groupes réels est active. La saisie manuelle fonctionne
indépendamment de cet hébergement.

## Tests exécutés

```sh
node --check agenda-attendance.js
node --check coach-planning.js
node --check training.js
node --check whatsapp-attendance.js
python tests/agenda-attendance-browser.py
python tests/club-completion-browser.py
python tests/whatsapp-attendance-browser.py
python tests/workspace-navigation-browser.py
python tests/training-builder-browser.py
python tests/club-network-browser.py
```

Le test dédié combine semaine/catégorie/éducateur, marque trois présents dont un
 gardien, un absent et une réponse manquante, enregistre sans adapter, recharge,
refuse une validation après modification, simule un stockage plein puis valide.
Il vérifie aussi la conservation dans la bibliothèque, les copies sans réponses,
les doublons, le changement de date et le format téléphone.

Les tests Supabase sont simulés. Aucun compte réel, groupe WhatsApp ou document
réel n’a été modifié par les tests ; aucune migration SQL ajoutée. L’état de présence
validé est celui vérifié par le coach à cet instant, pas une garantie de disponibilité
future ni une écoute permanente de la conversation.
