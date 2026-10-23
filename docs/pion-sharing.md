# Enregistrer et partager une explication · pions

23 octobre 2026.

1. Terrain & tactique → Explications · pions et animations : placer les pions,
   tracer ses flèches et préparer les étapes.
2. Suivant jusqu’à Enregistrer, ouvrir & exporter. Donner un nom, puis cliquer
   **Enregistrer l’explication**. Le départ, les pions, la visibilité des adversaires,
   les actions de chaque étape, la vitesse et le choix de lecture sont conservés.
3. Dans l’espace connecté, attendre **Enregistré et partagé**. Hors connexion,
   l’envoi reste en attente. Le bouton **Voir les explications du club** ouvre
   directement la liste filtrée.
4. Un collègue ouvre Travail du club → Documents partagés, choisit le type
   **Explications · pions**, puis **Consulter**. Il peut examiner les étapes sans
   modifier l’original et cliquer **Créer une copie** pour ouvrir son propre tableau.
5. La copie a un nouvel identifiant et un nouveau nom ; elle peut être renommée,
   jouée et modifiée dans Explications · pions. Supprimer sa copie ne supprime pas
   celle du collègue. Les sauvegardes du compte se retrouvent sur un autre appareil.

L’explication est autonome : aucune composition, photo de joueur, séance ou rapport
n’est inclus. Les compositions et leurs compteurs restent distincts. Le tableau
remplacé lors de l’ouverture est récupérable depuis Mon espace · agenda → Brouillons
& récupération. Un brouillon simplement déplacé n’est pas partagé : il faut enregistrer.

Les anciennes séquences nommées locales restent lisibles. Lors de l’enregistrement
ou de la suppression explicite dans cette bibliothèque, le contenu restant passe
vers la bibliothèque canonique protégée par le journal de sauvegarde. L’ancien
cache n’est retiré qu’après écriture réussie. Un ancien profil local doit être
importé explicitement dans le compte connecté pour être partagé.

## Vérification technique

Les explications utilisent le stockage versionné des documents tactiques existant,
avec un sous-document `pionExplanation` validé. Elles ne nécessitent pas de nouvelle
requête SQL. Le type visible est Explications · pions ; le type de stockage demeure
`composition`, avec liste de joueurs et flèches de composition vide. Le dessin et
l’animation restent dans le sous-document autonome. Les identités imbriquées sont
vérifiées avant ouverture ; les copies reçoivent des identités cohérentes.

Tests Chromium avec Supabase simulé : `tests/pion-sharing-browser.py` (deux comptes,
second contexte pour le même compte, étapes et flèches personnelles, aperçu en
lecture seule, copie indépendante, composition intacte, quota, hors ligne/reprise,
rechargement, suppression isolée et migration locale), `custom-sequence-browser.py`,
`simple-library-browser.py`, `club-network-browser.py`, `save-reliability-browser.py`
et `club-completion-browser.py`.
L’essai sur deux comptes et deux appareils réels du club reste à effectuer ; aucune
base de production n’a été modifiée par ces tests.
