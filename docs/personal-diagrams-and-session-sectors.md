# Variantes de schéma et classement des séances

## Utilisation

Depuis une fiche de la Bible, « Personnaliser · placement & animation » ouvre une copie du placement de l’atelier et de la séquence sélectionnés. Le coach déplace les joueurs ou le ballon, à la souris, au toucher ou au clavier. Le terrain peut être agrandi ; faire glisser une zone vide permet de naviguer dans la vue agrandie.

« + Étape » copie l’image courante pour construire une action. Chaque étape reçoit son explication. « Ballon au joueur » associe le premier ballon en jeu au joueur sélectionné ; si l’association reste identique entre deux étapes, le ballon suit ce joueur. Changer de joueur associé représente une transmission ou une récupération décidée par le coach. L’éditeur propose le placement initial, les étapes clés de l’exemple existant et une inversion des côtés. Ces étapes clés sont une base modifiable, pas une simulation automatique de nouvelles consignes.

« Valider ma variante » dans la bibliothèque prépare la version : il faut ensuite l’ajouter à la séance et enregistrer celle-ci pour la retrouver et la partager avec les mécanismes habituels du club. Dans un bloc déjà ajouté, « Conserver dans le brouillon » conserve directement la modification dans ce bloc ; l’enregistrement de la séance reste nécessaire pour partager. L’annulation ne modifie pas la séance. Une variante existante peut être retirée pour retrouver le schéma de la fiche.

L’éditeur est limité à 12 images et 100 objets, comme l’atelier libre. Les figures trop denses demandent de choisir un atelier plus petit. Les repères, identités et équipements copiés restent constants entre les images. La copie vers l’atelier libre reprend désormais la variante et la séquence courantes.

## Sauvegarde et compatibilité

Les variantes sont stockées dans `bibleVariant.diagramEdits`, avec séquence, atelier, signature du groupe et de ses dimensions, nom, tableau et explications des étapes. Jusqu’à 16 schémas peuvent être conservés par variante d’exercice. Un schéma prévu pour d’autres critères reste stocké mais n’est pas appliqué au mauvais groupe. Les originaux de la Bible ne sont pas modifiés.

Le validateur du nouveau champ est chargé avant la désérialisation des séances, pour que brouillons et documents enregistrés survivent à un rechargement. L’impression montre l’installation personnelle de chaque atelier concerné, même si cet atelier n’est pas sélectionné à l’écran. La fermeture de l’accès privé ferme également l’éditeur.

## Mes séances

Les séances enregistrées sont regroupées par leur premier thème déclaré, avec filtres combinables par thème et objectif de travail. Les objectifs de classement sont des correspondances explicites avec les thèmes choisis par le coach, sans analyse IA ni modification des documents. Une séance avec plusieurs thèmes reste trouvable dans chacun de ses thèmes.

La carte affiche l’objectif écrit par le coach, ou à défaut les premiers objectifs des blocs de travail hors activation et retour au calme. La recherche porte aussi sur le contexte et les noms des exercices ou variantes. Les filtres ne changent pas les données sauvegardées et restent dans l’espace de stockage du coach actif.

## Vérification

Les tests navigateur couvrent le déplacement réel à la souris et au clavier, les étapes, l’association au ballon, les noms, l’annulation, l’indépendance des séquences, les copies imprimables de plusieurs ateliers, la combinaison de référence, les brouillons après rechargement et le mobile. Le classement est vérifié sur les filtres combinés, la recherche dans les objectifs, les résultats vides et l’intégrité des séances.
