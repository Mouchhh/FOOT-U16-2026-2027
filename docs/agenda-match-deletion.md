# Actions directes dans l’agenda

Le clic droit sur un événement ouvre un menu : modifier les informations, supprimer de l’agenda, ouvrir le document et créer une séance. Pour une rencontre, les actions Préparer la causerie et Créer ou ouvrir le bilan sont proposées. Une journée vide propose causerie, bilan ou séance à cette date. Un bouton Actions sur les cartes détaillées donne accès au même menu sur téléphone. Actions du jour ouvre les propositions de création pour la date sélectionnée. Le menu se ferme avec Échap ou au clic extérieur et se parcourt avec les flèches, Début et Fin.

La modification directe concerne le titre, la date, l’heure et le lieu de l’événement **dans l’agenda personnel sur cet appareil**. Les données FFF, les séances et bilans enregistrés restent conservés. L’interface le précise dans le formulaire. Le calendrier fusionne les modifications par identifiant stable et garde une seule entrée pour un match préparé, y compris quand sa date a changé. L’ouverture d’une causerie déplacée réutilise sa préparation et met à jour la date du brouillon en passant par la récupération existante.

La suppression retire uniquement l’événement affiché dans cet agenda. Elle préserve sa préparation, ses notes et son document source. « Rétablir les événements » annule toutes les suppressions locales du coach. Les anciennes suppressions de rencontres restent compatibles. Les clés incluent celles du brouillon et sa signature pour éviter qu’un simple enregistrement le fasse réapparaître.

Stockage : `vestiaire-agenda-removed-matches` (clé historique conservée) et `vestiaire-agenda-event-edits`, via le stockage du coach. Chaque collection est limitée à 1 000 entrées, contrôlées à la lecture. Une écriture impossible ne supprime ni ne modifie l’affichage. Ces réglages ne sont pas synchronisés entre appareils.

La causerie reprend la bonne rencontre et sa préparation existante. Le bilan reprend date, heure, adversaire, catégorie, compétition et score lorsqu’ils sont connus. Un bilan déjà lié est rouvert. Une préparation étrangère au match n’est pas copiée dans un nouveau bilan. Créer une séance ouvre un brouillon vierge daté ; elle apparaît au calendrier après enregistrement. Le remplacement des brouillons passe par le mécanisme de récupération existant.

Validation : `python tests/agenda-match-actions-browser.py` couvre l’ouverture sans suppression, modification et rechargement, causerie, réutilisation d’un bilan, nouvelle séance et journée vide, séances enregistrées, menu mobile, suppression et rétablissement, échec de stockage et séparation des coachs. Les tests du calendrier et du collage des rencontres vérifient les parcours existants.

## Déplacer par glissement

Les événements du calendrier mensuel sont déplaçables à la souris : maintenir le clic puis déposer sur un autre jour. Sur écran tactile, maintenir environ 350 ms, puis glisser et relâcher sur une date. Un tap rapide conserve l’ouverture habituelle. Le jour cible est mis en évidence ; Échap, un geste annulé ou un dépôt hors calendrier ne déplace rien. Le menu Modifier reste disponible comme alternative au geste.

Le déplacement réutilise les métadonnées locales ci-dessus : titre, horaire, lieu et clé stable sont conservés, seule la date change. Le calendrier sélectionne la nouvelle journée et change de mois si le dépôt concerne une case du mois voisin. Les documents d’origine ne sont pas déplacés. L’échec du stockage conserve la date précédente. Le geste est limité aux événements et au profil de l’agenda où il a démarré.

`python tests/agenda-drag-browser.py` vérifie le glisser-déposer natif, les gestes tactiles via Chrome DevTools, les dépôts sans effet, le rechargement, le mois voisin, la conservation des métadonnées et l’échec de stockage.
