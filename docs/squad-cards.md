# Effectif en cartes

L’onglet **Votre effectif** ouvre la page **Mes joueurs**. Un bandeau photographique du club accueille le titre. Le bouton **Nouveau
joueur** est placé dans cet en-tête, puis viennent les filtres Tous, Gardien,
Défenseur, Milieu et Attaquant avec leurs compteurs. Les compteurs portent sur
l’effectif enregistré, indépendamment de la recherche. Une rubrique Poste à
préciser permet de retrouver les fiches sans poste standard sans les modifier.

Chaque carte montre la photo ou la première lettre du nom, le nom, le numéro et
le poste. Le pied préféré est facultatif : droit, gauche ou les deux. Aucune
valeur n’est inventée pour les fiches existantes. Le champ optionnel est validé
dans le document d’effectif et conservé avec lui ; pas de nouveau stockage ni de
nouvelle table. Les postes personnalisés historiques restent conservés dans
l’éditeur.

Les actions Modifier, Utiliser dans la composition et Retirer restent
accessibles. La suppression conserve sa confirmation. Recherche et récupération
des joueurs de la composition restent disponibles sous les filtres. Quand le
répertoire est vide, les cartes de composition restent identifiées comme des
fiches à créer ; elles ne sont pas comptées comme des joueurs enregistrés.

Les cartes sont disposées en grille sur ordinateur et passent à une colonne
sur petit écran. La palette reste bleue et blanche.

## Vérifications

`tests/squad-cards-browser.py` : initiales, compteurs exacts, filtre de poste,
recherche combinée, postes historiques, enregistrement/rechargement du pied
préféré, annulation d’une suppression et grille sans débordement à 320, 390, 844
et 1 366 pixels.

Les suites de gestion de l’effectif, de page Effectif et de navigation passent
également : photos, copie dans la composition, banc, profils distincts, stockage
indisponible, partage simulé, historique et rechargement.
