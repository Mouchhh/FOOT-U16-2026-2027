# Suppression directe d’une rencontre depuis le calendrier

Un clic droit sur une rencontre la retire immédiatement de l’agenda : aucun
menu intermédiaire ni confirmation. Le clic gauche conserve l’ouverture de la
préparation. Les cellules vides, séances et bilans ne sont pas concernés.
Dans la fiche du jour ou la vue liste, un bouton « Supprimer » donne la même
action, notamment sur téléphone.

Les rencontres sont retirées de cet agenda, pas détruites dans leur source :
les calendriers fournis au site, les imports, compositions et causeries restent
conservés. Le réglage utilise le stockage existant isolé par coach et persiste
sur cet appareil (`vestiaire-agenda-removed-matches`). Il n’est pas synchronisé
avec les autres appareils du coach. Un autre éducateur n’est pas affecté.

Le bouton « Rétablir les rencontres (N) », visible après une suppression,
annule les suppressions de ce coach sur l’appareil. Aucun panneau de gestion
supplémentaire n’est ajouté au calendrier.

La clé de provenance relie une rencontre commune/importée à sa préparation pour
éviter qu’elle ne réapparaisse comme doublon. Une préparation manuelle possède
une clé de document et une empreinte de rencontre ; retirer un brouillon puis
l’enregistrer ne fait pas réapparaître le même match. Une écriture impossible
conserve la rencontre à l’écran et affiche une explication.

## Vérification

`tests/agenda-match-actions-browser.py` : clic droit sans dialogue/menu,
suppression directe, persistance, restauration, sources et documents intacts,
préparation sauvegardée, brouillon manuel puis sauvegarde, téléphone, quota,
isolation du calendrier de Hugo.

`tests/agenda-calendar-browser.py` et `tests/agenda-paste-browser.py` passent.
