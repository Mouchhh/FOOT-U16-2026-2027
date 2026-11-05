# Bilan : extérieur, faits de jeu et saisie légère

## Domicile / extérieur

`report-match-location.js` rapproche le bilan et sa causerie du rendez-vous canonique de l’agenda : priorité à la clé de rencontre, puis correspondance unique par date et adversaire. La position de l’équipe du club dans les champs structurés `home` / `away` détermine le statut. Aucun stade en texte libre n’est utilisé pour deviner si le club reçoit.

La liaison de causerie reprend ce statut, et, lorsqu’ils sont disponibles, l’heure, la compétition, le terrain et la clé de rencontre. Le champ **Lieu du match** permet de choisir Domicile, Extérieur ou Terrain neutre. Une correction manuelle est conservée dans `matchVenueOverride` et reste prioritaire. Lors d’un changement de causerie sur un bilan vierge, les anciens lieu et correction sont retirés avant de reprendre la nouvelle source.

À l’extérieur, le tableau affiche l’adversaire en premier et notre équipe en second, y compris pour la mi-temps. Les champs `goalsFor`, `goalsAgainst`, `halfFor` et `halfAgainst` conservent leur sens : buts de notre équipe / buts adverses. Le résultat et les statistiques ne sont donc jamais inversés. La synthèse et son export reprennent le même ordre.

La J6 du calendrier fourni (MÉRAL COSSÉ US reçoit MAYENNE STADE FC 2) est couverte par un test sur les données réelles de cette rencontre, injectées dans un contexte local de test.

## Saisie

Le formulaire **Le match** n’appelle plus `renderReportEvents`. Les faits déjà enregistrés ne sont pas supprimés ; leur saisie reste uniquement dans **Moments marquants**, avec restitution dans la synthèse.

`report-match-light.css` conserve les contrôles existants des lignes joueurs : présences par séance et leur cycle de pointage, minutes, cartons jaunes/rouges et présence au match. Espacements réduits, fonds discrets, numéros bien lisibles, pastilles de semaine et repères de cartons remplacent les répétitions de grands libellés. Les libellés accessibles des champs restent complets. Sur mobile les contrôles se répartissent sur plusieurs lignes, avec des boutons de présence de 44 px et une police de saisie de 16 px.

Pas de nouvelle statistique persistée, de valeur présélectionnée ni de changement du calcul des présences.

## Vérification

Serveur local port 3016 : `tests/report-away-light-browser.py`, `tests/report-player-rows-browser.py`, `tests/report-halftime-tabs-browser.py`, `tests/report-summary-dashboard-browser.py` et `tests/report-causerie-continuity-browser.py`. Contrôles : J6 à l’extérieur, ordres des scores et de la pause, correction manuelle, faits dans un seul onglet sans perte, pointages et statistiques, écrans 320 à 1440 px.
