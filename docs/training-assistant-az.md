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

La proposition de l’assistant, son PDF et les exercices personnalisés du déroulé dans l’éditeur affichent pour chaque atelier le schéma, la durée, les dimensions, l’organisation et deux consignes courtes extraites du contenu. Le schéma de bibliothèque ou le dessin personnel est repris tel quel. Sans schéma associé, aucun placement de substitution n’est dessiné.

Les adaptations d’effectif, surface et niveau sont dans un bloc distinct. Le niveau saisi est conservé dans `assistantLevel` pour éviter de reprendre par erreur la catégorie héritée du contexte d’équipe. Les fiches importées affichent leurs règles de référence ; leur schéma adapté est conservé et le bouton « Voir la fiche d’origine » reste disponible. Les ateliers générés donnent accès à leurs textes complets via un bouton d’expansion directe. Aucune fiche source ni aucun contenu sauvegardé n’est réécrit par cet affichage.

`tests/training-assistant-workshop-cards-browser.py` vérifie les schémas, extraits, adaptations, accès au texte complet, intégrité des sources, export PDF et affichage mobile.


## Schémas d’origine (273)

Les exercices importés réutilisent `suppliedReferenceBoard`, exactement le même moteur, les mêmes paramètres de référence et le même SVG que la miniature de la bibliothèque. Le passage par le convertisseur de l’atelier libre n’est plus utilisé pour leur aperçu. Le schéma de référence reste distinct des adaptations d’effectif et de dimensions. Les dessins personnels sont conservés. Les ateliers générés sans exercice associé n’affichent plus de placement générique : ils invitent à associer une fiche de la bibliothèque. Aucun schéma de remplacement n’est inventé.


## Exercices de la Bible dans la séance (307)

À la demande du coach, l’assistant ne se contente plus d’ateliers écrits sans schéma : chaque séquence est remplie automatiquement avec une fiche de la Bible (`exerciseReferenceIndex`), adaptée au groupe par `suppliedExerciseBlock` et affichée avec son schéma d’origine.

- **Rôle par étape** (`trainingAssistantBibleRoles`) : première étape = activation (`ludic-activation`), étapes centrales = ateliers ciblés (`clubObjective`), avant-dernière = jeu appliqué (objectifs choisis), dernière = retour au calme (`ludic-cool`). En « Deux ateliers séparés », les blocs A et B d’une étape ont le même rôle et chacun son effectif (`workshopPlayers` / `workshopKeepers`) et sa zone (même calcul que `trainingAssistantGenerateTwo`).
- **Classement** (`trainingAssistantBibleCandidates`) : objectif du club, gardiens disponibles, puis le plus proche en effectif, dimensions, âge de référence et phase ; une fiche n’est jamais utilisée deux fois dans la séance. Les fiches à l’effectif « à vérifier » sont exclues (comme les anciennes recommandations).
- **Sécurité** : la durée, l’installation et la récupération de la séquence générée sont conservées ; un remplacement qui ajoute un avertissement d’emprise (`trainingStageReview`) ou invalide la séance est refusé. Une fiche conçue pour un autre âge n’est prise qu’en dernier recours, avec l’avertissement affiché sur la carte.
- Bouton **« ↻ Autre exercice »** sous chaque séquence : un clic remplace l’exercice par une autre fiche de la Bible qui convient (tirage au hasard parmi les plus proches, mêmes contrôles d’effectif, d’espace et de temps). Masqué quand la Bible n’a aucune fiche pour cette étape (retour au calme).
- **« Changer d’exercice »** sous chaque séquence : 5 autres fiches compatibles, ou « Exercice écrit par l’assistant » qui restaure la copie d’origine (gardée en mémoire, jamais modifiée).
- Chaque sous-groupe adapté doit avoir l’effectif minimum et les gardiens de la fiche. La carte affiche le rythme de référence de la fiche quand elle en donne un (effort / récupération, valeurs d’origine) ; le budget de la séquence reste celui affiché au-dessus, même après un ajustement de durée dans l’éditeur. Une adaptation d’âge tolérée est écrite en tête des consignes (« À adapter : … »).
- Le retour au calme reste écrit tant que la Bible n’a pas de fiche de ce type ; la carte l’indique.
- Les marqueurs internes (`assistantSource`, `assistantSourceId`, `assistantWarnings`) sont retirés avant l’enregistrement et l’envoi vers l’éditeur. Les fiches de la Bible ne sont jamais réécrites.
- L’ancien encadré « Exercices de référence compatibles » est remplacé par ces choix.

Vérification : `tests/training-assistant-bible-browser.py` (sélection, doublons, temps, emprises, échange, restauration, enregistrement, mobile) et `tests/exercise-reference-index-browser.py`.

### Durée choisie et échauffement (308)

- Champ **« Durée de la séance »** : selon l’âge (75 min avant U16, 90 min ensuite, comme avant) ou 60, 75, 90, 105, 120 min. L’échauffement (15 min, 12 min sous 75 min) et le retour au calme (10 min, 8 min sous 75 min) gardent une durée fixe ; le reste est partagé entre atelier(s) et jeu appliqué dans le même rapport qu’avant. Les textes des séquences écrites indiquent ces temps.
- La première étape s’appelle **« Échauffement »** (titre « Échauffement · nom de la fiche » quand une fiche de la Bible est utilisée). L’échauffement **change à chaque génération** : tirage au hasard parmi toutes les fiches d’échauffement de la Bible qui conviennent au groupe et à l’espace (circuits de passes, toros, rondos, gammes techniques, FIFA 11+…). Les jeux de poursuite / relais et les circuits athlétiques ne viennent qu’après. Pour un grand groupe, l’échauffement est réalisé en plusieurs groupes identiques.

## Logique d'éducateur et édition sur place (310)

Retour du coach : la séance doit suivre la logique de base enseignée par la FFF (pas une vérité absolue), et rester une **proposition à adapter**.

- **Bandeau** sous le titre : la séance proposée est une base qui doit être adaptée (changer, modifier, ajouter, retirer des exercices). Le message de fin de génération le rappelle.
- **Intentions** : « Échauffement / Activation », « Coordination & motricité » et « Retour au calme » ne sont plus des cases (`trainingAssistantHiddenObjectives`) : échauffement et retour au calme sont dans toutes les séances. Nouveau champ **« Travail physique (facultatif) »** : vitesse, pliométrie – force, endurance – intermittent (fiches `ludic-motor` de la Bible filtrées par mots-clés). Bloc de 10 min (9 + 1 d’installation) pris sur le jeu final : après l’échauffement pour vitesse / pliométrie, avant le retour au calme pour l’endurance.
- **Ordre** : l’échauffement est **sans adversité** (exclusion stricte des fiches « contre », toro, rondo, duel, opposition, match ou de phase jeu / opposition) ; puis les exercices sont classés **par taille croissante** (effectif de référence, puis surface) : petits formats d’abord (toros, 1 contre 1, 2 contre 2, éventuellement en atelier via « Situations réduites ludiques »), formats moyens au milieu, l’exercice le plus grand et le plus proche du match en dernier avant le retour au calme (`trainingAssistantOrderBySize`). Les remplacements restent dans la fourchette de taille des étapes voisines.
- **Identité des créneaux** : chaque étape garde son id, son rôle (`assistantRole`) et, pour le physique, son type (`assistantPhysical`) quel que soit l’exercice qui la remplit.
- **Sous chaque exercice** :
  - « ↻ Autre exercice » : tirage dans toutes les fiches compatibles, **sans repasser** par celles déjà montrées pour ce créneau tant qu’il en reste ; puis on recommence (message) ;
  - « ✎ Modifier cet exercice » : la séance part dans l’éditeur et la fiche de l’exercice s’ouvre ;
  - « ＋ Créer mon exercice ici » : la séance part dans l’éditeur et une fiche **vide** (schéma vide) s’ouvre à la place de cet exercice ; à l’enregistrement, seule cette étape est remplacée (durée et autres étapes conservées, sans données de l’ancienne fiche — `trainingCustomFreshId` dans `training-custom.js`) ;
  - « Choisir dans une liste » (repliée) : jusqu’à 8 fiches compatibles et « Exercice écrit par l’assistant ».
