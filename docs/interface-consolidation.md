# Consolidation du parcours éducateur

La navigation et les modules existants sont conservés : accueil minimal, sidebar
sur ordinateur et barre inférieure tactile, profils éducateurs avec documents
sur une seconde page et sélection d'équipe. Les causeries et bilans terminés
restent consultables sans réouverture automatique de leur fenêtre de travail.
Aucune migration SQL n'est nécessaire pour cette consolidation.

## Bilan

`report-structure.js` centralise les nouveaux blocs visuels et leur rendu dans
la synthèse/export. `reports.js` garde le modèle, la validation et la sauvegarde.

- Analyse : deux cartes offensif/défensif, chacune avec points forts et progrès.
  Les champs grandissent avec la saisie. Les évaluations et compléments restent
  accessibles dans une section repliée ; les anciennes périodes ne sont plus
  des champs du formulaire actif.
- Plan d'action : un seul bloc Séances avec Objectif et Exercice prévu. Le message
  au groupe a son propre bloc et une copie exacte via le presse-papiers. En cas
  de refus du navigateur, le texte est sélectionné pour une copie manuelle.
- Suivi individuel : retrait confirmé, limité au bilan courant. La fiche dans
  l'effectif et les compositions restent intactes. L'effectif possède déjà une
  action Retirer avec confirmation distincte.

`plan.sessionObjective` et `plan.sessionExercise` sont des chaînes optionnelles
pour rester compatibles avec les bilans historiques. Elles passent par les
mêmes sauvegardes par équipe et sont incluses dans la synthèse et le contexte de
l'assistant. L'objectif est repris par la préparation de séance ; l'exercice
prévu est conservé dans les notes lorsqu'une suggestion compatible est ajoutée.
Aucun exercice n'est inventé si la bibliothèque ne fournit pas de proposition.

Les anciens champs `session1` à `session3`, `success`, `owner`, `firstHalf` et
`secondHalf` restent dans les anciens documents. Seuls les textes réellement
renseignés apparaissent en notes antérieures repliées et dans les exports. Aucun
ancien contenu n'est effacé ni reclassé automatiquement en offensif/défensif.
Les anciens champs superflus ne sont plus proposés à la saisie.

## Canva

PowerPoint reste à côté de Causerie · Canva et absent du panneau Canva général.
Le connecteur existant crée une présentation dans le compte autorisé du coach.
Cette consolidation ne fabrique pas de lien de modèle et ne publie pas une
intégration Canva en brouillon : l'accès aux autres comptes dépend toujours de
l'autorisation et de l'examen Canva. Aucun lien personnel administrateur n'est
substitué aux présentations propres à chaque compte.

## Vérification

Le test `report-consolidation-browser.py` couvre sauvegarde/rechargement, anciens
bilans, synthèse, presse-papiers et refus, annulation/confirmation du retrait,
indépendance de l'effectif et de la composition, et mise en page ordinateur/mobile.
Les tests existants couvrent également la fin de document, l'export PPT réel,
les profils éducateurs/équipes, les cartes d'effectif et la navigation responsive.
