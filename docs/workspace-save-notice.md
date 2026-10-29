# Étape 4 — Comprendre et retrouver son enregistrement

Un bouton d’état accompagne les rubriques Composition, Tactique, Séances et Bilans. Il ouvre une fenêtre avec le statut du document courant, le bouton habituel d’enregistrement et un accès à la récupération des brouillons remplacés. Il est absent de l’accueil, de l’agenda, du Club et du tableau de pions, qui conserve ses commandes de séquence existantes.

- **Saisie en cours / à enregistrer** : un champ de séance n’est pas encore appliqué à la version conservée.
- **Saisie à vérifier** : le formulaire de séance ou le document n’est pas valide.
- **Brouillon local / Modifications à enregistrer** : la version courante est retrouvée dans le brouillon de cet appareil, mais pas dans la bibliothèque enregistrée.
- **Enregistré ici** : le contenu courant correspond au document de la bibliothèque locale. Ce libellé ne confirme jamais le partage au club.
- **Conservation / Stockage à vérifier** : aucune égalité avec une version conservée n’a pu être confirmée ou la lecture locale échoue.

La comparaison ignore les horodatages `updatedAt` et l’ordre des clés. Elle conserve l’ordre des listes et compare les contenus. La lecture des bibliothèques ne change pas la référence utilisée par le contrôle des écritures concurrentes. La fenêtre réutilise les boutons existants, sans nouvelle sauvegarde automatique ni changement de format. L’état de partage est présenté séparément comme celui de l’ensemble des documents enregistrés ; il ne permet pas de déduire qu’un nouveau brouillon est partagé.

Validation : `tests/workspace-save-notice-browser.py` couvre composition, séance et bilan, saisie non terminée, champ incomplet, modification après enregistrement, rechargement, échec de stockage et nouvelle tentative, accès à la récupération, distinction avec un état global de partage positif, et fenêtres aux formats 320, 390, 844 et 1280 px. Contrôle visuel à 1366×768 et 390×844. Les tests de confort, passages entre espaces, navigation et fiabilité des sauvegardes ont aussi été exécutés. Le test de récupération historique vérifie désormais l’accès aux commandes par défilement dans les panneaux ; il ne suppose plus que toutes les commandes tiennent simultanément dans une hauteur fixe.

Ces validations utilisent Chromium et des services simulés. Elles ne prouvent pas une synchronisation sur les appareils réels du club. Les copies locales restent dépendantes du stockage du navigateur ; l’étape n’ajoute pas de sauvegarde indépendante.
