# Classement et confrontations FFF à l’accueil

Le coach a indiqué U17 Départementale 1. Le lien FFF déjà présent est proposé pour ce contexte ; les autres catégories n’héritent pas de ce lien. Les données du classement sont isolées par éducateur et équipe.

L’accès réseau à epreuves.fff.fr a renvoyé `CONNECT tunnel failed: 403 Forbidden` depuis l’environnement de développement, y compris lors de la tentative avec autorisation réseau. Aucun classement réel n’a donc été récupéré ou publié, et aucune synchronisation automatique n’est annoncée.

Le widget affiche un état à importer sans inventer de place ni calculer un classement à partir des seuls résultats du Stade Mayennais. Le coach peut ouvrir sa source FFF puis importer une page HTML enregistrée, coller le tableau avec ses en-têtes (tabulations ou points-virgules), ou importer un JSON. Les valeurs de points officiels sont conservées, y compris les éventuelles pénalités. La différence de buts peut être calculée si seuls BP et BC sont fournis.

Colonnes : rang, équipe, points, joués, victoires, nuls, défaites, buts pour/contre et différence. Les logos FFF fournis dans la page sont repris ; les logos absents ont un monogramme, et l’équipe du club utilise son écusson local. La date indiquée est celle de l’import, pas une fausse preuve de consultation de la FFF en direct.

Les confrontations affichent soit les matchs du jeu de données FFF importé, soit les bilans du coach validés, avec leur source distincte. En l’absence d’historique, le widget le dit. Le calendrier existant reste la source de l’adversaire à venir.

JSON : `{ "rows": [{ "rank": 1, "name": "Nom officiel", "points": 0, "played": 0, "wins": 0, "draws": 0, "losses": 0, "goalsFor": 0, "goalsAgainst": 0, "goalDifference": 0, "logo": "https://cdn.fff.fr/..." }], "matches": [{ "date": "2026-01-01", "home": "Équipe A", "away": "Équipe B", "goalsHome": 0, "goalsAway": 0 }] }`. Les exemples ne sont jamais chargés dans l’application comme résultats réels.

Vérification : `tests/home-fff-standings-browser.py` utilise uniquement des tableaux fictifs, vérifie les points conservés, les écarts de buts, la stabilité de la saisie, le cloisonnement et le mobile.
