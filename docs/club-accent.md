# Rouge tertiaire du club

`club-accent.css` ajoute une couche de présentation indépendante, chargée après les styles des modules. Le jeton `--club-accent` reprend `--club-logo-red` : **#e41f28**, sans introduire de nouvelle nuance rouge.

Les touches rouges sont limitées au repère fin de navigation active, aux soulignements des sous-onglets, à quelques actions secondaires de création/configuration/copie, au liseré de la carte du prochain match, au jour sélectionné dans l’agenda et aux badges de documents. Les boutons secondaires restent blancs, avec texte et contour rouges ; seul leur survol remplit le bouton. Les boutons principaux et le fond de navigation actif restent bleus.

Aucune règle ne cible les pions, terrains, schémas, couleurs d’intention des exercices ou états des rendez-vous. Les croix extérieures conservent le rouge du logo. Les dimensions et positions du menu latéral/inférieur ne changent pas : seule son ombre intérieure de sélection est ajustée suivant l’orientation.

Vérification visuelle et navigateur sur ordinateur et téléphone : bleu dominant, rouge exact, conservation des cinq codes couleur d’exercices, croix extérieure et absence de débordement. Les tests existants d’alignement de navigation couvrent la structure commune.
