# Terminer une causerie ou un bilan

La causerie comporte une action **Valider et fermer la causerie**. Le bilan propose **Terminer le bilan** dans son en-tête et à la dernière étape. Ces actions enregistrent le document dans la bibliothèque existante, confirment l’écriture du brouillon puis ferment les fenêtres liées et reviennent à l’accueil. **Enregistrer** reste une sauvegarde ordinaire qui permet de continuer le travail.

## État et persistance

Le document porte une métadonnée `documentCompletion` avec sa version, son type, la date de validation et une empreinte du contenu. L’empreinte sert uniquement à l’état d’interface, sans stocker une seconde copie des textes ou photos. Elle ignore les horodatages de brouillon, le contexte d’équipe et les métadonnées de validation du club. Une modification du contenu rend l’ancien état terminé inapplicable ; une copie avec un nouvel identifiant constitue un nouveau travail.

La métadonnée est enregistrée avec le document dans les bibliothèques et la file de synchronisation existantes : elle respecte l’isolation par coach et par équipe. La sauvegarde locale est suffisante pour fermer la vue, le partage au club continuant en arrière-plan avec son indicateur existant. Aucune confirmation de réception distante n’est inventée. Un quota, une validation invalide ou l’échec de conservation du brouillon garde l’éditeur ouvert et affiche l’échec ; les informations saisies restent disponibles.

## Réaffichage et historique

L’entrée dans un module ne rouvre pas automatiquement la fenêtre de choix pour le document terminé courant, y compris après rechargement et navigation arrière. Dans Match, Composition reste le point d’entrée. La section Causerie et le module Bilans affichent un encadré de consultation plutôt que le formulaire terminé. Le document n’apparaît plus parmi les travaux à reprendre de l’accueil ; une rencontre à venir reste naturellement dans l’agenda et le prochain match.

Les encadrés proposent **Relire / modifier**, la création d’un nouveau document et la sélection d’un document enregistré. Ces actions sont explicites : elles autorisent l’ouverture de l’éditeur. La création réutilise le choix Reprendre/Nouveau et l’archivage existants ; fermer ce choix n’ouvre ni ne remplace le document. Les liens de l’agenda et les versions précédentes restent utilisables pour consulter ou reprendre un document. Un nouveau match ou contexte n’est pas bloqué par la validation d’un ancien document.

## Intégration

- `document-completion.js` : état, validation, fermeture, cartes de consultation, historique et exclusion des travaux terminés de l’accueil.
- `document-completion.css` : cartes bleu/blanc avec accent `--club-logo-red`, adaptées au mobile ; les vues d’impression ne sont pas masquées.
- `document-entry.js` : branche d’entrée calme pour un document terminé, distincte des ouvertures explicites.
- `saveNamedComposition` et `saveReport` renvoient un résultat booléen pour confirmer la sauvegarde.

Le bouton original de fermeture de la fenêtre de choix garde son action et reçoit le libellé accessible **Fermer**, permettant au composant global de le positionner comme une croix rouge extérieure. Aucun contenu footballistique ni historique n’est supprimé.

Vérifications : `tests/document-completion-browser.py`, `tests/document-entry-browser.py`, tests de sauvegarde et de parcours de bilan. Le nouveau test couvre validation/retour accueil, persistance, réouverture volontaire, nouveau document, conservation des notes et joueurs, échecs de stockage et petits écrans.
