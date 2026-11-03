# Tiroirs de l’interface

`workspace-sheets.js` et `workspace-sheets.css` adaptent les dialogues existants sans recopier leurs formulaires ni remplacer les boutons. Sur grand écran avec pointeur précis, ils s’ouvrent à droite ; sur mobile, tablette ou écran tactile, ils montent depuis le bas. Les fiches conservent un défilement interne, une fermeture rouge de 44 px dans l’en-tête et la marge nécessaire autour des titres.

Les formulaires de bilan et de causerie déjà intégrés à la page restent dans la page. Leurs validations continuent de fermer le travail actif et de revenir à l’accueil après sauvegarde réussie, via `document-completion.js`. Les fiches joueur, éditeurs, paramètres et outils ouverts autour utilisent les tiroirs. Leurs gestionnaires de sauvegarde et leurs erreurs restent inchangés : un éditeur qui ne peut pas enregistrer ne doit pas être masqué.

L’adaptateur conserve les signatures `showModal()` / `close()` utilisées par l’application. Les panneaux de contenu utilisent `dialog.show()` pour laisser le reste de la page utilisable et ne pas en modifier la largeur. Les confirmations de suppression/remplacement, conflits, noms et choix d’entrée gardent la modalité native, pour protéger le travail existant, mais leur présentation est également latérale. Les iframes d’exercices ne sont pas modifiées.

Échap sur un tiroir non modal émet un événement `cancel` annulable : les protections existantes contre la fermeture pendant un transfert ou avec des changements non sauvegardés restent actives. La dernière fenêtre ouverte reçoit Échap. Le focus revient au déclencheur quand aucun autre panneau n’est ouvert et que le coach/l’équipe n’ont pas changé. Le changement de session ferme les panneaux appartenant au contexte précédent.

Les transitions utilisent `@starting-style` et `allow-discrete`, avec repli sans animation sur les navigateurs qui ne les supportent pas. `prefers-reduced-motion` désactive les transitions. `close()` garde sa sémantique immédiate ; l’animation de sortie peut durer 240 ms pour les panneaux conservés dans le DOM. Les dialogues dont le code métier retire immédiatement le nœud se ferment immédiatement. Aucun délai artificiel ni copie visuelle du formulaire n’est ajouté.

Validation : `tests/workspace-sheets-browser.py` couvre placement PC/mobile, défilement et position de la croix, page non modale, Échap et garde de fermeture, enregistrement réussi/échoué, confirmations destructrices et transitions réelles. Les tests statistiques, suppression et validation des documents couvrent les parcours conservés.
