# Réception finale du site — quatre chantiers, dans l'ordre

Cette liste remplace une promesse de « terminé » fondée sur le seul nombre de
fonctions. Une case de terrain, de compte réel ou d'appareil réel reste ouverte
jusqu'à l'essai correspondant. Aucun compte du club n'est utilisé pour les tests.

## 1. Qualité football — en cours de réception

### Lot corrigé : bloc défensif et phases de finition

- [x] Bloc / bloc à deux lignes : installation avec deux hauteurs reconnaissables,
  plutôt qu'une diagonale obtenue par un placement générique.
- [x] Trois scénarios distincts : coulissement, recentrage sur une passe en retrait,
  erreur de coulissement puis couverture quand le premier rideau est dépassé.
- [x] Erreur annoncée comme telle ; aucune récupération automatique inventée pour
  terminer l'animation. L'exemple ne demande pas de forcer une passe fermée.
- [x] Réaction collective et correction du coach spécifiques à ces variantes.
- [x] Finitions : tirs explicitement identifiés comme des frappes dans le lecteur
  et dans les pauses pédagogiques ; second ballon distingué de la possession.
- [x] Duel gardien : frappe puis contrôle séparés, avec une prise de balle présentée
  comme le résultat illustré, pas une réussite garantie.
- [x] Non-régression : les trois variantes de chaque fiche restent lisibles ; les
  positions et identités restent continues ; les variantes personnelles sont conservées.
- [ ] Essai terrain du lot par un éducateur, avec observations notées ci-dessous.

Preuves : `tests/bible-football-reception.js` (21 situations de bloc, huit mécanismes
de finition), `bible-pedagogical-motion.js`, `bible-design-variants.js`,
`bible-football-reception-browser.py`, `bible-decisions-browser.py`, `bible-game-sense-browser.py` et
`bible-video-reference-browser.py`. Ces contrôles ne certifient pas la pédagogie.

### Réception terrain représentative à réaliser

| Exercice à essayer | Ce qui doit être compris sans assistance | Observation / correction à noter |
|---|---|---|
| Bloc à deux lignes, trois variantes | Quelle passe déclenche le déplacement ? Qui presse, qui couvre, que fait le côté opposé ? | Les deux lignes restent-elles reliées ? La variante d'erreur est-elle reconnue comme telle ? |
| Finition avec opposition | Qui sert, qui termine, quel espace doit rester libre ? | Départ, angle de passe, intensité et distance sont-ils adaptés au groupe ? |
| Duel gardien | Distinguer approche, fixation, frappe et résultat possible | Le gardien se prépare-t-il au bon moment ? La répétition est-elle sûre ? |
| Conservation puis sortie du carré | Identifier le changement de rôle et le nouvel espace | Tout le groupe trouve-t-il une tâche utile, sans attente non prévue ? |
| Combinaison avec rotation | Suivre son propre numéro et son trajet de retour | La file et le matériel permettent-ils un enchaînement sans croisement gênant ? |

Pour chaque essai, noter catégorie/niveau, présents/gardiens, L × l, durée réelle,
matériel, compréhension du départ, deux observations et la correction retenue.
Vérifier aussi que l'organisation reste utile si un joueur manque.
Le coach adapte intensité, contacts et récupération aux joueurs réels.

Les autres fiches conservent leur contrôle de rendu et de trajectoires ; leur
réception pédagogique approfondie ne doit pas être déduite de ces seuls tests.
Les références reçues sont recensées dans [la revue vidéo](bible-video-reference-review.md).

## 2. Parcours d'une semaine — après la réception du premier chantier

- [ ] Un éducateur débutant prépare son groupe, cherche un exercice, adapte sa
  séance, la retrouve dans l'agenda, prépare le match, saisit un bilan puis reprend
  une priorité dans la séance suivante, sans aide.
- [ ] Un éducateur expérimenté réalise le même parcours avec ses propres contenus.
- [ ] Noter les blocages, les clics inutiles, les ambiguïtés et les informations
  manquantes. Corriger puis rejouer seulement les parcours concernés.
- [ ] Vérifier que les documents sont conservés après fermeture et reconnexion.

## 3. Données réelles — réception sur deux appareils

- [ ] Même coach : modification concurrente, message de conflit compréhensible,
  conservation des deux travaux utiles et reprise sans écrasement silencieux.
- [ ] Deux coachs : partage lisible, original du collègue protégé, copie indépendante.
- [ ] Coupure réseau, reconnexion et correspondance exacte de l'état affiché.
- [ ] Sauvegarde native puis restauration sur un projet de test séparé, avec
  comptes Auth, documents, photos, droits et validations vérifiés.

Consulter les recettes [15](save-reliability-acceptance.md),
[18](general-reliability-acceptance.md) et le [guide de reprise](club-backup-guide.md).
Aucune restauration de production ne doit servir d'essai.

## 4. Finition visuelle et compatibilité

- [ ] Corriger les détails observés dans les essais précédents, sans ajouter de
  boutons ou de fonctions qui ne résolvent pas un blocage constaté.
- [ ] Vérifier Chrome/Edge Windows, Firefox et Safari iPhone réels, clavier et tactile.
- [ ] Vérifier les fichiers téléchargés et leur import dans le vrai compte Canva.
- [ ] Faire refaire le parcours sans assistance après les dernières corrections.

## Critère de fermeture

Un lot est réceptionné quand son parcours fonctionne, ses données sont conservées,
son affichage est clair et le coach réussit seul. Pour un exercice : installation,
consignes, but recherché, variante et rotation doivent être réalisables sur le
terrain. Consigner qui l'a essayé, quand et dans quelle configuration ; ne pas
remplacer ces réponses par un résultat de test automatisé.
