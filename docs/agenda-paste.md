# Coller des rencontres dans son agenda

Dans Agenda, le bouton « Coller mes rencontres » ouvre un outil de lecture locale du texte FFF. Le même outil est accessible dans l’assistant par « Importer mon calendrier FFF » et par une demande d’import/collage du calendrier dans la conversation. Il ne s’agit pas d’un appel à un modèle IA externe et aucun texte n’est envoyé à un tel service.

## Parcours

1. Coller le texte simple ou les liens Markdown copiés de la FFF.
2. Analyser ; vérifier dates, heures, compétition, journée/tour, équipes, scores et tirs au but dans l’aperçu.
3. Vérifier son équipe (proposée seulement si elle apparaît nettement plus souvent que les adversaires). Pour une rencontre isolée, choisir explicitement son équipe.
4. Cocher les rencontres voulues, puis confirmer pour son propre agenda.

Une modification du texte invalide l’aperçu et nécessite une nouvelle analyse. Les rencontres non reconnues sont signalées par date ; elles ne sont pas inventées. Le coach peut corriger le texte et relancer, ou importer explicitement les seules rencontres valides/cochées. Les rencontres d’autres équipes sont désactivées après choix de son équipe.

## Formats et limites

Les dates attendues suivent le format FFF français, par exemple `sam 07 nov 2026 - 14h30`. Les mois abrégés/entiers et années explicites sont pris en charge. Les dates impossibles, horaires incohérents, équipes manquantes, scores ambigus et tirs au but sans score sont signalés.

Les noms répétés et les images/liens de la page sont nettoyés sans exécuter le HTML ni visiter les liens. Les deux scores sur deux lignes, séparés par un espace ou tiret, et les scores compacts FFF à deux chiffres (`02` = 0–2, `80` = 8–0) sont reconnus. Les chaînes compactes à trois chiffres sont ambiguës et refusées. Un horaire répété au milieu des équipes n’est pas interprété comme un score ; s’il diffère de l’en-tête, la rencontre nécessite une correction. Les tirs au but sont conservés dans l’ordre domicile/extérieur.

Maximum 100 000 caractères et 200 rencontres par analyse, 1000 rencontres enregistrées. Pas de lecture automatique d’images/PDF ni de compréhension garantie d’un calendrier libre hors de ce format.

## Données et réutilisation

Le stockage `vestiaire-pasted-fixtures` utilise l’isolation existante par coach. Il est **local à l’appareil** ; cette fonctionnalité n’ajoute pas de synchronisation serveur des imports. Un autre éducateur n’en reçoit pas les rencontres. Les calendriers nominatifs déjà attribués dans les données du site ne sont pas modifiés par un collage.

La confirmation seule enregistre les rencontres. Un quota conserve l’ancien calendrier et l’aperçu. L’outil est fermé lors de la déconnexion ; le profil et la version analysée sont vérifiés avant confirmation.

L’identifiant FFF du match est utilisé s’il est présent ; sinon l’identité combine saison, compétition, journée/tour et équipes, sans la date pour permettre un report. Un nouvel import actualise cette identité. Les rencontres déjà attribuées à l’éducateur sont reconnues et remplacées visuellement sans doublon ; les données communes ne sont pas réécrites. Les préparations existantes restent intactes et sont réouvertes via leur clé. L’import ne crée pas une composition pour chaque ligne.

Après confirmation, le calendrier s’ouvre sur la première date à venir importée (ou la première date importée si tout est passé), avec les filtres remis à zéro. Le bouton « Retirer mes rencontres collées » nécessite confirmation et conserve les préparations ainsi que les calendriers déjà attribués par le club.

## Vérification

`python tests/agenda-paste-browser.py` couvre texte FFF brut et Markdown, équipes répétées, 1–1 sur deux lignes et avec espaces, scores compacts, TAB, horaires contradictoires, texte/dates invalides, aperçu sans écriture, choix d’équipe, confirmation, réimport et report sans doublon, préparation sauvegardée, rechargement, quota, assistant (raccourci et question), suppression des seuls imports, téléphone et isolation avec un autre profil.

Les tests calendrier, FFF et calendriers nominatifs de Hugo restent pertinents pour la non-régression.
