# Étape 8 · Recette transversale du site

Contrôles du 21 octobre 2026. Cette recette vérifie les liaisons entre les rubriques
finalisées, en complément des tests propres à chacune. Elle ne signifie pas qu’un
site ne nécessitera plus jamais de maintenance.

## Parcours de finalisation suivi avec le coach

| Étape | Recette détaillée |
|---|---|
| 1 · Comptes et accès | [Comptes](accounts-acceptance.md) |
| 2 · Navigation | [Menus, historique et étapes](navigation-acceptance.md) |
| 3 · Accueil | [Rendez-vous et reprise](home-acceptance.md) |
| 4 · Terrain & tactique | [Terrains et exports](terrain-acceptance.md) |
| 5 · Bible de l’éduc | [Fiches et variantes](bible-acceptance.md) |
| 6 · Après-match | [Rapports et passage à la séance](reports-acceptance.md) |
| 7 · Travail du club | [Recherche, consultation et copie](club-work-acceptance.md) |
| 8 · Recette transversale | Présent document |

## Checklist vérifiée

- [x] Six menus : survol, clic, tactile, clavier, fermeture par Échap et positionnement
  sur téléphone vertical et paysage court.
- [x] Sur écran étroit, ouverture au clic/toucher pour éviter les menus involontaires
  au-dessus des commandes ; aucun menu ne s’ouvre derrière une fenêtre modale.
- [x] Toutes les sous-pages des menus restent accessibles sans dupliquer les formulaires.
- [x] Précédent/Suivant conservés dans les six parcours liés.
- [x] Retour/Avancer et rechargement retrouvent les pages et les recherches du coach.
- [x] Recherche par nom de document du club désormais incluse dans cette mémoire ;
  focus placé dans son champ à l’accès à Documents partagés.
- [x] Navigations répétées entre terrain, séance, rapport, agenda et accueil :
  valeurs de travail conservées à 1366 × 768, 1024 × 768 et 390 × 844.
- [x] Aucun débordement horizontal du document ni identifiant HTML dupliqué dans
  ces parcours ; une seule rubrique principale indiquée comme page active.
- [x] Champ obligatoire de séance invalide : changement de rubrique et retour
  navigateur protégés, sans disparition de la saisie.
- [x] Fenêtre d’édition ouverte conservée lors d’un retour navigateur ; focus rendu
  au menu d’origine après fermeture.
- [x] Terrain stable après plusieurs changements de vue et de page, pions lisibles.
- [x] Accès aux comptes : récupération, expiration, rechargement, retour au formulaire,
  autorisation et affichage mobile contrôlés avec service simulé.
- [x] Catalogue paginé, lecture agrandie, ajout et brouillon conservés, téléphone vérifié.

## Tests exécutés pour cette étape

```sh
node --check workspace-navigation.js
node --check workspace-dropdowns.js
python tests/site-final-browser.py
python tests/workspace-navigation-browser.py
python tests/workspace-hover-steps-browser.py
python tests/workspace-dropdowns-browser.py
python tests/terrain-size-browser.py
python tests/club-account-access-browser.py
python tests/workspace-polish-browser.py
```

Les tests sont exécutés dans Chromium. Les interactions tactiles sont simulées dans
un contexte mobile ; ils ne remplacent pas une recette matérielle sur Safari iPhone
ou tous les navigateurs et toutes les tailles possibles. Les tests de comptes ne
contactent pas les comptes réels et n’envoient pas d’e-mail. Les tests de partage,
d’export et de contenu restent documentés dans les recettes précédentes.

La mémoire des recherches est liée au coach et au même onglet, dans sessionStorage.
Elle n’est pas une sauvegarde partagée de document. Aucun changement Supabase requis.
