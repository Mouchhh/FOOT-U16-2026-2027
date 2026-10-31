# Entrée explicite dans Causerie et Bilans

L’entrée affiche un choix uniquement si un document existe dans le contexte concerné : **Reprendre / Modifier** ou **Créer une nouvelle causerie / un nouveau bilan**. Le match, la date et la catégorie sont affichés. Un formulaire vide s’ouvre directement. Le retour et l’annulation ne remplacent aucun document.

## Fichiers

- `document-entry.js` : recherche par contexte, état de transition, construction HTML de la fenêtre, versions précédentes et branchements vers les parcours existants.
- `document-entry.css` : deux actions lisibles, côte à côte sur ordinateur et empilées sur téléphone, avec focus clavier et contraste bleu/blanc.
- `index.html` : charge le composant après les contrôleurs existants.

Le HTML est construit avec `el()` et `textContent`, sans insertion HTML de données du coach. Structure rendue :

```html
<dialog id="document-entry-dialog" aria-labelledby="document-entry-title">
  <h2 id="document-entry-title">Un bilan existe déjà</h2>
  <p class="document-entry-context">Match · date · catégorie</p>
  <label>Document à reprendre <select id="document-entry-version"></select></label>
  <div class="document-entry-choices">
    <button id="document-entry-resume">Reprendre / Modifier</button>
    <button id="document-entry-create">Créer un nouveau bilan</button>
  </div>
  <p role="status"></p>
</dialog>
```

Le sélecteur est masqué si une seule version est disponible. La fenêtre native gère la modalité, le clavier et le focus. Retour ou Échap annulent la transition.

## État et transitions

```js
{ phase: 'idle', kind: null, context: null, error: '' }
// checking → choice → opening ou creating → idle
// checking → opening → idle si aucun document n’existe
// error : message dans le choix, ancien document préservé
```

`documentEntry.getState()` expose une copie de cet état. La décision acceptée vaut pour le document et la visite courants : changer d’étape dans un bilan ne redemande pas ce choix. Une nouvelle arrivée dans la rubrique le redemande. La restauration après rechargement et les retours d’historique sont également contrôlés.

```js
// Pour un nouvel accès à la rubrique, depuis un autre composant :
documentEntry.request('report', () => {
  workspaceNavigation.run('view-reports');
});

// L’ouverture de la causerie passe par la même politique.
documentEntry.request('causerie', () => {
  workspaceNavigation.run('view-pitch', () => workspaceFlows.terrain.go(1));
});
```

Un accès depuis l’agenda fournit son contexte explicite (identifiant de rencontre, date, adversaire, équipe, catégorie). Il n’utilise pas le dernier bilan d’un autre match. Pour une navigation Match → Bilans, le match ouvert est prioritaire. Sans contexte identifiable, seule la version du document courant est pertinente : une simple date ou un titre approchant ne suffit pas à choisir arbitrairement un autre match.

La recherche consulte le brouillon, les documents enregistrés du coach et ses versions précédentes. Les dates, adversaires, équipes et catégories sont comparés précisément ; une clé de rencontre stable est prioritaire. Les documents identiques sont dédupliqués en ignorant uniquement `updatedAt`. Les comptes, documents et générations de session sont revérifiés au moment du choix : un changement survenu pendant la fenêtre bloque une décision périmée.

## Création et conservation

Créer attribue un nouvel identifiant. Les repères de la rencontre et la composition sont conservés ; la rédaction, les objectifs de causerie ou les analyses, notes, scores et plan d’action du bilan sont remis à zéro. Une éventuelle préparation associée au bilan conserve ses objectifs de départ mais réinitialise leurs constats et observations. Les documents enregistrés et partagés ne sont pas supprimés ni écrasés.

Avant remplacement, les versions utiles de l’existant et du brouillon courant sont conservées dans `vestiaire-document-versions` via le stockage du coach. Le remplacement passe ensuite par `workspaceReplaceDraft`, qui préserve également la récupération habituelle. Si l’archive ou l’écriture du nouveau brouillon échoue, le document courant reste ouvert. Les copies identiques ne sont pas dupliquées.

**Versions précédentes** est accessible depuis la rubrique et permet de rouvrir une copie. Ces versions restent sur cet appareil, séparées par coach ; elles ne sont pas publiées ni synchronisées automatiquement. La limite est de 100 copies : le composant bloque alors une nouvelle conservation au lieu d’effacer automatiquement les plus anciennes.

## Vérification

`python tests/document-entry-browser.py` : entrée vide, reprise, création indépendante, contexte, rechargement, étapes internes, archives et restauration, quota à l’archivage et à l’écriture du brouillon, choix périmé, mobile.

`python tests/agenda-match-actions-browser.py` : les raccourcis d’agenda utilisent la transition et rouvrent le bilan lié après choix explicite.

## Arrivée dans Match

L’entrée principale Match, les ouvertures génériques de préparation depuis l’accueil ou l’agenda, et le rechargement après une causerie commencent sur **Composition**. Les joueurs, placements et textes existants sont conservés. Le choix de reprise/création de causerie est présenté seulement lorsque l’éducateur choisit Causerie. Le raccourci explicite « Préparer la causerie » de l’agenda reste dirigé vers cette rédaction. Le comportement de Bilans est conservé.
