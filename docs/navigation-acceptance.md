# Étape 2 · Navigation et simplicité des parcours

État : étape 2 terminée et cochée le 21 octobre 2026, vérifiée avec Chromium sur ordinateur, format téléphone
et contexte tactile. Les tests de comptes et de partage restent valides.

## Checklist

- [x] Les six menus donnent un accès direct aux sous-parties existantes.
- [x] Le survol ouvre le menu sans changer de page ; traversée du petit intervalle,
  fermeture différée, clic extérieur et touche Échap vérifiés.
- [x] Sur écran tactile, toucher pour ouvrir/fermer puis sélectionner une destination.
- [x] Flèches haut/bas, Début/Fin dans les menus ; gauche/droite entre menus voisins ;
  Tab quitte le panneau dans un ordre prévisible.
- [x] Le focus ne reste pas dans un menu masqué ; une fenêtre refermée depuis un
  sous-menu permet de reprendre au bouton d’origine.
- [x] Accès clavier direct au contenu et indication de la rubrique actuelle dans
  le titre de page et les attributs d’accessibilité.
- [x] Les recherches de la Bible et des séances reçoivent directement le focus.
- [x] Précédent/Suivant conservés sur les six parcours liés, sans copie des formulaires.
- [x] Retour/Avancer du navigateur retrouvent les pages internes, les critères de
  recherche et les brouillons courants ; les documents eux-mêmes ne sont pas
  remplacés par l’historique de navigation.
- [x] Rechargement : reprise de la page courante et des filtres dans le même onglet,
  y compris pour un compte privé. Une nouvelle connexion conserve l’accueil prévu.
- [x] Les critères de recherche des autres rubriques sont également retrouvés après
  un rechargement suivi d’un retour dans ces rubriques.
- [x] Un champ de séance invalide est révélé avant navigation et reste ouvert ;
  les boutons Retour/Avancer ne contournent pas cette protection.
- [x] Une fenêtre d’édition ouverte est conservée si Retour est utilisé : invitation
  à la fermer d’abord, sans changement silencieux du contexte derrière elle.
- [x] Menus contenus dans la fenêtre sur téléphone vertical et paysage court ;
  ouverture au-dessus du bouton lorsque la place disponible le demande.
- [x] Dimensions du terrain stables après changements de vue ; la Bible conserve
  sa présentation paginée et ses commandes visibles aux dimensions testées.
- [x] L’historique et les recherches sont séparés par coach, conservés en
  sessionStorage ; aucun jeton, mot de passe, photo ou corps de document n’y est copié.

## Tests exécutés

```sh
python tests/workspace-navigation-browser.py
python tests/workspace-dropdowns-browser.py
python tests/workspace-hover-steps-browser.py
python tests/workspace-polish-browser.py
python tests/terrain-size-browser.py
python tests/club-network-browser.py
python tests/club-account-access-browser.py
```

Le service Supabase est simulé dans les tests d’intégration ; les interactions
s’effectuent dans le navigateur réel. Aucun compte ni document de production n’a
été modifié par les tests. La mémoire des recherches concerne le même onglet et
le même compte ; elle n’est pas un document partagé entre éducateurs.

La conservation des pages dans l’historique n’est pas une restauration d’anciennes
versions des documents. Pour les brouillons remplacés, utiliser la récupération
existante. Aucun nouvel élément de saisie n’est masqué ou supprimé.
