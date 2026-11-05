# Défilement de Votre effectif — 258

## Cause reproduite

L’ouverture de l’effectif ajoutait `squad-mode` mais la détection des espaces dans `workspace-workflows.js` n’incluait pas ce mode parmi les écrans autres que le terrain. L’observateur réactivait donc `terrain-workflow-active`. Le CSS commun de ce mode applique `overflow:hidden` au body : malgré une liste de plusieurs milliers de pixels, la molette ne permettait pas de descendre. Le problème a été reproduit sur une liste fictive de 30 joueurs.

## Correction

Les deux listes d’exclusion (initialisation et observateur de mode) reconnaissent désormais `squad-mode`. `squad-scroll.css` laisse l’effectif et ses ancêtres grandir selon le contenu et utilise le défilement naturel du document, avec dégagement pour la navigation mobile. La règle de défilement n’est active que lorsqu’aucune fiche workspace n’est ouverte ; le verrouillage du fond des fiches joueurs est conservé.

## Vérifications

`tests/squad-scroll-browser.py` : 30 joueurs, molette réelle jusqu’au dernier joueur et ses actions, 1366×768, 1440×900 et 390×844, ouverture/fermeture d’une fiche, retour Accueil → Effectif. Test effectué sous Chromium avec agent utilisateur Mac : il ne constitue pas un test natif Safari. Le téléchargement de WebKit a été refusé par le réseau de l’environnement (403).

`tests/player-monthly-reports-browser.py` : présence mensuelle/saison, notes, impression PDF et sélecteur de présence match inchangés.
