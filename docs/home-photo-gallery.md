# Accueil : défilement des douze photos

L’accueil affiche à nouveau les douze photos du club dans le fond photographique, par rotation automatique toutes les six secondes avec un fondu. La grille statique ajoutée précédemment n’est plus montée dans cette vue et son CSS de masquage du fond n’est plus chargé.

Le recadrage `object-fit: cover` et les points de cadrage propres aux photos sont conservés. Les anciens outils, le mode d’emploi et les boutons Précédent/Suivant de l’ancien parcours restent masqués. La rotation s’arrête hors de l’accueil et lorsque la page est masquée, puis reprend au retour. Les préférences de réduction des animations du système et du coach sont respectées.

Test Chromium : `tests/home-photo-gallery-browser.py` utilise une horloge de navigateur pour vérifier le passage par les douze photos, le fond visible, le recadrage aux largeurs 1366/390/320 px, le maintien du nettoyage, la pause hors de l’accueil et les préférences d’animation. La page publique `accueil.html` n’est pas modifiée.
