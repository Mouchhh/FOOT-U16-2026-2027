# Finition visuelle et compatibilité — 22 octobre 2026

## Contrôles locaux

Chromium Linux, sans comptes du club :

- Parcours des rubriques sur 1366 × 768, 1280 × 720, 320 × 740,
  390 × 844 et 844 × 390. Tactile simulé, clavier et préférence de mouvements réduits.
- Sous-menus dans les limites de l’écran ; pas de débordement horizontal des pages.
- Les raccourcis « Impacteurs / Finisseurs » et « Mes rapports enregistrés »
  ouvrent et donnent le focus à leur section. La remise à zéro du défilement
  ne les masque plus aussitôt après leur ouverture.
- Les cartes du tableau de bord de l’agenda se réduisent à 320 pixels ; leurs
  boutons reviennent à la ligne au lieu d’élargir la page.
- Espacements du formulaire de groupe/rendez-vous réduits sur ordinateur portable,
  sans réduire les champs ni masquer les présences ou l’accès WhatsApp.
- Menus au survol, tactile, navigation suivante/précédente et continuité des données.
- Exports effectivement téléchargés : comparaison PNG/PDF, photos, trois formats,
  PDF longs et dernière page, décodage vidéo et annulation d’encodage.

Tests : `visual-compatibility-browser.py`, `workspace-layout-browser.py`,
`workspace-hover-steps-browser.py`, `site-final-browser.py`,
`workspace-polish-browser.py`, `export-quality-browser.py`.
Les captures sont dans `/tmp/club-visual-compatibility` ; les fichiers d’export
synthétiques dans `/tmp/stade-exports-16`. Aucun document personnel n’est utilisé.

## Vérifications non réalisées ici

Les téléchargements Playwright de Firefox et WebKit ont échoué avec HTTP 403
« Domain forbidden ». Ce blocage concerne l’environnement de test, pas une panne
constatée du site dans ces navigateurs. Aucun résultat Firefox ou Safari n’est
revendiqué. Un contexte Chromium tactile n’est pas un iPhone physique.

Aucun accès au compte Canva ni aux appareils du club n’est disponible.
L’import réel et la compatibilité sur ces appareils restent à réceptionner.

## Recette courte sur les appareils du club

Pour chaque appareil, relever modèle, système, navigateur/version et résultat :

1. Se connecter avec son propre compte, ouvrir directement une rubrique depuis
   son sous-menu ; sur ordinateur utiliser le survol, sur téléphone le toucher.
2. Remplir une séance, faire Suivant/Précédent et vérifier les valeurs. Ouvrir la
   Bible, rechercher un exercice, ouvrir le schéma et lire son animation.
3. Déplacer un joueur et une coupelle ; tourner le téléphone, vérifier que les
   boutons restent accessibles. Tester la saisie avec le clavier du téléphone.
4. Enregistrer, vérifier l’état partagé et retrouver le document après reconnexion.
5. Télécharger une composition avec photo, un PDF de séance et une vidéo courte.
   Ouvrir les fichiers depuis Téléchargements ou Fichiers sur iPhone.
6. Dans Canva, importer le PNG dans une présentation 16:9, puis la vidéo et le PDF.
   Vérifier photo, numéros, proportions, début/fin de vidéo et dernière page du PDF.
   Les compositions exportées sont aplaties, pas des joueurs Canva indépendants.

Faire au minimum Firefox sur ordinateur, Safari sur iPhone et le navigateur utilisé
par les éducateurs sur leurs PC. En cas d’écart, conserver une capture et le fichier
concerné ; ne pas considérer la ligne comme validée tant que l’écart subsiste.
Voir aussi [le guide Canva](exports-canva-guide.md).

| Appareil / navigateur | Navigation et saisie | Schéma et tactile | Sauvegarde | Téléchargement | Import Canva |
| --- | --- | --- | --- | --- | --- |
| Firefox ordinateur du club | À tester | À tester | À tester | À tester | À tester |
| Safari iPhone du club | À tester | À tester | À tester | À tester | À tester |
| PC habituel d’un éducateur | À tester | À tester | À tester | À tester | À tester |
