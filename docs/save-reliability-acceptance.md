# Étape 15 · Sauvegardes et partage

22 octobre 2026. Tests Chromium avec plusieurs contextes/appareils simulés et
un second onglet partageant réellement le même stockage local. Les réponses
Supabase sont simulées ; aucun compte ou document de production n’a été modifié.

## Ce qui a été renforcé

- [x] Journal local préparé avant le remplacement d’une bibliothèque. Il contient
  la valeur à enregistrer et les intentions de partage avec leur version de départ.
  Si sa création échoue, la bibliothèque précédente n’est pas remplacée.
- [x] Si la bibliothèque est écrite mais la file de partage ne peut pas l’être,
  le journal reste conservé dans le stockage du coach. Au rechargement, la
  synchronisation reconstruit les tâches avant de déclarer les documents partagés.
- [x] Une interruption avant l’écriture de la bibliothèque ne provoque pas son
  remplacement automatique : état Échec, candidat récupérable comme nouveau
  brouillon depuis « Retrouver un brouillon remplacé ». L’original reste intact.
- [x] Chaque intention conserve son identifiant d’envoi. Un deuxième enregistrement
  pendant le premier reçoit une autre identité : l’accusé du premier ne supprime
  pas la seconde modification de la file d’attente.
- [x] Réponse d’enregistrement perdue : en cas de conflit au nouvel essai, lecture
  du serveur puis comparaison complète du contenu, indépendante de l’ordre des
  clés JSON. Seule une égalité exacte permet d’acquitter sans créer de révision.
  Un contenu différent reste un conflit, jamais un écrasement.
- [x] Réponse de suppression perdue : seule l’absence du document permet de terminer
  la tâche. Un document recréé sous le même identifiant source n’est pas supprimé.
- [x] Une bibliothèque modifiée dans un autre onglet est détectée avant écriture.
  L’ancienne page refuse de l’écraser ; son brouillon reste ouvert. Les changements
  distants récupérés normalement actualisent la référence locale de comparaison.
- [x] États « Enregistré et partagé », « En attente », « Échec » conservés ; un échec
  local bloque le vert. Les problèmes locaux ne sont plus décrits comme une panne
  réseau. Réessayer est accessible pour une file de partage à réparer.
- [x] Avertissement du navigateur avant fermeture lorsqu’une écriture locale a
  échoué, sous réserve du comportement du navigateur et d’une interaction préalable.
- [x] Récupération des brouillons remplacés, confirmation avant restauration,
  conservation du brouillon précédent et isolation par coach inchangées.

## Vérifications exécutées

- `tests/save-reliability-browser.py` : refus d’écriture du journal, refus de la
  file après écriture locale, rechargement/réparation, réponse perdue à la sauvegarde
  et à la suppression, ordre des clés JSONB, document recréé, modification pendant
  l’envoi, récupération d’un enregistrement interrompu, onglet local périmé, mobile.
- `tests/club-network-browser.py` : plusieurs comptes/appareils simulés, trois
  types de document, conflit réel conservant le brouillon, coupure réseau, reprise,
  rechargement, droits, déconnexion et retrait d’accès.
- `tests/club-completion-browser.py` : restauration après rechargement, échec
  de remplacement sans écrasement, récupération précédente et isolation du coach.
- `tests/site-final-browser.py` : parcours ordinateur/tablette/téléphone et documents
  ouverts conservés, sans débordement ni identifiant DOM dupliqué.

## Limites et essai réel restant

Le journal réserve temporairement une copie de la bibliothèque dans le stockage
local. Il peut donc nécessiter davantage d’espace libre ; en cas de quota atteint,
le site refuse la sauvegarde plutôt que de promettre un partage non traçable.
Effacer les données du navigateur, utiliser un stockage privé éphémère ou perdre
l’appareil efface aussi les brouillons et journaux locaux non partagés.

Le refus d’un onglet périmé est un contrôle avant écriture, pas une transaction
atomique multi-onglets : deux écritures localStorage strictement simultanées ne
peuvent pas être garanties atomiques par ce mécanisme. Le verrou existant de la
file d’envoi et les versions vérifiées par PostgreSQL continuent à protéger les
écritures serveur. En cas de divergence, récupérer les versions et les comparer.

Une comparaison égale après réponse perdue ne fusionne jamais des modifications.
Si le contenu a changé entre-temps, une résolution manuelle peut rester nécessaire.
Les révisions serveur ne sont pas un historique restaurable complet : sauvegarde
et restauration de toute la base du club restent au périmètre de l’étape 18.

Reste à essayer sur deux appareils réels avec des comptes du club : modification
concurrente d’une séance, coupure pendant Enregistrer, reprise, puis récupération
d’un brouillon. Ces essais de production ne sont pas revendiqués par la simulation.
Aucune nouvelle migration SQL n’est nécessaire pour cette étape.
