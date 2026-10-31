# Composition : choisir les joueurs depuis le terrain

Le panneau Le vestiaire conserve les nœuds d’origine : titre et compteur `#count`, champ Équipe `#team`, champ Nom de la composition `#composition-title` et bouton Enregistrer une copie `#composition-copy`. Leurs gestionnaires et leurs valeurs sont conservés.

La liste et ses commandes sous cet en-tête sont retirées de l’affichage **uniquement en Composition**. Le DOM `#roster` reste présent pour la compatibilité du moteur historique, mais il est masqué visuellement et pour les technologies d’assistance. Les autres espaces gardent leur présentation. Même si le volet était replié, cet en-tête reste visible en Composition.

## Fichiers

- `composition-player-picker.js` : fenêtre, recherche, création, affectation et gestion des gestes.
- `composition-player-picker.css` : présentation bleu/blanc et règles limitées à Composition.
- `index.html` : charge ces deux fichiers après les contrôleurs existants.

Structure construite par le module :

```html
<dialog id="composition-player-picker" aria-labelledby="composition-player-picker-title">
  <h2 id="composition-player-picker-title">Choisir le joueur</h2>
  <div role="tablist" aria-label="Affecter un joueur">
    <button role="tab" aria-controls="composition-picker-existing">Choisir un joueur</button>
    <button role="tab" aria-controls="composition-picker-create">Créer un joueur</button>
  </div>
  <section id="composition-picker-existing" role="tabpanel">
    <!-- Recherche et liste des joueurs réellement enregistrés -->
  </section>
  <section id="composition-picker-create" role="tabpanel">
    <!-- Prénom, nom, numéro, photo et validation -->
  </section>
  <p role="status"></p>
</dialog>
```

## Interaction et état

Un clic simple ou un tap sur un joueur du terrain ouvre la fenêtre. Entrée et Espace fonctionnent aussi. Les flèches continuent de déplacer le pion. Un déplacement de plus de 6 pixels est traité comme un glissement et n’ouvre pas la fenêtre. Les clics sur l’adversaire et le dessin des flèches conservent leur fonctionnement. « Autres réglages du pion » donne accès à l’éditeur existant pour conserver le changement de rôle, les ajustements locaux et le retrait d’un pion.

La fenêtre retient l’identifiant du coach, la génération de session, le document, l’emplacement et son instantané initial. Ces valeurs sont revérifiées avant toute sauvegarde. Un choix périmé ne peut donc pas écraser une composition changée entre-temps. Une photo en cours de traitement ne peut pas être appliquée après fermeture de la fenêtre ou changement de compte.

La sélection remplace uniquement l’identité du pion : nom, numéro, photo et référence `squadPlayerId`. L’identifiant du pion, ses coordonnées et son rôle sont conservés. Si le joueur est déjà ailleurs, le bouton porte explicitement le libellé **Échanger** : les identités sont échangées entre les deux emplacements, sans dupliquer le joueur.

La création combine prénom et nom dans le champ canonique `name`, compatible avec les documents existants (25 caractères maximum au total). Le numéro doit être compris entre 1 et 99. La photo facultative est recadrée au carré et compressée en JPEG de 180 × 180 pixels, comme les autres fiches d’effectif.

L’enregistrement utilise `squadSave()` : la fiche rejoint le véritable document Effectif du coach, avec ses règles existantes de stockage et de partage. L’affectation écrit ensuite le brouillon avant de remplacer le tableau en mémoire. Si le répertoire ne peut pas être enregistré, la composition reste intacte. Si seul le placement échoue, la fiche reste dans Votre effectif et le bouton propose **Réessayer le placement**, sans créer une deuxième fiche.

Les compositions déjà enregistrées ne sont pas modifiées. L’affectation reste à enregistrer dans la composition pour la partager. Elle est aussi ajoutée à l’historique d’annulation du terrain.

## Utilisation

Le module se branche automatiquement sur le terrain. Pour un autre contrôle de Composition :

```js
compositionPlayerPicker.open(slotId);
```

## Vérification

`python tests/composition-player-picker-browser.py` : identité des nœuds d’en-tête, liste masquée, clic simple, création avec photo, présence dans Votre effectif, échange entre places, coordonnées, glissement et clavier, erreurs de stockage, reprise sans doublon, rechargement, mobile et protection d’un emplacement modifié.
