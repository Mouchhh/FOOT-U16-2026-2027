# Ressources des éducateurs

L’onglet principal `Ressources` est intégré à l’historique, au recentrage et à la navigation responsive. `coach-resources.js` conserve une liste de références éditoriales et construit une bibliothèque avec recherche, catégories et états vides. Il réutilise les contrôles de navigation existants et n’altère aucun document du coach.

Catégories : Fiches d’exercices, Documents du club, Guides tactiques, Protocoles de séance, Vidéos et animations. Les catégories vides ne contiennent aucun faux document.

## Document fourni

`assets/resources/progression-crm-foot.pdf` contient **uniquement la deuxième page** du fichier reçu « Progression CRM foot.pdf ». La première page n’est pas publiée. Le PDF contient une seule page, dont l’image est identique à celle de la deuxième page source. Le contenu pédagogique n’a pas été retranscrit ni réécrit.

`assets/resources/progression-crm-foot.webp` sert de vignette et d’aperçu. Le document est classé dans Protocoles de séance. Le bouton Consulter ouvre une fenêtre avec agrandissement et défilement du tableau, ouverture du PDF et téléchargement. Le PDF téléchargeable reste le document de référence.

## Structure

```html
<button id="view-resources" aria-controls="coach-resources">Ressources</button>
<section id="coach-resources" aria-labelledby="resources-heading" hidden>
  <!-- titre, recherche, catégories, cartes -->
</section>
```

Le registre `documents` de `coach-resources.js` est éditable pour intégrer d’autres fichiers :

```js
{
  id: 'guide-coach', title: 'Guide du coach',
  category: 'tactics', kind: 'pdf', format: 'PDF', pages: 1,
  description: 'Description du document.', tags: ['Tactique'],
  url: 'assets/resources/guide-coach.pdf',
  preview: 'assets/resources/guide-coach.webp',
  previewAlt: 'Aperçu du guide.'
}
```

Types prévus : `pdf`, `image`, `video` et `link`. Une image utilise son propre fichier comme aperçu ; une vidéo dispose des commandes natives ; un lien s’ouvre dans un nouvel onglet. Aucun compte externe ni service d’importation n’est nécessaire pour les fichiers intégrés. Les noms et descriptions sont injectés en texte, pas en HTML utilisateur. Les liens du registre sont des ressources choisies par les mainteneurs du site.

Avec huit destinations, les petits téléphones de moins de 380 px utilisent deux rangées de quatre boutons. Les autres mobiles gardent une rangée ; les ordinateurs conservent la sidebar. La hauteur réelle du menu inférieur est mesurée par `ResizeObserver` et réservée dans le contenu et les panneaux afin d’éviter les boutons masqués.

Vérification : `python tests/coach-resources-browser.py` contrôle le PDF d’une seule page, l’empreinte de l’image issue de la page 2, recherche/filtres/aperçu/agrandissement/téléchargement, historique, rechargement, conservation du brouillon et navigation mobile. `tests/workspace-responsive-navigation-browser.py` et `tests/document-entry-browser.py` couvrent la navigation et les choix Match/Bilans existants.
