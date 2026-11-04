# Pointage par jour de séance

Le panneau de présence du bilan utilise par défaut la semaine du lundi au dimanche contenant la date du bilan (la semaine courante si le bilan n’est pas encore daté). Il affiche les séances réellement résolues dans l’agenda, dans l’ordre chronologique, sous forme de boutons « Séance lundi · 19:00 ». La semaine complète reste visible, y compris les occurrences futures marquées « à venir ». Elles peuvent être renseignées, mais ne participent aux taux de présence qu’après leur horaire.

Les dates restent conservées dans les identifiants d’occurrence et affichées dans la période et les infobulles. Deux créneaux le même jour restent distincts par leur horaire. Les modifications et suppressions de récurrence utilisent le résolveur Agenda existant.

Les flèches changent la semaine ; « Semaine du bilan » rétablit le contexte initial. Les dates personnalisées et la sélection détaillée sont regroupées dans « Autre période ou séance ». Aucune date de séance n’est à saisir pour utiliser les créneaux configurés.

Les réponses restent enregistrées par équipe, joueur et occurrence réelle via le circuit canonique existant. Les taux de présence et l’effectif se mettent à jour comme auparavant. Les contrôles de stockage, de concurrence et les protections d’un pointage non enregistré sont conservés.

## Semaine initiale et statut de préparation

La semaine type du coach est la référence. Lors de sa première configuration passée ou courante, ses créneaux sont projetés à partir du lundi de la semaine précédente, puis restent récurrents sans date de fin. Les anciens modèles actifs reçoivent la même extension une seule fois, avec un marqueur persistant `initialWeekBackfilled`. Les changements ultérieurs de créneaux conservent leurs dates d’effet et l’historique ; les exceptions de suppression restent appliquées. Un modèle commençant dans le futur n’est pas étendu avant sa prise d’effet. Aucun joueur n’est automatiquement déclaré présent ou absent.

Le statut « À préparer » ne filtre jamais le pointage d’une occurrence passée. Un pointage peut matérialiser la séance sans fiche pédagogique préparée. Après modification des récurrences, les contrôles de présence du bilan sont actualisés sans remplacer les champs de minutes et de discipline en cours de saisie.
