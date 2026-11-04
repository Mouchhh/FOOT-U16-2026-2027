# Causerie Stade Mayennais : onze slides

L’export principal utilise `causerieEleven.build`, avec PptxGenJS et les moteurs d’animation déjà présents. La direction visuelle reprend les deux PDF fournis : couverture et conclusion marine profond (#09182A), pages blanches, titres Montserrat, repères fins rouge écusson (#E41F28), sans illustration décorative imposée ni accumulation de cartes. La composition est une image du terrain réel ; les consignes restent des objets texte modifiables.

| Slide | Contenu | Données |
| --- | --- | --- |
| 1 | Infos match | `match`, `title`, `round`, `date`, `venue` |
| 2 | Composition et impacteurs/finisseurs | Positions et joueurs du document, `formation` |
| 3 | Contexte | `context`, `contextObjective`, `contextDynamics` |
| 4 | Adversaire | `opponent`, `opponentStrengths`, `opponentWeaknesses`, `opponentAnimation` |
| 5 | Trois axes | `objectives` ; un éventuel ancien quatrième objectif rejoint le troisième bloc |
| 6 | Animation défensive | `defensive`, animations `defensive` |
| 7 | Transition OFF / DEF | `transitionOffDef`, animations `offDef` |
| 8 | Animation offensive | `offensive`, animations `offensive` |
| 9 | Transition DEF / OFF | `transitionDefOff`, animations `defOff` |
| 10 | CPA pour et contre | `setPiecesFor`, `setPiecesAgainst`, anciens compléments `specific` |
| 11 | Mot d’ordre final | `closingMessage` ; anciennes notes conservées en notes du présentateur |

Les champs de texte, sauf ceux de composition, se trouvent dans `board.matchPreparation`. Les nouveaux champs restent facultatifs pour ouvrir les anciennes causeries. Aucun texte footballistique des PDF n’est imposé au coach ni réécrit. Le texte complet est également enregistré dans les notes du présentateur ; les longs textes visibles s’adaptent à leur zone sans créer de slide supplémentaire.

Dans Causerie → **Présentation · 11 slides**, l’éducateur complète les champs supplémentaires et sélectionne plusieurs animations pour chacune des quatre phases. Les instantanés sont enregistrés dans :

```js
board.causerieSlideAnimations = {
  defensive: [animationA, animationB],
  offDef: [animationC],
  offensive: [animationD],
  defOff: [animationE]
};
board.causerieAnimationVariant = 'native'; // ou 'gif'
```

Chaque entrée est un instantané `simpleSequenceValid` complet (pions, ballon, étapes, vitesse et choix de passe). Le coach valide la causerie pour conserver ces réglages dans son archive. Les instantanés restent sélectionnables même lorsque l’animation source n’est plus dans la bibliothèque. Les anciennes sélections génériques et médias sont placés dans la phase défensive par défaut lorsqu’aucune répartition explicite n’existe.

Les schémas sont répartis dans une grille sur leur slide, sans slide de démonstration supplémentaire. Il est conseillé d’en choisir un à quatre par phase pour la lisibilité. Le mode natif construit des objets PowerPoint et des trajectoires OOXML, avec un seul arbre temporel par slide et des identifiants distincts ; plusieurs animations de la même phase démarrent ensemble au clic. Le mode GIF place les animations compatibles dans les mêmes zones. L’import Canva n’interprète pas les trajectoires PowerPoint ; utiliser la variante GIF et, si nécessaire, les GIF individuels proposés dans Démonstrations. Les moteurs et déplacements d’origine restent inchangés.

Exemple d’appel déjà raccordé au bouton PPT et au transfert Canva :

```js
const snapshot = causerieExport.capture();
const deck = await causerieExport.build(snapshot, false);
const blob = await deck.write({ outputType: 'blob' });
```

La sélection de phases ne déborde pas sur Nouveau match et disparaît lors de la suppression de la causerie. La bibliothèque d’animations reste conservée.

Vérification : nombre exact et ordre des onze slides, deux animations sur la slide 6, unicité des identifiants de timing, cibles des trajectoires, notes intégrales sur onze pages, variante GIF, remise à zéro, réouverture des causeries et responsive. Un export natif a aussi été converti en PDF pour contrôler sa mise en page.
