# Étape 3 · Accueil

Terminée le 21 octobre 2026. Vérifications dans Chromium, ordinateur 1366 × 768
et téléphone 390 × 844, avec et sans photos disponibles.

- [x] Trois cartes : prochain rendez-vous, prochain match, travail à reprendre.
- [x] Séances enregistrées triées par créneau ; une séance en cours reste proposée,
  une séance terminée disparaît. Un brouillon vide ne devient pas un rendez-vous.
- [x] Calendrier basé sur Europe/Paris même depuis un navigateur dans un autre fuseau,
  avec vérification du changement de jour.
- [x] Matchs issus des compositions datées ; vues épurées et annuaires exclus.
  Le brouillon courant prévaut sur sa version enregistrée et les doublons sont retirés.
- [x] Un match conserve sa date seule : aucune heure de rencontre inventée.
- [x] Reprise des préparations réellement commencées ; les rapports simplement
  initialisés ou horodatés sans contenu ne sont pas proposés.
- [x] Ouvrir une composition enregistrée conserve le brouillon précédent dans la
  récupération existante. Annuler l’ouverture d’une séance laisse l’accueil affiché.
- [x] Les cinq raccourcis sont conservés dans « Tous mes outils », replié au départ.
  La duplication de la dernière séance reste disponible dans ce panneau.
- [x] Photos, commandes de diaporama, pause, réduction des animations et repli sans
  photos conservés. L’activité des éducateurs reste dans sa page existante.
- [x] Les trois actions principales tiennent dans le premier écran de contenu sur
  ordinateur. Sur téléphone, les cartes s’empilent avec des commandes tactiles.
- [x] Navigation Précédent/Suivant et séparation des espaces par coach conservées.

## Vérifications reproductibles

```sh
node --check home-dashboard.js
node --check club-home.js
python tests/home-dashboard-browser.py
python tests/club-completion-browser.py
python tests/home-slideshow-browser.py
python tests/club-network-browser.py
```

Les intégrations Supabase utilisent des réponses simulées : aucun compte ou document
réel n’a été modifié par les tests. La prochaine séance utilise la bibliothèque du
coach actif ; les préparations non enregistrées restent sur cet appareil. Cette
livraison ne crée pas de nouvelle synchronisation des brouillons ni de migration SQL.
