# Séances et exercices

Le menu Séances contient deux rubriques : les séances enregistrées (avec Créer ma séance) et Exercices (la Bible, avec Créer mon exercice). Le créateur conserve ses quatre étapes, ses données et sa récupération de brouillons. La Bible est une page entière ; elle n'impose plus d'ouvrir le déroulé pour la parcourir. Les ouvertures depuis l'agenda et les raccourcis continuent d'utiliser trainingWizard.go.

Les exercices personnels sont issus du brouillon, des séances enregistrées et d'une copie locale par coach des créations validées (`vestiaire-personal-exercises`, maximum 200). Cette copie évite de perdre l'accès à une création lorsque l'on commence une autre séance. Elle ne constitue pas une nouvelle synchronisation cloud : pour partager ou retrouver sur un autre appareil, enregistrer une séance contenant l'exercice. Une écriture impossible conserve le brouillon et affiche une explication.

## Réutilisation

« Adapter à ma séance » est disponible dans Mes exercices. Un aperçu de séance partagée propose également l'adaptation individuelle de chacun de ses exercices personnalisés. Le document partagé est en lecture seule ; ajouter crée un nouvel identifiant dans le brouillon du destinataire, jamais une modification du collègue. Le compte et la séance sont vérifiés au moment de l'ajout.

Le destinataire choisit les groupes et valide les dimensions et ses rôles/rotations. Les groupes équilibrent joueurs et gardiens ; deux joueurs de champ minimum par groupe. Les dimensions proposées sont bornées par la place disponible et une disposition en lignes/colonnes. Pour circuits et duels les distances techniques restent constantes ; pour jeu et conservation une proposition de densité sert de point de départ, pas de validation pédagogique automatique. L'ensemble des ateliers doit tenir dans l'espace.

Le plan de groupes est stocké, validé et affiché dans la fiche. Le calcul d'occupation tient compte de tous les groupes. Si l'effectif change, une alerte demande de réadapter. Le dessin indicatif représente le premier groupe ; les groupes et rotations restent listés explicitement.

## Limites explicites

Les textes libres ne deviennent pas des consignes comprises et réécrites automatiquement. Les notes initiales, les schémas dessinés et leurs animations sont conservés. Une confirmation et des rôles/rotations rédigés sont nécessaires ; les dessins personnalisés doivent être ajustés dans l'éditeur si leur effectif ne correspond plus. Aucun moteur ne prétend reconstruire automatiquement une chorégraphie arbitraire. L'objectif, le matériel et les contraintes particulières demandent la vérification de l'éducateur. Les fonctions existantes d'adaptation de la Bible restent inchangées.

## Vérification

- `python tests/training-sections-browser.py` : navigation, création, copie indépendante, refus avant validation, deux groupes avec gardiens, aperçu partagé, rechargement, disponibilité après nouvelle séance, téléphone et absence d'erreurs JavaScript.
- `python tests/training-exercise-library-browser.py` : schéma réel, animation, sauvegarde, réutilisation, modifications indépendantes, refus de perte, quota, mobile.
- `python tests/training-stages-field-browser.py` : ateliers simultanés, temps, matériel, joueurs/gardiens/espace, fiche terrain et impression.
