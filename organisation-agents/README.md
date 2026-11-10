# Organisation des agents — Le Vestiaire

Treize rôles définis dans [agents.json](agents.json), avec une fiche par agent dans [agents/](agents/). Les numéros organisent les noms ; ils ne constituent pas un ordre d’exécution obligatoire.

## État réel

Disponible : fiches des agents, charte commune, contexte du site, génération de missions et consolidation des rapports reçus.

Non activé : appels à un modèle, exécution autonome, planification quotidienne, accès aux comptes, envoi de messages et création de conversations ChatGPT. Aucun abonnement ni coût API n’est engagé par ces fichiers. Le script est un outil de coordination, pas un moteur d’agents.

## Utilisation immédiate

Depuis la racine du dépôt :

```sh
python3 scripts/agents.py list
python3 scripts/agents.py brief 03-donnees --mission 'Examiner les sauvegardes et proposer trois améliorations sans modifier la production.'
```

Le deuxième appel produit les instructions complètes à transmettre à un agent Codex ou à coller dans une conversation ChatGPT. Le modèle de rapport indique les champs à remplir avec les résultats réels.

Conserver les rapports réels dans un dossier privé **extérieur au dépôt et à GitHub Pages**, puis consolider :

```sh
python3 scripts/agents.py report --date 2026-11-10 --input /chemin/prive/rapports
```

La sortie Markdown peut être donnée au directeur pour analyse, puis au propriétaire pour validation. Les rapports manquants sont indiqués. Les décisions ont un identifiant stable par agent et par date tant que leur ordre reste inchangé ; après revue, figer le rapport et joindre la version du livrable à la validation.

## Organisation dans ChatGPT

Créer manuellement le projet « Le Vestiaire — Direction et pôles ». Ajouter CHARTE.md, CONTEXTE.md et les fiches des agents comme documents de référence. Créer les conversations avec les identifiants de `agents.json`, puis coller le brief correspondant dans chacune. Ajouter « 00 · Rapport et validations » pour les arbitrages.

Une conversation n’a pas automatiquement accès au travail des autres : transmettre explicitement les rapports au directeur. Les projets/GPT ne sont pas créés par ce dépôt.

## Cycle de travail prévu

1. Le directeur reçoit les objectifs approuvés et prépare des missions limitées.
2. Les pôles réalisent leurs tâches et proposent des améliorations ; une tâche de code utilise une branche dédiée.
3. Qualité et sécurité relisent les travaux concernés.
4. Le directeur consolide faits, preuves, limites et décisions ; le propriétaire valide, modifie ou refuse chaque proposition.
5. Seules les actions explicitement approuvées peuvent ensuite être publiées par un exécutant autorisé.

## Activation future de l’autonomie

Configuration désactivée par défaut. L’heure de 19 h, Europe/Paris, est une proposition, pas un rendez-vous programmé. Changer `automation_enabled` seul ne lance rien.

Il reste à sélectionner un service d’exécution avec modèle/API, un plafond de budget, l’horaire et le canal privé de remise du rapport. Ne jamais mettre de clé dans ChatGPT ou dans le dépôt : utiliser le gestionnaire de secrets du service. L’exécutant devra imposer des limites de temps/coût, des permissions en lecture par défaut, des branches isolées, des tests et un arrêt d’urgence. Les migrations, publications, dépenses et contacts externes doivent rester derrière une approbation effective.

Aucune collecte de données clients ou de mineurs pour alimenter ces agents par défaut. Aucun workflow planifié n’est installé tant que ces éléments ne sont pas configurés.
