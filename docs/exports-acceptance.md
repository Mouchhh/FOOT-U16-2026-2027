# Étape 16 · Exports

22 octobre 2026 · Chromium, fichiers réellement téléchargés et relus par des outils
indépendants. Aucun compte Canva ni document de production utilisé.

## Composition

- [x] Un instantané est pris à l’ouverture de l’export et conservé pour tous ses
  réglages : terrain, photos, couleurs, noms, numéros et nom du fichier.
- [x] PNG et PDF utilisent le même canvas. PDF autonome d’une page : Canva 16:9,
  A4 portrait ou A4 paysage. Photos recadrées sans déformer les visages.
- [x] Comparaison d’un PNG téléchargé et du PDF rasterisé avec PyMuPDF : dimensions,
  ratio et pixels cohérents, tolérance à la compression JPEG incorporée au PDF.
- [x] Photo affichée illisible : export bloqué et message explicite, sans portrait
  silencieusement supprimé. Photo non utilisée (banc masqué ou mode pions) ignorée.
- [x] Changement d’option et changement de document pendant le calcul : aperçu
  obsolète invalidé ; le téléchargement garde le nom du document préparé.
- [x] Options adversaires, couloirs, flèches et impacteurs préservées, vue pions
  numérotée sans noms ni photos, document original non modifié par les options.

## Vidéos et schémas

- [x] Téléchargements réels de vidéos tactiques 1920 × 1080 et d’atelier 2400 × 1500.
  ffprobe confirme une piste vidéo lisible et la durée ; ffmpeg décode départ et fin.
- [x] Contrôle du déplacement d’un joueur : position bleue dans les images décodées
  à 25 % au départ et 75 % à l’arrivée, avec une courte pause aux deux extrémités.
- [x] Titre et catégorie de la vidéo tactique figés pendant l’encodage.
- [x] Erreur de construction de l’encodeur, vidéo vide, annulation et changement de
  visibilité traités ; pistes de capture arrêtées et état occupé libéré.
- [x] Une seule capture vidéo à la fois entre atelier et tableau tactique.
- [x] Image d’exercice en 2400 × 1500 et schémas conservés dans la séance enregistrée.

## Séances et rapports

- [x] PDF A4 réellement générés par Chromium, ouverts dans PyMuPDF : dernier texte,
  accents, long récit, 45 faits de match et schéma de séance présents.
- [x] Tableaux avec vrais groupes d’en-tête répétés à l’impression, textes lisibles
  (corps 9 pt), retours de ligne et schémas sans découpe volontaire.
- [x] Contrôle des limites horizontales des blocs de texte dans les PDF générés.
- [x] Aperçu du schéma de séance rasterisé et examiné visuellement. Chromium peut
  conserver les dessins canvas en vecteurs dans le PDF : présence contrôlée aussi
  via les tracés, pas seulement via les images incorporées.
- [x] Le titre de l’onglet est restauré après le dialogue d’impression.

## Tests exécutés

- `tests/export-quality-browser.py` : vrais téléchargements, photos, pixels PDF,
  trois formats, encodage/décodage, erreurs, annulation, PDF multipages et mobile.
- `tests/terrain-export-browser.py` : options par terrain, format, instantané et pions.
- `tests/exercise-board-browser.py` : matériel, rotations, image/vidéo et sauvegarde.
- `tests/custom-sequence-browser.py` : déplacements créés avec la souris, animation
  personnalisée et téléchargement vidéo. Fixtures de navigation adaptées aux menus.
- `tests/site-final-browser.py` : six rubriques et ordinateur/tablette/mobile.

## Validation externe restante

- [ ] Import réel dans le compte Canva du club : composition avec photo et adversaires,
  vidéo et PDF de séance. [Marche à suivre](exports-canva-guide.md).

Les formats locaux ont été vérifiés, pas l’interface ni le rendu du service Canva.
Les exports de composition sont aplatis : les joueurs ne sont pas éditables
séparément dans Canva. Le codec vidéo dépend du navigateur (MP4 ou WebM).
Les PDF de séance/rapport utilisent l’impression du navigateur : papier, marges,
en-têtes et couleurs restent soumis aux réglages choisis dans son dialogue.
Aucune migration Supabase ni clé Canva nécessaire pour produire ces fichiers.
