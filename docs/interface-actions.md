# Suppression des exercices personnels et fermetures externes

## Mes exercices

Chaque carte de `Mes exercices` possède une corbeille rouge (`#b92635`) accompagnée du libellé Supprimer. Une confirmation précise que l’exercice disparaît de cette liste et que ses copies déjà utilisées dans des séances restent conservées.

`trainingDeletePersonalExercise(entry, owner)` retire les copies indépendantes correspondant à la carte et mémorise les références retirées de la liste. Les brouillons et séances enregistrées ne sont pas réécrits. Les références sont distinguées par l’identifiant du bloc et une empreinte de son contenu : une variante modifiée ou une nouvelle copie volontaire reste indépendante. Les versions identiques actuellement dédupliquées sous une même carte sont toutes retirées de la liste, afin qu’elles ne réapparaissent pas au rechargement.

La clé existante `vestiaire-personal-exercises`, propre au coach et à cet appareil, accepte encore l’ancien tableau. Les nouvelles écritures utilisent `{version:1, entries:[], deleted:[]}`. La suppression se fait en une seule écriture ; si elle échoue, aucune carte n’est retirée. Le coach et la séance sont vérifiés au clic. La liste est immédiatement recalculée après succès, en conservant la recherche active.

Les exercices fournis dans la Bible ne sont pas supprimables par cette action. La commande existante Retirer l’exercice reste disponible pour enlever un bloc d’une séance.

## Croix de fermeture

`external-modal-close.js` détecte les fenêtres natives ouvertes et leurs boutons de fermeture (Fermer, Annuler ou une croix), ainsi que les panneaux déclarés avec `role="dialog"` ou `data-closable-panel`. Il applique la classe `external-modal-close` au **bouton original** : aucun formulaire n’est déplacé, aucun identifiant ni écouteur n’est remplacé. Les confirmations, validations et règles de fermeture existantes restent actives. Un libellé accessible décrit l’action ; le CSS affiche une croix dans un bouton de 44 × 44 px.

Pour les fenêtres natives, `interface-actions.css` réserve une bande en haut du viewport. Le bouton est placé 8 px au-dessus de l’angle supérieur droit visible de l’encadré, dans la couche modale du navigateur. Il reste accessible pendant le défilement du contenu. Les animations de translation du conteneur sont remplacées par un léger fondu afin de ne pas décaler son repère de positionnement. Le mode de réduction des animations est respecté.

Un observateur prend en charge les fenêtres créées dynamiquement, leur réouverture et les changements de dimensions. La position est recalculée lors du redimensionnement ou du défilement. Les formulaires, le focus natif et la fermeture par Échap sont conservés.

```js
// Après une modification de mise en page spécifique, si nécessaire :
externalModalClose.refresh();
```

Validation : `tests/personal-exercise-delete-browser.py` contrôle confirmation, compatibilité de stockage, suppression persistante, conservation des séances, nouvelles copies et échecs d’écriture. `tests/external-modal-close-browser.py` vérifie la position externe, la taille et l’accessibilité réelle au clic, les réouvertures et les règles de refus de fermeture, sur ordinateur et téléphones de 390/320 px. Les tests existants de séances, composition et fiches importées vérifient les usages autour de ces fenêtres.


## Fermeture globale et rouge du logo

Les croix utilisent la variable unique `--club-logo-red: #e41f28`, soit RGB(228, 31, 40). Cette valeur est relevée dans `assets/club-logo.jpg`, le logo utilisé par défaut dans l’en-tête : c’est sa teinte rouge la plus fréquente, avec 71 755 pixels de cette couleur. Les couleurs de classification des exercices et de suppression ne sont pas modifiées.

La détection couvre désormais les boutons et liens de fermeture, les libellés longs comme « Fermer cette fenêtre », les entrées de formulaire et les panneaux portant `role="dialog"`, `role="alertdialog"` ou `data-closable-panel`. Une seule croix est affichée par encadré : les commandes « Fermer » supplémentaires sont masquées visuellement, en conservant leurs nœuds et leurs gestionnaires. Les actions Annuler restent disponibles lorsqu’elles ne constituent pas l’unique contrôle de fermeture. Les libellés accessibles et les règles de protection de saisie restent conservés.

`tests/global-close-style-browser.py` compare la variable visuelle avec les pixels du logo, vérifie la croix extérieure rouge, les libellés longs et liens, l’absence de commandes « Fermer » en doublon et le maintien des gestionnaires d’origine sur ordinateur et mobile.
