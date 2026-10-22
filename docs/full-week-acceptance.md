# Parcours complet — réception logicielle du 22 octobre 2026

## Chaîne effectivement rejouée

Les deux scénarios utilisent les boutons et champs du site, dans deux profils
locaux séparés. Les tests ne modifient pas directement les documents pour passer
une étape. Seule l'identité locale de test est préparée avant ouverture du site.

| Scénario | Configuration | Parcours réussi |
|---|---|---|
| Découverte | U15, 6 joueurs, 0 gardien, 1 366 × 900 | Préparation manuelle, Bible, séance de 60 minutes, agenda, composition, bilan essentiel, priorité puis nouvelle séance |
| Confirmé | Seniors, 12 joueurs dont 1 gardien, 1 024 × 768 | Même chaîne, activation adaptée explicitement en deux ateliers de six, plan d'action détaillé puis nouvelle séance |

Dans chaque scénario :

1. Renseigner équipe, catégorie, niveau, durée et titre ; faire Suivant puis
   Précédent et retrouver les valeurs.
2. Choisir la création manuelle, date/heure, groupe, terrain et objectif.
3. Ajouter activation, conservation avec appui et retour au calme depuis la Bible.
   Ajuster à 60 minutes, installation comprise. Le test confirmé traite le refus
   d'un format trop nombreux en créant une variante en ateliers, sans supprimer la limite.
4. Enregistrer deux fois : une seule fiche, sans doublon. Recharger le site.
5. Retrouver la séance dans la bonne semaine de l'agenda puis l'ouvrir.
6. Configurer la catégorie de la composition, renseigner la préparation du match,
   l'adversaire et un objectif, puis enregistrer la composition.
7. Créer le rapport : la préparation, les objectifs et l'effectif sont mémorisés.
   Saisir le score, une priorité et son critère observable ; enregistrer.
8. Examiner les propositions du bilan, choisir « Créer la prochaine séance »,
   sa date et son horaire, puis ajouter l'exercice retenu.
9. Compléter le déroulé et l'enregistrer. Le document de la première semaine reste
   strictement inchangé dans la bibliothèque. La nouvelle séance a son propre ID.
10. Recharger : retrouver le suivi depuis le rapport, ouvrir la séance liée puis
    la retrouver dans la semaine suivante de l'agenda. Le critère du bilan est conservé.

Preuve : `python tests/full-week-journey-browser.py`.

## Ruptures corrigées

Le passage du bilan à la séance ne doit plus être ambigu quand le brouillon actif
est encore celui d'avant le match. Le dialogue propose une destination explicite :
compléter le brouillon en cours ou créer une fiche indépendante datée.
Si la préparation active date du jour du match ou d'avant, la nouvelle séance est
proposée par défaut. Le coach peut encore choisir volontairement la préparation
actuelle ; une indication signale si sa date ne suit pas le match.

La nouvelle fiche reprend les paramètres du groupe et du terrain, pas les exercices,
les réponses de présence, les marqueurs de validation sportive ou les notes précédentes.
Elle reçoit les priorités choisies, leurs sources et critères de réussite. Son
effectif reste prévisionnel, à confirmer pour le nouveau rendez-vous.

La date de la nouvelle séance doit suivre un match daté. L'application garde
l'ancienne préparation dans la récupération avant de remplacer son brouillon.
Les documents enregistrés restent indépendants. Rien n'est publié dans la
bibliothèque ou le club avant l'enregistrement explicite de la nouvelle séance.

Un bilan ou une séance modifiés pendant l'aperçu, même sous le même ID, bloquent
l'application d'une proposition périmée. Échec de récupération ou d'écriture : le
brouillon ouvert reste conservé et le dialogue permet de réessayer.
La création manuelle d'une séance vierge utilise désormais le même remplacement
protégé au lieu de remplacer directement le document en mémoire.

Preuves complémentaires : `report-training-destination-browser.py` (annulation,
date, modifications pendant l'aperçu, quota, récupération, présences non copiées,
rechargement et mobile), `report-training-browser.py`, `match-followup-browser.py`,
`training-builder-browser.py`, `workspace-navigation-browser.py` et
`exercise-board-browser.py`.

## Essai humain et connecté restant à réaliser

Ces scénarios automatisés ne constituent ni une semaine réalisée avec des
éducateurs, ni un essai Supabase sur deux appareils. Les profils « découverte »
et « confirmé » décrivent les réglages testés, pas des personnes ayant participé.
Les essais d'authentification ont leur recette séparée ; ce parcours utilise le
mode local et n'envoie pas de documents au projet du club.

Faire réaliser la chaîne ci-dessus à un éducateur débutant puis à un éducateur
expérimenté, avec leurs comptes et leurs contenus de test. Relever :

- les étapes comprises sans aide et les endroits où une aide est demandée ;
- les clics ou défilements inutiles, champs difficiles à retrouver et termes ambigus ;
- la durée réelle de préparation, les exercices adaptés et le contenu retrouvé après reconnexion ;
- le statut exact de l'enregistrement partagé et la visibilité depuis le second appareil.

Noter date, coach testeur, navigateur et corrections demandées. La réception
humaine reste ouverte jusqu'à ce retour. Le chantier suivant porte sur les données
réelles et les conflits entre appareils, selon [la checklist finale](reception-finale.md).
