# Causerie Stade Mayennais — modèle inspiré du projet de jeu

## Référence et périmètre

La référence visuelle est le PDF « Copie de PROJET DE JEU » fourni par le coach (13 pages). Il distingue le contexte, les informations adverses, les ingrédients du match, les animations et transitions, les CPA et le message final. Sa signature repose sur les photos en diagonale, les chevrons bleus et les schémas à gauche des consignes.

Le modèle reprend cette organisation graphique, sans reprendre ses consignes propres à US Laval, ses noms de joueurs, ni ses formulations. Il conserve les onze slides validées de l’application. La référence répète une page de transition OFF/DEF ; cette répétition n’est pas ajoutée au modèle.

Le générateur commun PowerPoint/Canva se trouve dans `causerie-eleven-slides.js`. Format 16:9, 13,333 × 7,5 pouces ; version `club-reference-276`.

## Signature graphique

- Marine `#0b192c`, bleu `#0055a5`, blanc et rouge `#e31b23`. La perte utilise l’orange `#b45309` ; la récupération le vert `#247342`.
- Logo propre `assets/causerie-logo.jpeg`, au même emplacement sur les onze slides.
- Titres Montserrat gras italiques, texte Arial. Couverture en Arial gras sans italique, conformément au choix du coach. Les polices sont déclarées, pas incorporées au PPTX.
- Pages de travail blanches, trois chevrons bleus, titre marine et filet fin. Pas de bandeau ni signature répétée en pied de page.
- Photos personnelles ou du club détourées en diagonale à gauche sur les pages éditoriales, à distance du texte. L’effet est un masque graphique, pas une modification de la photo sauvegardée.
- Pages tactiques sans photo décorative : schémas à gauche, consignes à droite, couleur de phase en rappel discret.
- Les couvertures d’ouverture et de conclusion gardent leur grand aplat bleu et leur photo de groupe, déjà validés.

## Les onze pages

| Slide | Contenu | Mise en page |
| --- | --- | --- |
| 1 | Match, journée, date, lieu | Titre blanc gras, bleu club et photo verticale |
| 2 | Composition et impacteurs/finisseurs | Terrain sans doublon du banc ; liste du banc à droite ; noms fins |
| 3 | Dynamique et contexte | Quatre repères si quatre points saisis ; contexte intégral ; photo diagonale si le volume le permet ; aucun bloc Objectifs |
| 4 | Informations adversaire | Texte libre complet ; forces, points à exploiter et organisation seulement si renseignés |
| 5 | Idées fortes / ingrédients | Une ligne distincte par idée saisie, jusqu’aux quatre champs existants ; photo diagonale |
| 6 | Animation défensive | Schémas à gauche ; repères et variantes de bloc rédigés par le coach à droite |
| 7 | Transition OFF/DEF | Perte du ballon ; même grille tactique, accent orange |
| 8 | Animation offensive | Sorties de balle/situations sélectionnées ; règles et dimensions à proximité |
| 9 | Transition DEF/OFF | Récupération du ballon ; même grille tactique, accent vert |
| 10 | CPA | Responsabilités et consignes offensives/défensives rédigées par le coach ; photo diagonale |
| 11 | Mot d’ordre final | Grand message blanc et photo de rassemblement |

## Comparaison du contenu

Toutes les grandes phases de la référence sont couvertes : pas de nouvelle slide obligatoire. Les points à mieux restituer étaient la quatrième idée forte (désormais indépendante), les différentes variantes d’une phase et les consignes CPA. Les textes ordinaires jusqu’à 1 400 caractères sont affichés entièrement dans leur zone ; les contenus exceptionnellement longs donnent un extrait de projection et restent complets dans les notes du présentateur.

Les conditions du match (extérieur, revêtement, etc.) peuvent être rédigées dans le contexte ; les déclencheurs et variantes de bloc dans leurs phases ; les tireurs et responsabilités dans les CPA. Le générateur n’invente pas ces éléments et n’ajoute pas de champs ou de slogans artificiels. `contextObjective`, retiré de la slide 3 à la demande du coach, reste dans ses notes.

## Schémas et animations

La zone des schémas des slides 6–9 mesure 6,15 × 5,05 pouces à gauche ; les consignes disposent de 5,28 pouces à droite. Une situation est agrandie ; deux se placent l’une au-dessus de l’autre, comme dans la référence ; trois ou quatre utilisent une grille. La limite combinée reste quatre situations pour préserver la lisibilité.

Les terrains gardent leur proportion (16:9 pour les animations tactiques, 8:5 pour les exercices personnalisés). Les photos décoratives ne remplacent pas une situation absente. Les sélections, déplacements natifs PowerPoint, GIF, schémas personnels, règles sources et notes sont conservés. Les textes du coach ne sont pas réécrits par le modèle.

Les photos sont affectées automatiquement depuis les préférences, avec une priorité aux visuels personnels. Le club fournit les couvertures, le contexte, les idées fortes et les CPA par défaut. Les affectations stockées restent intactes.

## Vérification

- `tests/causerie-premium-deck-browser.py` : onze slides, charte, quatre idées distinctes, quatre points de dynamique complets, masques photo/chevrons, limites géométriques, versions native et GIF, notes longues, intégrité des sources.
- `tests/causerie-eleven-slides-browser.py` : export depuis l’interface, deux animations sur la slide 6, identifiants de timing uniques, association des mouvements aux formes, notes et mobile.
- `tests/causerie-premium-canva-browser.py` : transfert Canva entièrement simulé ; même modèle avec GIF ; aucune écriture réelle dans Canva.
- `tests/causerie-export-photos-browser.py` : photos personnelles, rechargement, isolation des équipes, export et mobile.

Les PDF de contrôle sont convertis avec LibreOffice ; ils affichent un état fixe des animations. Leur contrôle visuel ne remplace pas une lecture animée dans Microsoft PowerPoint ni un import dans un compte Canva réel.
