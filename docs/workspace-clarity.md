# Présentation épurée et accès sans défilement initial

## Bible de l’éduc

La Bible occupe désormais toute la largeur de l’espace de travail. Les étapes de
préparation et le pied de page de la séance sont masqués pendant la consultation ;
« Ma séance » réaffiche le déroulé et ses commandes. Le bouton de création libre
est déplacé dans l’en-tête de la bibliothèque, puis remis à sa place en revenant.
Les événements et les données du bouton restent identiques.

La recherche, les moments du jeu et le filtre de thème apparaissent avant les
résultats. Les options de recherche supplémentaires restent repliées. Le filtre
natif de phase conserve sa valeur pour les fonctions et documents existants ;
les boutons visibles et accessibles commandent cette même valeur.

Une seule rangée de cartes est présentée à la fois : 4, 3, 2 ou 1 selon la largeur.
Précédent/Suivant remplacent les résultats au lieu d’allonger la page. Les cartes
montrent un aperçu statique de l’installation réelle, sans lecteur animé caché.
Le clic sur l’aperçu ouvre la fiche agrandie ; les détails dans la carte restent
possibles, avec une seule carte développée à la fois. La fiche complète, ses
variantes, la création libre et l’ajout à la séance restent disponibles.

La mise au point sur la recherche est réservée au bureau avec pointeur fin, pour
ne pas ouvrir automatiquement un clavier virtuel lors d’une consultation mobile.

## Autres onglets

La feuille de style commune harmonise panneaux, champs, contrastes, espacements,
étapes et boutons. Les slogans et paragraphes de présentation répétitifs des
en-têtes sont masqués hors accueil afin de remonter les formulaires et les actions.
Les parcours par étapes, champs, validations et fonctions existants sont conservés.
Cette modification ne prétend pas faire tenir tous les formulaires détaillés sur
un petit écran ; les fiches approfondies et les options ouvertes peuvent défiler.

## Vérification

`tests/workspace-polish-browser.py` vérifie la navigation, la recherche, les filtres,
la pagination, les aperçus statiques, les fiches agrandies, la lecture facultative,
l’ajout à une séance et le retour au déroulé. Il mesure que la recherche, les
résultats initiaux et la pagination restent dans le panneau visible sans
défilement initial en 1440 × 900, 1366 × 768 et 390 × 844.

`tests/bible-library-browser.py` conserve les vérifications complètes du contenu,
des adaptations, des variantes, de la création libre, de la persistance et du PDF.
Les assertions de pagination sont mises à jour pour une page remplacée de trois
cartes sur le bureau de test, au lieu d’une liste cumulative de huit puis seize.

Aucune modification du schéma Supabase ou des documents des éducateurs.

## Finition visuelle · 23 octobre 2026

`workspace-finish.css`, chargé après les styles des rubriques, harmonise les
champs, les boutons d’action, les contours et les états de focus. Les actions
principales restent bleues ; les actions secondaires gardent un fond neutre.
Les champs sont blancs, leurs libellés plus lisibles et leur focus clavier
nettement visible. Les dimensions des éléments déplaçables du terrain ne sont
pas modifiées.

La Bible utilise des cartes et un cadre sans ombre, des filtres sélectionnés
plus discrets et une action « Créer ma variante » soulignée. L’ajout à la séance
reste l’action principale. Tous les aperçus, avertissements, détails, filtres,
pages et commandes existants sont conservés. Les actions des cartes sont
alignées en bas sur ordinateur.

Sur mobile, les champs utilisent une taille de texte de 16 px pour éviter le
zoom automatique d’iOS. Les sélecteurs des formulaires de séance occupent la
largeur disponible pour conserver les libellés longs. Les principales commandes
et les actions des cartes ont une hauteur minimale de 44 px. Les ajustements
de mise en page gardent le rendez-vous complet visible sur un ordinateur de
1366 × 768. Les règles de finition sont limitées à l’écran ; les styles
d’impression existants sont conservés.

Vérifications de cette finition : les suites `workspace-polish-browser.py`,
`workspace-layout-browser.py`, `workspace-navigation-browser.py` et
`site-final-browser.py` passent. La suite historique `bible-library-browser.py`
s’arrête au clic de `#training-step-link-1` (ligne 112), masqué par la navigation
actuelle. Le contrôle avec et sans `workspace-finish.css` confirme que ce lien
est déjà masqué sans cette finition ; cette suite n’est donc pas déclarée validée.
