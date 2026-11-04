# Accueil : grille des douze photos du club

L’accueil n’utilise plus la photo active d’un diaporama en pause comme unique présentation des images. `home-photo-gallery.js` reprend les douze photos déjà chargées depuis `assets/home-slides.js`, conserve leurs descriptions et construit une grille visible dans la carte d’accueil. Les images d’origine restent inchangées.

La grille comporte quatre colonnes sur grand écran, trois sur tablette et deux sur téléphone. Chaque image remplit un cadre 4:3 avec `object-fit: cover`, sans étirement, et des coins arrondis. Le fond photographique fixe est masqué sur cette vue pour éviter une treizième image et le contenu retrouve une hauteur naturelle afin de rendre la dernière rangée accessible. La navigation et les autres modules sont conservés. La page publique `accueil.html` n’est pas modifiée.

Validation Chromium : `tests/home-photo-gallery-browser.py` vérifie douze sources distinctes décodées, descriptions, dimensions et recadrage, accès à la dernière rangée, absence de débordement et navigation aux largeurs 1440/900/390/320 px.
