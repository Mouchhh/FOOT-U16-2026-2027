# Organisation des bilans · bleu et blanc

L’espace Bilans présente cinq étapes : **Le match**, **Analyse**, **Joueurs**,
**Plan d’action**, **Synthèse**. Analyse contient deux volets : jeu/suivi sportif,
et collectif/suivi humain. Les six clés historiques du document et les contenus
restent conservés ; seule la navigation principale regroupe les deux analyses.
Précédent/Suivant suit les cinq étapes, y compris depuis le volet humain.

En haut, le vrai sélecteur des bilans enregistrés rejoint les boutons Nouveau,
Enregistrer et PDF. Les actions de renommage, copie et suppression restent dans
le volet de gestion des bilans. Aucun sélecteur ni stockage supplémentaire n’est
créé. Le titre du bilan est également accessible dans La rencontre.

Le match présente deux cartes : résultat (score final, résultat calculé,
mi-temps) et rencontre (adversaire, date, compétition, lieu, organisation, titre).
Elles sont côte à côte sur ordinateur et empilées sur téléphone. Les autres
champs restent dans le formulaire détaillé. Les premiers enseignements restent
accessibles dans un volet repliable, avec le lien vers la séance suivante.
Les champs rapides et détaillés écrivent dans le même document.

La palette est le bleu et le blanc du club. Les repères de navigation ont un fond
bleu pâle et une étape active blanche. La page défile normalement, sans imposer
un petit cadre de saisie sur ordinateur portable. Les documents imprimables et
les données de sauvegarde gardent leur contenu.

## Vérifications

`tests/report-layout-browser.py` : cinq étapes, score/adversaire en direct,
organisation des deux cartes, saisie du suivi humain conservée dans la synthèse,
ordre des étapes, sauvegarde réelle et rechargement. Affichage à 320, 390, 844 et
1 366 pixels sans débordement horizontal.

Les suites de bilan final, recherche documentaire, navigation par tâches,
parcours hebdomadaire et liens Match → bilan → séance passent également. Les
anciens tests de saisie rapide déplient explicitement les premiers enseignements,
désormais regroupés sous les faits du match.
