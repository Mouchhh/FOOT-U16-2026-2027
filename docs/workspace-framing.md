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

## Navigation responsive persistante

`workspace-sticky.css` et `workspace-responsive-navigation.js` remplacent le menu collant supérieur par un seul menu détaché : barre latérale gauche à partir de 1100 px avec souris, barre inférieure sur téléphone et tablette tactile (y compris grand écran). Les sept boutons existants et leurs gestionnaires sont conservés. Des icônes SVG décoratives complètent les libellés accessibles.

Le menu est déplacé directement sous `body` pour échapper aux transformations et empilements des espaces de travail. Les sous-onglets restent dans `main`, au-dessus du contenu. Sur ordinateur, des marges réservent la largeur de la barre ; sur mobile, le bas de page, les panneaux et les pieds de formulaire réservent sa hauteur avec la zone de sécurité iOS. Le bouton historique « Masquer le menu » est retiré de l'affichage ; Échap ne masque plus la navigation persistante.

Le cadrage ignore ce menu latéral ou inférieur dans son décalage supérieur. Les sous-menus existants restent au-dessus du dock (z-index 600), ainsi que les modales natives. La porte de connexion du club continue de masquer la navigation avant authentification. L'impression masque le dock.

Structure après initialisation :

```html
<body>
  <header>…</header>
  <nav id="workspace-navigation" class="app-navigation" aria-label="Espace de travail" data-dock="left">
    <!-- Les sept boutons d'origine, avec SVG décoratif et libellé -->
  </nav>
  <main>
    <div id="task-section-navigation">…</div>
    <!-- Module actif -->
  </main>
</body>
```

Vérification : `python tests/workspace-responsive-navigation-browser.py` couvre ordinateur, portable, tablette tactile et téléphone, les destinations, les icônes, le clavier, les dimensions tactiles et l'absence de débordement horizontal. L'ancien point d'entrée `tests/workspace-sticky-browser.py` délègue à ces vérifications, le menu supérieur étant remplacé.
