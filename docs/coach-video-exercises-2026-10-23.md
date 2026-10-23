# Exercices vidéo du coach — livraison du 23 octobre 2026

## Périmètre réellement accessible

Deux des cinq fichiers ont pu être transférés puis examinés par images successives
sur toute leur durée :

| Fichier | Durée | Observation de l’extrait | Fiche intégrée |
| --- | --- | --- | --- |
| 10-36-40 | 17,095 s | finalthird.pro : 2v2, appui de chaque couleur à un fond, quatre mini-buts, suivants derrière les fonds | `video-bounce-2v2` — 2 contre 2 · appuis de fond et quatre mini-buts |
| 10-39-19 | 16,452 s | sertcoach : départs latéraux, haies, échelles, relais hauts, diagonale au centre, slalom et frappe face au gardien | `video-coordination-shot` — Coordination · relais, slalom et frappe |

Les trois fichiers **23-45-10, 10-34-48 et 10-37-17** dépassent la limite de
transfert de 32 Mio. Ils n’ont pas été visionnés et aucun exercice n’a été inventé
à partir de leur nom. Il faut une version compressée ou découpée pour les traiter.
Les clips, logos et captures des comptes ne sont pas publiés dans le dépôt.

## Reconstruction et propositions du club

L’organisation et le matériel visibles servent de référence. Les extraits ne
fournissent pas toutes les dimensions, durées et règles : celles-ci sont proposées
explicitement par le club. Les liens identifient les comptes visibles, sans
prétendre retrouver le reel exact ni attribuer une validation fédérale.

### 2 contre 2 avec appuis

- Repère de jeu : L 30 × l 22 m ; quatre mini-buts et quatre coupelles.
- Deux joueurs intérieurs par équipe et un appui **propre à chaque couleur**, pas
  deux jokers neutres. Les appuis restent sur leur ligne ; ils ne tirent pas.
- De 6 à 12 joueurs par atelier : six rôles actifs ; les autres attendent hors
  de l’aire et entrent après la vague. L’outil ne transforme pas le 2v2 en 5v5.
- Trois démonstrations : soutien puis appui et remise haute ; remise au second
  partenaire vers l’autre cible ; passe interceptée et jeu vers le fond opposé.
- La passe peut rester fermée : le coach n’impose pas le circuit animé dans le jeu.
  La frappe n’est pas un but garanti. Les couleurs et les numéros restent fixes.

### Coordination et frappe

- Repère de jeu : L 36 × l 28 m ; un grand but, un gardien, six petites haies,
  deux échelles, trois cônes de slalom et six coupelles.
- De 6 à 12 joueurs, dont un gardien actif : cinq postes de champ (départs et
  relais des deux côtés, central) et des suivants. Une seule répétition active.
- Animation dédiée : passe au relais, trois passages de haies **sans ballon**,
  remise à la sortie, diagonale au central, conduite alternée entre cônes,
  dernier contact, frappe, sortie puis retour extérieur.
- Trois démonstrations : côté gauche, véritable miroir côté droit et dernier
  contrôle décalé avant la frappe. Les haies/échelles restent sur les deux côtés.
- Le passeur devient relais ; l’ancien relais rejoint son départ par l’extérieur ;
  le tireur ressort puis revient dans la file. Le suivant s’avance après l’arrêt.
  La prochaine vague et le changement de côté se font après disponibilité du gardien.
- Haies basses et appuis maîtrisés ; supprimer les sauts pour une mise en route
  progressive. Aucune opposition de champ n’est inventée dans les consignes.
  Le transfert en match doit être travaillé ensuite dans une situation opposée.

Les dimensions utiles n’augmentent pas parce que davantage de joueurs attendent.
Le niveau et l’espace du coach continuent à adapter les distances et les consignes.
Le calcul d’emprise réserve **3 m derrière chaque fond**, en plus de l’aire de jeu,
pour les cibles et les suivants. Une configuration trop petite ou sans le gardien
requis est signalée comme incompatible. Les temps effectivement calculés dans le
déroulé font foi ; les consignes ne contredisent pas les durées personnalisées.

## Qualité du lecteur

Les numéros suivent les mêmes joueurs ; le ballon n’est jamais remis magiquement
à un autre porteur au milieu de l’action. Les étapes décrivent l’action en cours,
les passes arrivent au receveur et les courses sont chronométrées. Le lecteur
sépare la frappe de la fin de vague : il n’annonce pas une possession pendant
que le ballon est dans la cible et que les joueurs reviennent se replacer.
Les dessins imprimables conservent matériel, cotes et installation ; la scène
animée retire les annotations qui encombreraient la lecture. Les suivants sont
hors du rectangle de jeu et le cadrage les garde visibles.

## Vérifications effectuées

- `tests/coach-video-exercises.js` : 513 configurations compatibles / 1 293 passes,
  effectifs, niveaux, âges, atelier unique ou automatique, attente hors du jeu,
  appuis fixes, un seul ballon, rôle du gardien, phases de tir, identité des joueurs,
  vitesse des déplacements et absence de passe réussie à travers un défenseur.
- `tests/coach-video-exercises-browser.py` : recherche réelle dans la bibliothèque,
  six démonstrations, inventaire du dessin, règles sans adversaire imaginaire,
  frappe puis fin de vague, captures des moments clés, choix de variante conservé
  dans la séance après rechargement et lisibilité à 390 px.
- `tests/bible-video-reference-browser.py --gallery` : bibliothèque portée à
  **65 fiches / 195 démonstrations**, orientations, cotes et impression indépendante.
- Non-régression des 63 fiches précédentes : `bible-pedagogical-motion.js`,
  `bible-design-variants.js`, `bible-football-reception.js` et
  `bible-adaptation-final.js`.

Ces contrôles ne constituent pas un essai terrain par un éducateur. Les trois
vidéos non transférables restent à traiter après réception d’une copie accessible.
