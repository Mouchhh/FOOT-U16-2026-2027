# Semaine type personnelle dans l’Agenda

L’Agenda propose un bouton **Ma semaine type** et, tant qu’aucun réglage n’existe, un encadré « Quand ont lieu vos séances ? ». Aucune récurrence n’est créée avant un enregistrement explicite.

Le coach ajoute jusqu’à vingt créneaux : jour, horaire, type (entraînement, match, séance vidéo ou réunion), nom facultatif et état (à préparer/en attente ou confirmé). Il choisit le mois affiché, la saison juillet–juin ou des dates personnalisées, dans une période maximale de 400 jours. Une option met la récurrence en pause sans effacer les réglages ni les rendez-vous réels.

## Données et génération

`agenda-recurrence.js` conserve un seul modèle de semaine dans la clé coach-scopée `vestiaire-agenda-week-template`. Les réglages sont persistants **sur cet appareil** ; cette clé n’est pas publiée ni synchronisée au club. Aucune fiche de séance vide n’est créée dans la bibliothèque.

```js
{
  version: 1, revision: 1, enabled: true, scope: 'season',
  from: '2026-07-01', to: '2027-06-30', category: 'U17',
  slots: [{id: 'uuid', day: 2, type: 'training', time: '18:30',
           title: 'Collectif', status: 'pending'}],
  statuses: {} // confirmations ou attentes propres à une occurrence
}
```

`agendaRecurringOccurrences(plan)` génère les rendez-vous à l’affichage. Les dates sont calculées avec les fonctions UTC du calendrier, tandis que les horaires restent des heures locales littérales : 18:30 reste 18:30, y compris lors du changement d’heure. Les identifiants sont stables : `recurring:<créneau>:<date d’origine>`.

Une séance enregistrée au même horaire et à la même date/catégorie remplace le créneau généré. Pour un match, une rencontre réelle du même jour/catégorie prend la place du rendez-vous générique même si l’horaire a été précisé ou modifié. La source et les préparations réelles ne sont jamais réécrites.

Les suppressions, modifications et déplacements individuels réutilisent les exceptions déjà disponibles dans l’agenda. Leur clé stable conserve l’exception après un rechargement ou une modification de la série qui contient encore cette occurrence. Une suppression d’occurrence n’efface pas le créneau hebdomadaire.

## États et actions

Les rendez-vous en attente sont blancs avec une bordure pointillée bleue. Les rendez-vous créés/confirmés gardent leur palette par type, avec une bordure pleine. Les libellés et la légende complètent la couleur. Une préparation de match ouverte qui est identique à sa copie enregistrée est considérée comme enregistrée ; une version modifiée reste en attente.

Un clic sur un rendez-vous récurrent ouvre sa fiche : confirmation ou retour en attente pour cette seule occurrence, préparation d’une séance ou d’un match, et accès au réglage global. Préparer une séance crée un brouillon daté via la sauvegarde de récupération existante ; elle n’est pas ajoutée automatiquement aux séances enregistrées. La confirmation d’un créneau ne signifie pas validation de son contenu ni approbation par le club.

Le formulaire protège les changements non enregistrés et les conflits de révision. Une erreur d’écriture conserve le modèle antérieur. Les jours/horaires incomplets, les doublons exacts et les périodes invalides sont refusés.

`agenda-recurrence.css` reprend le bleu et blanc du site. Les modales utilisent les contrôles de fermeture originaux, stylés automatiquement par `external-modal-close.js` : croix extérieure rouge `#e41f28`, zone tactile de 44 px. La navigation latérale ou inférieure reste inchangée.

Vérification : `tests/agenda-recurrence-browser.py` couvre création explicite, mois/saison, statuts, persistance, dédoublonnage réel, exception individuelle et préparation à la date modifiée, changement d’heure, année bissextile, quota, pause, révisions concurrentes, séparation entre coachs et mobile. Les tests calendrier, actions et glisser-déposer existants restent exécutés.
