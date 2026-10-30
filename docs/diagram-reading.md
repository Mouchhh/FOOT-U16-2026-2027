# Lire les actions des schémas

La démonstration affiche une légende visuelle, lisible sur téléphone : trait plein
pour une passe/frappe, pointillés pour une course sans ballon, ondulation pour
une conduite. La forme du trajet porte le sens, même sans distinguer les couleurs.

Un repère sous la progression indique le départ puis les actions avec les numéros
réels des joueurs : passe entre deux numéros, conduite, frappe, contrôle,
interception et courses associées. Les coureurs sont tirés des déplacements de
l’action illustrée ; le porteur en conduite n’est pas décrit comme courant sans
ballon. Les actions simultanées restent montrées ensemble.

Une interception en cours n’est pas présentée comme une possession déjà acquise.
Lorsque l’animation entre effectivement dans sa phase de transition, le repère
nomme l’équipe en possession et celle qui doit réagir à la perte. Le bouton
Installation restaure les numéros de départ et ne change pas la séance.

Le déclencheur de la situation est visible dans le texte de départ de l’animation.
La **Fiche terrain** distingue également **Départ** et **Déclencheur** dans le
brief, à partir des repères de l’exercice et de la variante sélectionnée.

Ces ajouts n’écrivent ni les positions ni les consignes personnelles. Ils ne
changent pas la chorégraphie, et la copie imprimable garde son installation.

## Vérifications

- `node tests/diagram-reading.js` : 810 démonstrations, 4 652 lectures d’action,
  effectifs 6, 10 et 18 et zéro, un ou deux gardiens. Numéros existants, séparation
  porteur/coureurs, interception avant possession, rôle après récupération et
  absence de modification du plan.
- `python3 tests/diagram-reading-browser.py` : légende SVG réelle, actions
  numérotées, tracés distincts, changement de rôle, impression inchangée, remise
  au départ et absence de débordement à 320, 390 et 1 280 pixels.
- `tests/bible-pedagogical-motion-browser.py` : trajectoire aérienne, réception
  après appel, départ gardien, variantes et lecture mobile.
- `tests/training-stages-field-browser.py` : ateliers et lecture terrain toujours
  fonctionnels avec les nouveaux repères.

Les deux suites Canva d’export et de connexion passent également : PPTX généré,
textes exacts, pagination et schémas, puis parcours de connexion/import simulé.
Elles n’accèdent pas au vrai compte Canva et ne valident donc pas le rendu après
un import réel. Cette étape nécessite une présentation importée dans le compte
concerné et la comparaison des slides avec la causerie source.
