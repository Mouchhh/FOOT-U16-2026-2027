# Navigation par menus déroulants

Les six rubriques principales disposent d'un menu ouvrant directement leurs
sous-parties. Sur ordinateur, passer la souris sur le titre ouvre le menu sans changer le document ;
sur écran tactile, le menu s’ouvre au toucher. Un clic reste possible au bureau ;
choisir une entrée ouvre la sous-partie correspondante.

- Accueil : tableau de bord, activité des éducateurs.
- Terrain : composition, vue épurée, explications/pions, préparation du match,
  Impacteurs / Finisseurs, sauvegardes/exports et joueurs enregistrés.
- Séances : équipe/niveau, thèmes/objectifs, groupe/rendez-vous, déroulé,
  Bible, séances enregistrées et création libre.
- Agenda : vue d'ensemble, calendrier, joueurs enregistrés.
- Rapports : les six rubriques du rapport et la bibliothèque de rapports.
- Club : éducateurs, documents partagés, compte/partage.

Les menus utilisent les gestionnaires, pages et formulaires existants. Aucun
champ ni document n'est copié. Les anciens contrôles restent dans le DOM pour
les raccourcis et les fonctions existantes ; les barres répétées de sous-onglets et les indicateurs d’étapes sont masqués.
Les boutons Précédent/Suivant sont conservés pour parcourir les pages liées,
y compris les actions de fin de parcours (enregistrer ou retour à l’accueil).
Les sauvegardes et exports restent accessibles par leur rubrique et par les
commandes dédiées existantes. Les vérifications d'accès au club sont conservées.

Les panneaux sont ancrés aux boutons mais montés dans le corps du document,
pour éviter la découpe par la barre de navigation mobile. Ils se ferment au clic
extérieur, avec Échap, au changement de taille ou à la sélection d'une entrée.
Flèches haut/bas, Début/Fin et Tab restent utilisables au clavier ; le choix courant
est indiqué. La navigation vers une page remet son contenu en haut ; l'accès au
banc cible directement son panneau au lieu d'imposer une recherche dans la page.

`tests/workspace-dropdowns-browser.py` vérifie chaque entrée des six menus,
l'absence de changement de rubrique à l'ouverture, les brouillons conservés,
les routes privées (identité/transport simulés), le clavier, les dimensions
mobiles et les identifiants uniques. `tests/terrain-size-browser.py` effectue des
changements répétés via les vrais menus et contrôle les tailles du terrain et
des pions. `tests/workspace-polish-browser.py` vérifie aussi la présentation et
la pagination de la Bible ; sa préparation utilise les routes internes, tandis
que les interactions des menus sont vérifiées par le test dédié.

Aucun changement SQL ou de structure des documents enregistrés.

Le survol utilise une fermeture différée de 250 ms et annule celle-ci lorsque
la souris rejoint le panneau. Un clic après survol ne referme pas immédiatement
le menu. Sur un appareil tactile, un second toucher referme le menu.

`tests/workspace-hover-steps-browser.py` vérifie le survol sans clic, le passage
dans l’espace entre bouton et panneau, la fermeture à la sortie, les six parcours
Précédent/Suivant, les données conservées et un contexte mobile avec toucher réel.
