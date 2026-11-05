# Widgets dynamiques de l’accueil

`home-live-widgets.js` construit trois cartes immédiatement sous le bandeau de bienvenue. `home-live-widgets.css` est limité à ces cartes et rétablit uniquement leur visibilité, sans réafficher les anciens outils. Le diaporama de fond reste actif.

- Présence : trois dernières occurrences d’entraînement passées de l’agenda de la saison active, récurrences comprises, indépendamment de leur préparation. Pointages validés dédoublonnés par date/heure depuis le modèle de statistiques existant. Le taux porte sur les réponses connues ; les présences manquantes sont signalées sans compter comme absences. Le nombre de joueurs est celui des joueurs distincts présents. Évolution mensuelle exprimée en points de pourcentage, uniquement si les deux mois ont des pointages.
- Forme : cinq derniers bilans de match validés, de la saison et de l’équipe actives, avec score numérique. Dédoublonnage selon la filiation de rencontre existante. Pastilles dans l’ordre chronologique, plus récent à droite. Points sur le nombre réel de matchs disponibles, sans inventer cinq résultats. Prochain match issu de l’agenda canonique.
- Séance : prochaine occurrence de l’agenda, thème et horaire enregistrés. Conseil repris de la priorité du dernier bilan validé (puis objectif de séance). Il ne s’agit pas d’un appel à une IA externe. Le bouton utilise les fonctions d’ouverture existantes, avec leurs protections du document en cours.

Données dérivées, aucune écriture supplémentaire ni valeur fictive. Rafraîchissement lors des interactions, enregistrements, retours à l’accueil, changements de contexte et toutes les minutes lorsque l’accueil est actif.

Couleurs demandées pour ce module uniquement : rouge `#e31b23`, bleu `#0055a5`, blanc. Verre marine `rgba(11,25,44,.85)` avec flou de 10 px ; fond suffisamment opaque lorsque le flou n’est pas pris en charge. Trois colonnes sur grand écran, deux sur tablette, une sur téléphone.

Vérification : `python3 tests/home-live-widgets-browser.py` avec serveur local port 3016. Cas couverts : absence de données, trois séances, réponses connues, exclusion des brouillons et autre équipe, dédoublonnage, conseil, actualisation sans rechargement, ouverture de séance et absence de débordement horizontal sur trois tailles d’écran.
