# Séances, agenda et accueil : cohérence des données

La prochaine séance est choisie dans l’agenda canonique de l’équipe active, avec l’heure de Paris. Les créneaux récurrents à préparer comptent autant que les créneaux confirmés. Le widget ouvre le document préparé lorsqu’il existe ; sinon il prépare directement le rendez-vous choisi. Un nouveau formulaire utilise le prochain créneau non préparé. Les champs restent modifiables par le coach.

`agendaLink` conserve l’identifiant stable de l’occurrence, la date et l’heure. Enregistrer une préparation rattachée au calendrier remplace la représentation du créneau, sans ajouter un autre événement. Les déplacements d’une occurrence récurrente sont suivis par son identifiant. Une seconde préparation indépendante au même créneau est refusée plutôt que d’écraser un document. Les anciens doublons éventuels restent conservés en bibliothèque mais ne sont affichés qu’une fois dans le calendrier.

Chaque carte de Mes séances propose Supprimer, puis une confirmation en ligne. La suppression retire la séance enregistrée et annule seulement son occurrence récurrente liée ; les autres semaines sont conservées. Si le deuxième stockage échoue, la première écriture est restaurée. Les données d’un autre éducateur ou d’une autre équipe ne sont pas ciblées.

L’accueil lit ces mêmes événements et les bilans validés. La présence du groupe est une barre compacte sous les widgets. Le classement et les confrontations sont décrits dans `docs/home-fff-standings.md`.

Vérifications : `tests/training-agenda-coherence-browser.py`, `tests/home-live-widgets-browser.py`, tests de l’assistant (génération, sauvegarde et réinitialisation).
