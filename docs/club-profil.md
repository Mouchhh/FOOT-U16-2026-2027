# Compte, équipes et personnalisation du club (bêta éducateurs)

## Menu du compte
Le menu en haut à droite n’affiche que **« Mon profil »** (ouvre Paramètres → Mon profil). Préférences et déconnexion restent dans Paramètres → « Préférences & déconnexion ».

## Supprimer une équipe
- Menu des équipes : lien « Supprimer » sous chaque équipe ; Paramètres → « Configurer mon équipe » : « Supprimer cette équipe ». « À classer » n’est pas supprimable.
- Confirmation : nom de l’équipe et nombre de documents (bilans, séances, compositions, brouillons) effacés sur cet appareil ; les copies déjà partagées avec le club ne sont pas effacées.
- Effet (`coachTeamDelete`, `coach-teams.js`) : clés `…:team:<id>` effacées, enregistrements de l’équipe retirés des bibliothèques historiques et brouillons de base, équipe retirée du manifeste et ajoutée à `vestiaire-removed-teams` (fusionné avec les autres onglets) : elle ne réapparaît plus depuis d’anciens documents ou calendriers, et aucune écriture n’est plus acceptée pour elle (déchargement de page, autre onglet). Supprimer l’équipe ouverte bascule sur une autre.

## Couleurs et logo du club
Paramètres → Détails du club → « Couleurs et logo du club » :
- **Couleur principale** et **couleur secondaire** (enregistrées avec la fiche club, `primaryColor` / `secondaryColor`). `club-theme.js` remplace dans les feuilles de style du site les bleus du club (#2855a2 et ses variantes), les marines (#142d50, #17385d, et #102e58 / #193c66 du filtre bleu des photos de l’accueil) et les rouges #e41f28 / #e31b23, y compris dans les variables CSS ; l’opacité est conservée. Une couleur trop claire est assombrie jusqu’à un contraste de 4,5:1 avec le texte blanc (indiqué sous le sélecteur). « Couleurs d’origine » rétablit le site. Les maillots / pions, terrains et schémas gardent leurs propres couleurs.
- **Logo** (PNG/JPEG/WebP, recadré 256 px) : remplace le logo d’origine partout où il est affiché (en-tête, profil, favicon) ; « Retirer le logo » revient au logo d’origine.

## Bibliothèque photos du club
Paramètres → Détails du club → « Bibliothèque photos » (`club-photo-library.js`) : ajout de plusieurs photos (JPEG/PNG/WebP, 20 Mo max, redimensionnées à 1600 px, sans métadonnées), nom modifiable, suppression ; 30 photos max, enregistrées immédiatement dans ce navigateur (IndexedDB, par coach).
Dans les causeries (`causerie-visual-library.js`), quand la bibliothèque contient des photos, elles remplacent les photos d’origine du club sur la couverture, le contexte, les idées fortes, les CPA et la conclusion ; les visuels personnels de l’équipe restent prioritaires. Affichage sur le site : pas encore décidé, non fait.

## Vérification
`tests/club-profile-browser.py`, `tests/team-navigation-browser.py`.
