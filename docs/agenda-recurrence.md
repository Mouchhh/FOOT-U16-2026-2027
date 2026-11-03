# Récurrences persistantes dans l’Agenda

Le coach configure jusqu’à vingt créneaux hebdomadaires (jour, heure, type, nom et état) dans **Ma semaine type**, avec une date de démarrage et aucune date de fin. Les récurrences restent actives jusqu’à une modification ou un arrêt explicite. La règle est conservée par coach et par équipe sur cet appareil, dans `vestiaire-agenda-week-template` ; aucun contenu de séance vide n’est enregistré automatiquement et cette règle locale n’est pas publiée au club.

## Stockage et projection

Le format version 2 conserve des versions datées des créneaux :

```js
{
  version: 2, revision: 1, scope: 'persistent', enabled: true,
  from: '2026-11-03', to: null, category: 'U17',
  slots: [{id: 'version-uuid', seriesId: 'series-uuid',
    from: '2026-11-03', to: null, day: 2, type: 'training',
    time: '19:00', title: 'Entraînement', status: 'pending',
    category: 'U17', location: ''}],
  statuses: {}, exceptions: {}, templateSlots: []
}
```

`to: null` signifie que le créneau n’expire pas. La projection calcule uniquement la période consultée : les semaines entourant le mois affiché, la semaine filtrée ou, pour la vue Tout, le mois précédent et l’année suivante. Cette fenêtre d’affichage est expliquée dans l’interface et ne termine jamais la règle : sélectionner un mois dans plusieurs décennies génère les rendez-vous correspondants. Un appel de projection est borné à 800 jours pour protéger le navigateur, sans limitation de la durée d’existence de la règle.

Le calendrier garde sa période de projection pendant la reconstruction de son DOM : le sélecteur de mois est momentanément détaché lors du rendu. Les rappels demandent explicitement la période d’aujourd’hui/demain, indépendamment du mois consulté.

Les dates sont calculées en UTC ; les horaires restent des heures locales littérales, sans décalage lors des changements d’heure. Les identifiants d’occurrence sont stables : `recurring:<id de version>:<date d’origine>`. Les exceptions déplacées sont recherchées aussi dans leur mois de destination.

## Modifier ou supprimer

Depuis la fiche, le clic droit, les actions ou un déplacement par glisser-déposer, un formulaire propose :

- **Cette occurrence uniquement** : modification datée ou suppression individuelle dans `exceptions`. La règle et les autres rendez-vous restent inchangés. Le bouton de rétablissement de l’agenda permet de rétablir ces suppressions individuelles.
- **Toutes les occurrences futures de ce créneau** : l’ancienne version s’arrête la veille de la date effective ; une nouvelle version sans fin prend le relais, ou aucune nouvelle version n’est ajoutée pour un arrêt. Le début effectif est au plus tôt aujourd’hui, à la première date concernée entre le rendez-vous affiché et sa nouvelle date : avancer un mardi au lundi inclut bien le lundi choisi. Pour une suppression, il s’agit de la date affichée du rendez-vous choisi, y compris s’il a été déplacé. Les autres séries et les dates passées restent conservées. Un changement de jour commence à la date choisie, sans ramener de rendez-vous dans le passé.

Modifier la semaine complète s’applique à la date indiquée dans **À partir du**. Les versions et exceptions antérieures sont conservées. Un créneau inchangé sans fin garde son identifiant ; les futures exceptions des versions remplacées ne s’appliquent pas à leur nouvelle version. Les séances et rencontres déjà enregistrées ne sont jamais déplacées ni supprimées par une modification de règle. Réactiver après un arrêt propose les derniers réglages saisis, à vérifier avant l’enregistrement.

Une séance réelle de même date, catégorie et horaire remplace le rendez-vous générique. Une rencontre réelle remplace le créneau de match du même jour/catégorie. Confirmer un rendez-vous ne crée ni ne valide un contenu de séance.

## Compatibilité, intégrité et interface

Les anciens réglages actifs version 1 sont interprétés comme persistants, avec leurs identifiants et statuts conservés. Leur ancienne fin de mois/saison ne limite plus la récurrence. Les anciennes données restent intactes jusqu’à une modification enregistrée. Une ancienne récurrence désactivée reste arrêtée pour l’avenir ; ses réglages sont proposés pour une reprise manuelle. Les anciennes exceptions de l’agenda continuent à être prises en compte. Une exception déjà déplacée dans le passé est conservée dans un instantané indépendant (`frozen`) si sa version de série est remplacée ; une modification future ne la fait pas disparaître. Une exception déplacée du passé vers l’avenir est traitée à sa date affichée, sans réapparition à son ancienne date.

Les écritures vérifient la révision avant enregistrement ; un échec de stockage conserve la version antérieure. Le formulaire protège les saisies non enregistrées. Les limites de taille protègent le stockage local sans arrêter automatiquement une règle : 2 000 versions de créneaux, 20 000 statuts et 20 000 exceptions au maximum. Les doublons du formulaire, chevauchements de versions d’une même série et données invalides sont refusés.

Les couleurs validé/en attente sont conservées, avec bleu/blanc dominant et rouge du club `#e41f28` pour les actions d’accentuation. Les fermetures utilisent les boutons originaux, transformés en croix extérieure rouge par `external-modal-close.js`. La sidebar et la barre mobile sont inchangées.

## Vérifications

`tests/agenda-recurrence-browser.py` vérifie la persistance jusqu’en 2040/2045, la migration, les modifications/suppressions individuelles et futures, les historiques, les déplacements entre années, les statuts, le dédoublonnage, les rappels indépendants de la vue, les quotas, les révisions concurrentes et le mobile. Les tests des équipes, du compte, du calendrier, des actions et du glisser-déposer couvrent les intégrations existantes.
