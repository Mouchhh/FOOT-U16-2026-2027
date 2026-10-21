# Étape 7 · Travail du club

Contrôles du 21 octobre 2026 dans Chromium, sur ordinateur et téléphone.

- [x] Recherche immédiate par nom de document, sans différence de casse ou d’accents.
  Plusieurs mots peuvent être combinés. Aucun téléchargement du contenu n’est
  nécessaire pour filtrer les titres déjà disponibles.
- [x] Les filtres éducateur et type se combinent avec cette recherche et les
  critères facultatifs : catégorie, thème de séance, date et repères proposés.
- [x] Sélectionner une carte d’éducateur déclenche les mêmes filtres que le sélecteur,
  avec passage à Documents partagés ; Tous les éducateurs rétablit la recherche commune.
- [x] Lecture détaillée limitée à 50 nouveaux documents par demande, trois lectures
  simultanées au maximum ; poursuite explicite pour les lots suivants.
- [x] Recherche partielle distinguée de recherche terminée ; documents indisponibles
  signalés. Un résultat vide ne prétend pas que les documents non examinés sont absents.
- [x] Métadonnées liées au compte, au document et à sa révision. Cache et critères
  effacés à la déconnexion ; les lectures anciennes ne réinjectent pas de résultat
  après changement de session.
- [x] Document d’un autre coach consulté en lecture seule ; copie dans son propre
  espace avec les protections existantes des brouillons. Modification et suppression
  réservées à l’auteur dans l’interface et le service existant.
- [x] Brouillons locaux distingués des documents enregistrés et partagés ; récupération
  accessible sans publier automatiquement un brouillon.
- [x] Repères identifiés comme proposés par leur auteur ; aucune validation fédérale
  ou institutionnelle inventée.
- [x] Présences, dernières connexions et sous-pages existantes conservées.

## Tests

```sh
node --check club-document-index.js
node --check club-network.js
python tests/club-work-browser.py
python tests/completion-report-search-browser.py
python tests/club-network-browser.py
```

Les tests utilisent Supabase simulé et deux navigateurs : consultation, copie,
partage, conflits, coupures, reprise, déconnexion et retrait d’accès. Ils ne modifient
aucun compte ou document de production. Les règles d’accès du serveur restent celles
du service Supabase existant ; aucune migration SQL n’est ajoutée.

La recherche par nom concerne les titres, pas le texte intégral des documents.
La recherche détaillée lit les documents à la demande pour en extraire uniquement
les métadonnées gardées en mémoire ; elle ne recherche pas les brouillons personnels.
