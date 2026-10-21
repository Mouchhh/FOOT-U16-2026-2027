# Étape 4 · Terrain & tactique

Vérifiée le 21 octobre 2026 dans Chromium. Les contrôles couvrent les trois vues,
les changements de rubrique, l’effectif du coach et les exports.

- [x] Dimensions stables après changements répétés de vue et de sous-page à
  1366 × 768 ; pions d’au moins 28 px et terrain de plus de 300 px de large.
- [x] Composition et vue épurée conservent leurs placements et historiques distincts.
- [x] Annuler/Rétablir fonctionne avec les boutons et le clavier ; un échec de
  stockage n’applique pas l’annulation et ne remplace pas le travail courant.
- [x] L’ajout depuis l’effectif conserve la place choisie et ne modifie pas l’autre
  vue ; photos, impacteurs/finisseurs, doublons et séparation par coach vérifiés.
- [x] L’ouverture de l’export reprend les adversaires visibles, les flèches présentes,
  les impacteurs/finisseurs affichés et les couloirs de la vue courante.
- [x] Chaque option peut être modifiée dans l’aperçu sans changer le terrain original.
- [x] Les cinq couloirs apparaissent dans le PNG et le PDF, en portrait et paysage.
- [x] La vue épurée exporte des pions plus petits avec leurs numéros, sans les noms
  ni les photos de la composition.
- [x] Trois formats autonomes : Canva 16:9, A4 portrait et A4 paysage ; PDF d’une page,
  terrain seul. Le nom du document correspond à l’aperçu préparé.

## Vérifications

```sh
node --check composition-export.js
python tests/terrain-history-browser.py
python tests/terrain-size-browser.py
python tests/coach-squad-browser.py
python tests/terrain-export-browser.py
```

Les tests d’effectif simulent Supabase, sans document de production modifié.
L’historique Annuler/Rétablir reste limité à la visite ; la récupération persistante
utilise le dispositif existant. Les exports sont aplatis, adaptés à l’import Canva ;
les joueurs n’y deviennent pas des objets éditables séparément. Aucun SQL requis.
