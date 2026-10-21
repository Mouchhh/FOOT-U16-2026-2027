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
