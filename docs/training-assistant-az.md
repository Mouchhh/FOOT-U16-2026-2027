# Assistant de création de séance A à Z

Accès : **Séances → Assistant A à Z**. Le formulaire contient quatre critères : objectif libre, niveau du groupe, joueurs de champ + gardiens, et surface disponible. Le générateur local `trainingAssistantGenerate` fournit une proposition structurée ; il ne contacte pas une API d’IA et ne réécrit aucun exercice importé. Les modèles couvrent relance/sortie de balle, pressing, transitions, finition, défense et conservation pour les autres formulations.

Le comptage accepte `14 + 2`, `14 joueurs + 2 gardiens` ou `16 dont 2 gardiens`. Le modèle enregistre 16 présents dont 2 gardiens, sans compter les gardiens deux fois. Il faut au moins quatre joueurs de champ, au maximum 80 présents et 12 gardiens. L’âge U12 et supérieur, le contexte de jeu, les consignes et les dimensions sont adaptés. Un espace manifestement trop réduit est signalé au lieu de proposer une organisation irréaliste.

Les quatre phases sont : activation, situation principale, jeu appliqué/opposition, bilan/retour au calme. Chaque bloc est un exercice personnalisé indépendant dans le modèle existant. Les groupes, rotations, dimensions, matériel, consignes et critères de réussite sont explicités. Les dimensions des ateliers tiennent dans la grille de répartition de la surface disponible. Les gardiens supplémentaires jouent au pied et alternent ; les groupes sans gardien utilisent des portes ou mini-buts. Les jokers assurent la participation des effectifs impairs.

La séance dure 75 minutes avant U16 et 90 minutes à partir d’U16. Installation, activité et récupération sont enregistrées séparément dans les blocs ; leur somme correspond exactement à la durée totale. Les contraintes techniques progressent selon le niveau et la qualité observée.

- **Ajuster dans l’éditeur** installe la proposition dans le parcours existant, après mise en récupération du brouillon courant. L’ancien aperçu de l’assistant devient inactif pour éviter d’écraser les ajustements.
- **Enregistrer dans Mes séances** sauvegarde avec `libraryOnly: true`, sans rendez-vous. La bibliothèque et le document PDF l’indiquent comme non planifiée.
- **Enregistrer dans l’agenda** valide date et horaire, puis sauvegarde le même identifiant avec `libraryOnly: false`. Une sauvegarde ultérieure en bibliothèque conserve ce rendez-vous, sans le retirer implicitement.
- **Exporter en PDF** utilise le document de séance existant dans une zone d’impression indépendante. Le coach choisit Enregistrer en PDF dans la boîte d’impression de son navigateur ; le document ouvert dans l’éditeur n’est pas remplacé.

Le drapeau facultatif `libraryOnly` est ignoré pour les anciennes séances sans ce champ. Il empêche les propositions non planifiées d’entrer dans les événements Agenda, les occurrences de pointage et les statistiques de présence. Les séances normales restent inchangées.

Les sauvegardes utilisent la bibliothèque canonique et sa synchronisation existante, dans le contexte de l’éducateur et de l’équipe active. Un changement de critères impose une nouvelle génération. La planification refuse de créer un doublon d’une séance déjà enregistrée au même horaire pour l’équipe. Une erreur de stockage garde la proposition visible ; un changement de compte empêche la sauvegarde et efface l’ancien aperçu à la nouvelle connexion.

Vérifications navigateur : plusieurs thèmes et effectifs pairs/impairs, avec/sans gardiens, trois surfaces, conservation des participants et durées, absence de mutation des exercices de référence, distinction bibliothèque/agenda, document imprimable, ouverture dans l’éditeur et mobile.


## Deux ateliers et fin de préparation

L’assistant propose « Répartition automatique » ou « Deux ateliers séparés ». Le second choix répartit les joueurs de champ et gardiens en deux groupes distincts (4 à 18 joueurs de champ par groupe), dans deux zones séparées par un passage de 3 m. Chaque phase comporte deux blocs simultanés, avec `parallelId`, `workshopPlayers` et `workshopKeepers` ; sa durée n’est comptée qu’une seule fois. Avec plusieurs objectifs, le groupe B les aborde dans l’ordre inverse. Les effectifs, gardiens et dimensions sont adaptés à chaque groupe. Les deux cartes s’affichent côte à côte sur ordinateur et à la suite sur téléphone. Le récapitulatif et le PDF montrent les répartitions sans développer les consignes longues. Les exercices de référence gardent leur contenu source.

Après un enregistrement réussi (bibliothèque, agenda ou éditeur), le document enregistré reste dans Mes séances ; l’application crée un nouveau brouillon vide et revient à la première étape de Séances. La proposition de l’assistant, les critères, les dates et l’aperçu sont effacés. Si l’enregistrement échoue, aucune réinitialisation n’a lieu. Si seul le nouveau brouillon ne peut pas être écrit, le coach reçoit un message explicite et la saisie reste accessible.

Vérification : `tests/training-assistant-two-reset-browser.py` couvre les groupes pairs/impairs, gardiens, emprise au sol, durée simultanée, PDF, stockage indisponible, sauvegarde, réouverture du formulaire, éditeur, rechargement et petit écran.


## Lecture directe des ateliers (272)

La proposition de l’assistant, son PDF et les exercices personnalisés du déroulé dans l’éditeur affichent pour chaque atelier le schéma, la durée, les dimensions, l’organisation et deux consignes courtes extraites du contenu. Un schéma enregistré est repris tel quel ; sans schéma enregistré, un placement indicatif est dessiné pour le premier groupe, avec le nombre réel de joueurs et gardiens. Ce placement ne prétend pas interpréter les consignes ni remplacer le dessin source.

Les adaptations d’effectif, surface et niveau sont dans un bloc distinct. Le niveau saisi est conservé dans `assistantLevel` pour éviter de reprendre par erreur la catégorie héritée du contexte d’équipe. Les fiches importées affichent leurs règles de référence ; leur schéma adapté est conservé et le bouton « Voir la fiche d’origine » reste disponible. Les ateliers générés donnent accès à leurs textes complets via un bouton d’expansion directe. Aucune fiche source ni aucun contenu sauvegardé n’est réécrit par cet affichage.

`tests/training-assistant-workshop-cards-browser.py` vérifie les schémas, extraits, adaptations, accès au texte complet, intégrité des sources, export PDF et affichage mobile.
