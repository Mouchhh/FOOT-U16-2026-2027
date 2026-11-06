# Causerie Stade Mayennais — modèle inspiré du projet de jeu

## Référence et périmètre

La référence visuelle est le PDF « Copie de PROJET DE JEU » fourni par le coach (13 pages). Il distingue le contexte, les informations adverses, les ingrédients du match, les animations et transitions, les CPA et le message final. Sa signature repose sur les photos en diagonale, les chevrons bleus et les schémas à gauche des consignes.

Le modèle reprend cette organisation graphique, sans reprendre ses consignes propres à US Laval, ses noms de joueurs, ni ses formulations. Il conserve les onze slides validées de l’application. La référence répète une page de transition OFF/DEF ; cette répétition n’est pas ajoutée au modèle.

Le générateur commun PowerPoint/Canva se trouve dans `causerie-eleven-slides.js`. Format 16:9, 13,333 × 7,5 pouces ; version `club-typography-279`.

## Signature graphique

- Marine `#0b192c`, bleu `#0055a5`, blanc et rouge `#e31b23`. La perte utilise l’orange `#b45309` ; la récupération le vert `#247342`.
- Logo propre `assets/causerie-logo.jpeg` sur les pages éditoriales ; aucun logo ni texte sur les quatre pages d’animations.
- Titres et textes hauts Montserrat gras italiques, textes courants Calistoga. Les couvertures 1 et 11 utilisent Montserrat gras italique pour tous leurs textes. Les polices sont déclarées, pas incorporées au PPTX.
- Pages de travail blanches, trois chevrons bleus, titre marine et filet fin. Pas de bandeau ni signature répétée en pied de page.
- Photos personnelles ou du club détourées en diagonale à gauche sur les pages éditoriales, à distance du texte. L’effet est un masque graphique, pas une modification de la photo sauvegardée.
- Pages tactiques : uniquement les terrains, sans titre, consignes latérales, dimensions ni décorations ; les consignes restent dans les notes.
- Les couvertures d’ouverture et de conclusion gardent leur grand aplat bleu et leur photo de groupe, déjà validés.

## Les onze pages

| Slide | Contenu | Mise en page |
| --- | --- | --- |
| 1 | Match, journée, date, lieu | Titre blanc gras, bleu club et photo verticale |
| 2 | Composition et impacteurs/finisseurs | Terrain sans doublon du banc ; liste du banc à droite ; noms fins |
| 3 | Dynamique et contexte | Quatre repères si quatre points saisis ; contexte intégral ; photo diagonale si le volume le permet ; aucun bloc Objectifs |
| 4 | Informations adversaire | Texte libre complet ; forces, points à exploiter et organisation seulement si renseignés |
| 5 | Idées fortes / ingrédients | Une ligne distincte par idée saisie, jusqu’aux quatre champs existants ; photo diagonale |
| 6 | Animation défensive | Terrain(s) uniquement ; consignes conservées en notes |
| 7 | Transition OFF/DEF | Terrain(s) uniquement |
| 8 | Animation offensive | Terrain(s) uniquement |
| 9 | Transition DEF/OFF | Terrain(s) uniquement |
| 10 | CPA | Responsabilités et consignes offensives/défensives rédigées par le coach ; photo diagonale |
| 11 | Mot d’ordre final | Grand message blanc et photo de rassemblement |

## Comparaison du contenu

Toutes les grandes phases de la référence sont couvertes : pas de nouvelle slide obligatoire. Les points à mieux restituer étaient la quatrième idée forte (désormais indépendante), les différentes variantes d’une phase et les consignes CPA. Les textes ordinaires jusqu’à 1 400 caractères sont affichés entièrement dans leur zone ; les contenus exceptionnellement longs donnent un extrait de projection et restent complets dans les notes du présentateur.

Les conditions du match (extérieur, revêtement, etc.) peuvent être rédigées dans le contexte ; les déclencheurs et variantes de bloc dans leurs phases ; les tireurs et responsabilités dans les CPA. Le générateur n’invente pas ces éléments et n’ajoute pas de champs ou de slogans artificiels. `contextObjective`, retiré de la slide 3 à la demande du coach, reste dans ses notes.

## Schémas et animations

La zone des terrains des slides 6–9 occupe presque toute la page. Une animation remplit la zone avec son rapport d’image d’origine ; deux à quatre animations utilisent une grille sans titre, légende, dimensions ni informations latérales. La limite combinée reste quatre situations.

Les terrains gardent leur proportion. Les consignes du coach, titres d’animations et règles des exercices sont conservés intégralement dans les notes. Les formats natif et GIF restent disponibles explicitement ; le mode vidéo ajoute des MP4 pilotables avec image d’aperçu. Les documents enregistrés restent intacts.

Les photos sont affectées automatiquement depuis les préférences, avec une priorité aux visuels personnels. Le club fournit les couvertures, le contexte, les idées fortes et les CPA par défaut. Les affectations stockées restent intactes.

## Vérification

- `tests/causerie-premium-deck-browser.py` : onze slides, charte, quatre idées distinctes, quatre points de dynamique complets, masques photo/chevrons, limites géométriques, versions native et GIF, notes longues, intégrité des sources.
- `tests/causerie-eleven-slides-browser.py` : export depuis l’interface, deux animations sur la slide 6, identifiants de timing uniques, association des mouvements aux formes, notes et mobile.
- `tests/causerie-premium-canva-browser.py` : transfert Canva entièrement simulé ; même modèle avec GIF ; aucune écriture réelle dans Canva.
- `tests/causerie-export-photos-browser.py` : photos personnelles, rechargement, isolation des équipes, export et mobile.

Les PDF de contrôle sont convertis avec LibreOffice ; ils affichent un état fixe des animations. Leur contrôle visuel ne remplace pas une lecture animée dans Microsoft PowerPoint ni un import dans un compte Canva réel.


## Animations : terrain seul et pause/reprise (277)

Les slides 6, 7, 8 et 9 ne projettent plus de titre ni d’informations. Les terrains occupent la zone disponible, sans déformer leurs proportions ; plusieurs terrains sont disposés en grille. Les consignes, titres et règles des exercices restent dans les notes, sans modification des données enregistrées. Un exercice sans dessin n’est pas remplacé par un texte ou un terrain inventé.

Le nouveau mode « Vidéo MP4 · pause et reprise » encode localement les déplacements en H.264 et les incorpore au PPTX avec une image d’aperçu du terrain. La vidéo se pilote avec les commandes de lecture PowerPoint (lecture/pause/reprise). C’est le format par défaut des nouvelles causeries ; une ancienne préférence native/GIF est conservée et peut être changée dans les options d’export. L’import Canva utilise également des MP4, à partir d’une copie du document ; la préférence originale reste intacte. Le lien Canva est proposé après l’encodage, sans ouvrir un onglet vide qui interromprait la création des vidéos.

Les navigateurs doivent prendre en charge MediaRecorder MP4 (Chrome/Edge/Safari récents). L’onglet doit rester visible pendant l’encodage. L’échec d’un encodage empêche le téléchargement d’un fichier incomplet. Les GIF importés sont refusés dans ce mode, avec une demande de leur version MP4 : un GIF n’offre pas de pause/reprise. Les formats natif et GIF restent disponibles explicitement, avec leurs limites de lecture.

`tests/causerie-pitch-video-browser.py` vérifie cinq vidéos H.264 réellement encodées, les liens média cliquables du PPTX, l’absence de textes autour des terrains, les notes sources et une lecture vidéo réelle dans le navigateur avec pause puis reprise à la position arrêtée. Ce contrôle ne remplace pas un test de lecture dans Microsoft PowerPoint/Canva. Les PDF éventuels restent des aperçus fixes.


Pour un aperçu PDF fidèle, `scripts/causerie-pptx-static-posters.py source.pptx copie-statique.pptx` crée une copie utilisant les images d’aperçu réelles des MP4. Cette copie peut être convertie avec LibreOffice ; le PPTX animé d’origine reste intact. Cela évite les pages blanches de certains convertisseurs PDF qui ignorent les images d’aperçu des objets vidéo.


## Typographie, couleurs et progression (279)

Les couvertures 1 et 11 et tous les titres utilisent Montserrat gras italique. Le corps est en Calistoga, chargé depuis les fichiers OFL locaux. Les titres, chevrons et indicateur de progression partagent l’accent de leur page. La petite ligne est conservée comme rail ; son remplissage vaut `numéro de slide / 11`, avec une largeur de rail identique sur toutes les pages pour une progression physiquement croissante.

Les pages 6–9 restent strictement limitées aux terrains, sans titre ni barre ajoutée. Leurs notes portent le libellé « Nos idées de jeu ». Les flèches des séquences tactiques utilisent les valeurs communes à la bibliothèque et aux séances : possession `#2855a2`, sans ballon `#b92635`, perte `#b45309`, récupération `#247342`. Les dessins personnels et les couleurs de rôles des joueurs sont conservés ; aucun contenu source n’est réécrit.
