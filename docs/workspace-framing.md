# Cadrage automatique des vues

`workspace-framing.js` est chargé après les contrôleurs existants. Il centralise le défilement des sept modules, des sous-onglets, des raccourcis et des changements de vue programmatiques. Les appels historiques de navigation délèguent désormais au même contrôleur.

Deux `requestAnimationFrame` laissent le module afficher sa destination avant de mesurer sa position. La cible est le début du module pour un menu principal, ou le panneau actif pour un sous-onglet. Les panneaux internes visibles sont remis en haut. Le décalage tient compte des en-têtes réellement fixes ou collants, avec une marge de 12 px. Sur une page courte, le navigateur limite naturellement le défilement à la hauteur disponible.

```js
// Navigation principale (après activation du module)
workspaceFraming.request({ scope: 'main' });
// Sous-onglet actif
workspaceFraming.request({ scope: 'sub' });
// Raccourci vers un panneau précis du module actif
workspaceFraming.request({ target: document.getElementById('mon-panneau') });
```

Les demandes concurrentes sont regroupées. Le contrôleur résout la destination au moment du défilement et attend la fermeture d'une modale de choix. La fermeture d'une modale ordinaire ne provoque aucun recentrage. Les frappes, déplacements de joueurs et modifications de champs ne constituent pas des changements de vue. Une interaction manuelle interrompt un défilement en cours ; le focus d'une validation de formulaire reste prioritaire.

Le mouvement est fluide par défaut et immédiat lorsque `prefers-reduced-motion: reduce` est activé. `workspace-framing.css` définit les marges communes sans modifier l'identité visuelle ni rendre le menu fixe.

Les boutons précédent/suivant du navigateur conservent la destination et les filtres ; le panneau retrouvé s'ouvre désormais en haut conformément à la nouvelle règle, plutôt qu'à son ancienne position de lecture. Aucune donnée de séance, composition ou bilan n'est modifiée.

Diagnostic : `workspaceFraming.current()` donne le module actif ; `workspaceFraming.getState()` renvoie la phase, la cible, le décalage, la position demandée et la révision. `workspaceFraming.cancel()` interrompt une demande.

Vérification navigateur : `python tests/workspace-framing-browser.py` avec le serveur local sur le port 3016. Tests complémentaires : `tests/document-entry-browser.py`, `tests/composition-player-picker-browser.py`, `tests/training-sections-browser.py`, `tests/agenda-calendar-browser.py`.
