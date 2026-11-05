# Continuité Causerie → Bilan et synthèse compacte

Dans « Le match », le sélecteur liste les causeries enregistrées de l’équipe active, avec leur titre uniquement. Il n’exige plus d’avoir déjà renseigné la bonne date et le bon adversaire dans le bilan pour les rendre accessibles. Les documents tactiques, pions, effectifs et documents d’autres équipes sont exclus. Les anciennes archives sans marqueur de validation restent compatibles ; lorsqu’un marqueur est présent, il doit être valide.

La sélection charge immédiatement la date, l’adversaire, le système, la liste des joueurs et les consignes. L’instantané est conservé dans `report.preparation`, avec `sourceCompositionId` et `sourceTitle`. Les objectifs déjà évalués et les statistiques existantes du même match restent conservés. Le contrôle « Actualiser depuis la causerie » reste disponible pour une actualisation explicite.

Une causerie unique correspondant au match ouvert est liée automatiquement. Sur un bilan sans données d’après-match, la causerie enregistrée actuellement ouverte ou l’unique causerie disponible peut aussi être reprise automatiquement. Le changement de source sur un bilan encore vierge retire la composition et la priorité héritées de l’autre match avant d’importer la nouvelle source.

Avant de créer un nouveau bilan, le système recherche un bilan enregistré pour le même match et la même équipe ; le lien de source est prioritaire. Une correspondance unique reprend ce bilan, y compris son identifiant, son score et ses statistiques. Plusieurs correspondances demandent de reprendre explicitement le bilan souhaité. Un bilan déjà renseigné ne peut pas être réaffecté à un autre match par le sélecteur : l’utilisateur doit ouvrir un nouveau bilan. Les données ne sont pas écrasées.

La liaison n’est installée dans l’état courant qu’après la réussite de l’écriture du brouillon. Un échec de stockage laisse le bilan précédent intact. Les contrôles de contexte coach, équipe et identifiant du bilan restent appliqués.

## Synthèse

Le groupe occupe une carte pleine largeur, en trois colonnes de lignes compactes sur grand écran, deux sur tablette et une sur téléphone. Les numéros restent classés dans l’ordre ; noms, minutes, buts et passes restent visibles. Les noms complets restent accessibles dans l’infobulle et en impression. Aucun défilement interne n’est ajouté.

Le cadre « Pour la suite / Pour la prochaine séance » est supprimé de la synthèse et de son PDF. Les champs d’analyse et les priorités renseignées sont conservés dans les données. Si un message au groupe existe, il est restitué en simple texte sans cadre.

Score final, score à la mi-temps, repères du match, analyse, chronologie et bouton d’impression/export restent disponibles. Le PDF utilise le même rendu, avec toutes les lignes du groupe.

Tests locaux (serveur port 3016) :

- `tests/report-causerie-continuity-browser.py` : import au changement, passage entre deux sources vierges sans mélange de joueurs, reprise d’un bilan enregistré, protection du bilan déjà renseigné, groupe de 14 joueurs et mobile.
- `tests/report-causerie-import-browser.py` : conservation des statistiques/observations, filtrage d’équipe, réimport sans doublons, échec de stockage sans mutation, barre d’actions et absence de débordement sur 320 px.
- `tests/report-summary-dashboard-browser.py` : groupe, scores, analyse, suppression du cadre, export PDF réel et intégrité des anciennes données de priorité.
