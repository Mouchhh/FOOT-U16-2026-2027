# Modèle de causerie Stade Mayennais — 11 diapositives

## Charte et principes

Le modèle est construit dans `causerie-eleven-slides.js` et partagé par les chemins PowerPoint et Canva. Format 16:9, 13,333 × 7,5 pouces.

- Marine `#0b192c`, blanc, accent rouge `#e31b23` ; bleu `#0055a5` pour la possession, orange `#b45309` à la perte et vert `#247342` à la récupération.
- Logo propre `assets/causerie-logo.jpeg`, transformé en PNG circulaire et placé à la même position sur les onze slides. Cet asset évite le pictogramme parasite présent sur une autre ancienne image du logo.
- Titres Montserrat gras italique, textes Arial. Titres de 30 pt, ouverture et conclusion jusqu’à 38 pt, chiffres des trois priorités à 40 pt, consignes généralement de 19 à 21 pt. Libellés et dimensions sont secondaires.
- Fonds marine pour l’ouverture et la conclusion, fonds blancs pour le travail. Filets fins, repères numérotés et puces colorées remplacent les grands cadres répétés.
- Alignement régulier : marge gauche de 0,65 pouce, en-tête hors de la zone de travail, logo en haut à droite, pied de page sous 6,95 pouces.

Les déclarations de polices sont enregistrées dans le PPTX. Les polices ne sont pas intégrées au fichier ; le lecteur doit disposer de Montserrat ou utiliser sa substitution. Arial reste le corps de texte courant. Canva connaît ces familles, mais l’import et la lecture dans un vrai compte restent dépendants du service.

## Structure des modèles

| Slide | Modèle | Hiérarchie |
| --- | --- | --- |
| 1 | Ouverture marine + photo verticale | Nom du match fort à gauche ; journée, date et lieu ; logo à droite |
| 2 | Composition | Terrain 16:9 centré sur la zone principale ; système et impacteurs à droite |
| 3 | Contexte éditorial | Deux colonnes Objectifs / Dynamique ; repères du contexte en dessous ; photo latérale si affectée |
| 4 | Adversaire | Nom, puis trois colonnes : forces, points à exploiter, organisation |
| 5 | Trois idées fortes | Grands chiffres 01 / 02 / 03 et une priorité par colonne |
| 6 | Animation Défensive | Repère rouge, consignes à gauche, schémas centrés à droite |
| 7 | Transition OFF / DEF | Même grille, repère orange « À la perte du ballon » |
| 8 | Animation Offensive | Même grille, repère bleu « Avec le ballon » |
| 9 | Transition DEF / OFF | Même grille, repère vert « À la récupération du ballon » |
| 10 | CPA | Deux colonnes offensifs / défensifs avec accents bleu / rouge |
| 11 | Mot d’ordre final | Fond marine, message fort, photo de rassemblement et logo |

## Schémas et ateliers

La zone tactique des slides 6–9 mesure 8,63 × 4,96 pouces. Une situation bénéficie d’un grand schéma ; deux situations sont côte à côte ; trois ou quatre utilisent une grille à deux colonnes. Préférer une ou deux situations lorsque le groupe doit lire des détails fins.

Les exports sont limités à quatre situations combinées par phase (animations, exercices et médias). La sélection bloque le cinquième ajout et le générateur refuse aussi une ancienne sélection trop longue, sans supprimer aucune situation. Il ne crée pas de diapositives supplémentaires ni de vignettes minuscules pour faire tenir vingt schémas.

Les schémas d’exercices conservent leur rapport 8:5 ; les animations tactiques utilisent 16:9. Les emplacements sont centrés dans chaque cellule. Les dimensions réelles de l’exercice apparaissent sous le terrain. Pour un exercice unique, les règles essentielles sont placées dans la colonne des consignes ; pour plusieurs exercices, une règle courte accompagne chaque schéma. Un exercice sans terrain enregistré reste une fiche de consignes : aucun schéma technique n’est inventé.

Les animations PowerPoint conservent leurs trajectoires natives, leurs objets et leurs identifiants. Les grands terrains natifs utilisent le marine et les couleurs du modèle, avec des pions et numéros agrandis. Les GIF et les schémas personnels gardent leurs couleurs source.

## Textes et intégrité

Le modèle de projection sélectionne quelques phrases ou lignes des textes saisis, avec un nombre et une longueur bornés. Il ne reformule pas les consignes, ne produit pas de nouvelles tactiques et ne touche pas aux données enregistrées. Les textes complets sont conservés dans les notes de la diapositive, y compris les règles des exercices. Les retours à la ligne du nom de match et du mot d’ordre sont respectés.

Les champs non renseignés ne déclenchent pas de slogans ni de paragraphes fictifs. Le modèle évite les répétitions « À compléter ». Les photos de la bibliothèque des préférences continuent à être affectées automatiquement ; les photos de contenu sont placées dans une colonne ou dans un encart secondaire pour ne pas masquer les schémas.

## Chemins d’export

- **PowerPoint** : garde le format d’animation choisi, natif ou GIF.
- **Création dans Canva** : utilise une copie de l’instantané avec animations GIF. Cela ne change ni la causerie ni la préférence PowerPoint du coach. Le même modèle de onze slides est transmis au service configuré.

`causerieEleven.theme` expose la charte, et `causerieEleven.templateVersion` vaut `club-premium-268`.

## Vérification et aperçus

- `tests/causerie-premium-deck-browser.py` : fichiers PPTX natif et GIF réels, 11 logos, palette, deux familles de polices, positions dans la slide, intégralité des notes longues, règles/dimensions d’exercice, timing natif, limite de situations et absence de mutation de la source.
- `tests/causerie-premium-canva-browser.py` : import via service entièrement simulé, même charte et 11 slides, GIF sans trajectoires réservées à PowerPoint, préférence native inchangée. Aucun document ni identifiant réel n’est transmis à Canva.
- Tests existants : `causerie-eleven-slides-browser.py`, `causerie-club-situations-browser.py`, `causerie-export-photos-browser.py`.

Pour produire une planche de contrôle depuis le fichier exporté :

```bash
python3 scripts/preview-causerie-pptx.py /tmp/causerie-premium-native.pptx /tmp/causerie-premium-preview.png
```

Le script rend la géométrie du XML du PPTX avec Pillow, les images et les premiers états des animations. Cet aperçu est un contrôle statique approximatif, pas le moteur de rendu PowerPoint ni une preuve de lecture des animations dans Canva. Les trajectoires sont vérifiées séparément dans le XML des fichiers réels.
