# Exporter vers Canva

## Style de la présentation

La mise en page s’inspire du PDF de référence « Copie de PROJET DE JEU » fourni
par le coach : bleu `#214FA0` et blanc, couverture avec photo et logo, titres
Montserrat gras italiques soulignés, texte Calistoga, chevrons et découpes
photographiques obliques. Les photos de décoration sont celles déjà présentes
sur le site ; aucune page, photo de joueur ou consigne n’est extraite du PDF
pour être publiée comme nouveau contenu du site.
Seul le logo du club a été extrait tel quel pour la couverture, dans
`assets/causerie-logo.jpeg` ; un logo personnalisé du coach garde la priorité.

Le fil suit les rubriques imprimées du tableau de préparation fourni par le coach :
repères du match, contexte et adversaire, objectif du jour / idées fortes,
animation défensive, animation offensive, spécificités / compléments du plan de jeu.
Les annotations manuscrites de cette référence ne sont pas utilisées comme contenu.

La couverture porte les repères et les métadonnées de l’équipe, sans une deuxième
page identique. Contexte et adversaire partagent une page si leurs textes tiennent
lisiblement ; les idées fortes utilisent une page bleue. Les phases défensive et
offensive inversent le côté du terrain et du texte. Les compléments peuvent
utiliser les photos obliques ou un espace de texte plus large selon leur longueur.

La composition et l’effectif ne sont pas des chapitres imposés. Les noms renseignés
peuvent être intégrés à la première illustration tactique. Une vue d’ensemble
séparée n’est ajoutée qu’en l’absence d’une telle illustration et lorsqu’il existe
un terrain effectivement préparé. Les données par défaut ne créent pas de pages
vides ; une liste de joueurs supplémentaires n’est ajoutée qu’au-delà de la place
disponible. Les continuations de longs textes utilisent toute la largeur.

La vue épurée n’est affichée que si elle est liée et sélectionnée : elle n’a pas
une seconde couverture, et ses champs hérités identiques sont omis. Ses éléments
propres restent présents. Des consignes générales exactement identiques aux
spécificités sont affichées une seule fois, sans réécrire leur contenu. Les champs
ayant un rôle différent ne sont pas fusionnés simplement parce qu’ils se ressemblent.
Le schéma reste celui du coach : aucune formation n’est inventée depuis ses phrases.

Les textes restent modifiables et sont paginés selon la largeur et les polices
réelles, sans réécriture. Les passages longs continuent sur d’autres pages.
Les masques réutilisent les images pour éviter de dupliquer les terrains sur
chaque page. Un logo personnalisé valide prend la place du logo du club.
L’apparence dans Canva après conversion doit encore être contrôlée ; le PDF
de prévisualisation ne constitue pas une validation de l’import réel.

Les tests vérifient notamment un cas court à six pages, une préparation vide sans
pages de remplissage, l’absence de copie des champs hérités et la restitution
exacte des champs source dans les zones de texte PowerPoint, y compris les notes
longues. Six pages est un cas d’essai, pas un nombre de diapositives imposé.

## Le cadre Mon Canva

Sur la dernière page **Enregistrer & exporter**, **Créer et ouvrir ma causerie
 dans Canva** lance la création de la présentation complète dans le compte
Canva autorisé du coach, puis ouvre le lien d’édition effectivement renvoyé
par Canva. Lors de la première utilisation, l’autorisation précède la création,
qui reprend automatiquement. Les autorisations sont conservées côté serveur.
Ce parcours nécessite le service configuré et validé : il n’est pas actif tant
que `CLUB_CANVA_GATEWAY` est vide. Le site affiche alors explicitement l’activation
manquante, sans annoncer qu’une présentation a été créée.

La dernière présentation créée est mémorisée dans l’espace du coach sur cet
appareil et peut être rouverte depuis le cadre. Le lien favori vers un espace ou
un dossier Canva reste une option distincte : **Mon espace Canva** n’envoie aucun
contenu. Il utilise la session Canva du navigateur et peut être modifié ou retiré.
Ces liens locaux ne sont pas synchronisés entre appareils.

**Vérifier ou télécharger une copie de ma causerie** conserve l’inventaire et
le téléchargement manuel de la présentation, sans les mettre devant l’action
principale. Une copie locale peut être préparée sans connecter Canva.

## Causerie complète · première étape locale

Dans **Préparation du match**, le bouton **Causerie · Canva** prépare une
présentation PowerPoint (`.pptx`). Le même bouton figure à côté de l’export
de composition. La dernière page **Enregistrer & exporter** présente aussi le
bloc **Votre causerie dans Canva**, avec le bouton **Préparer ma causerie pour
Canva** et les trois étapes de téléchargement et d’import dans le compte personnel.
Il reprend le document ouvert : équipe et composition,
repères du match, contexte, adversaire, quatre idées fortes, animations
défensive et offensive, spécificités, consignes et effectif complet. Une vue
épurée n’est proposée que si elle est explicitement liée à la composition.
Les autres documents de la bibliothèque et les tableaux de pions indépendants
ne sont pas intégrés automatiquement.

Les textes sont repris sans reformulation, résumé ou suppression des espaces
et retours à la ligne. Les passages longs continuent sur des pages supplémentaires.
Les textes restent des zones de texte modifiables dans le fichier PowerPoint.
Les terrains utilisent le rendu existant (photos, positions, flèches, couleurs,
adversaires et visibilité du banc) sous forme d’images PNG fixes. Les pions ne
deviennent pas des objets Canva séparés, et une animation n’est pas une vidéo
dans cette présentation. Aucun contenu n’est transmis au clic de téléchargement.

Ouvrir l’inventaire pour vérifier les rubriques, télécharger la présentation,
puis l’importer dans Canva. Cette étape produit le fichier local ; elle ne crée
pas de connexion au compte Canva. L’import réel, la conversion et le rendu dans
Canva restent à valider avec un compte autorisé. Ne pas promettre une conversion
identique avant cette validation.

L’export utilise une copie figée lors de l’ouverture de la fenêtre. Fermer puis
rouvrir cette fenêtre pour reprendre des changements plus récents. Une photo
illisible bloque la génération, au lieu d’être omise silencieusement.

`python3 tests/causerie-export-browser.py` télécharge de vrais fichiers et contrôle
leur XML : tous les champs de préparation, les objectifs, les accents, les
espaces, les longs textes, les images de terrain, la sélection de la vue liée,
le brouillon figé et l’absence d’envoi réseau. Ce contrôle ne valide pas Canva.

Pour la connexion persistante demandée, voir [Connexion Canva](canva-connection.md).

## Création directe dans le compte du coach · service à activer

Lorsque le responsable a déployé et validé le service puis renseigné son origine
HTTPS dans `canva-config.js`, la même fenêtre propose **Connecter Canva**.
Le coach doit être connecté au club. La nouvelle fenêtre ouvre le consentement
Canva ; il peut ensuite revenir au site et choisir **Créer dans mon Canva**.

La présentation n’est envoyée qu’à ce clic. Le site attend le résultat réel de
l’import avant de proposer **Ouvrir ma présentation dans Canva**. En cas de
traitement long ou de connexion interrompue, **Vérifier la connexion** permet
de retrouver le dernier import sans relancer une création. **Déconnecter Canva**
supprime l’autorisation conservée par le site et demande sa révocation chez Canva.
Si cette révocation distante échoue, retirer également l’accès depuis Canva.

Le service garde les autorisations chiffrées par compte éducateur et les
renouvelle tant que Canva le permet ; se reconnecter reste nécessaire en cas de
révocation. Le changement de coach pendant la préparation interdit l’envoi du
document capturé sous le compte précédent. Les comptes Canva ne sont pas liés
aux simples profils locaux de démonstration.

Ce parcours est testé avec un service simulé, pas avec un vrai compte Canva.
L’intégration et son retour ont été configurés par le responsable. La valeur
publique `CLUB_CANVA_GATEWAY` vise désormais le service Render du club ; le
consentement et le rendu réels doivent encore être testés.

## Composition ou plan de jeu

1. Dans Terrain & tactique, ouvrir le document puis **Exporter**.
2. Choisir **Présentation Canva · 16:9**. Cocher seulement les éléments souhaités :
   impacteurs/finisseurs, adversaires, couloirs et flèches.
3. Vérifier l’aperçu, puis télécharger **Image HD pour Canva**. Le PNG mesure
   2560 × 1440 pixels. Le PDF du même format contient une seule page de même ratio.
4. Dans Canva, ouvrir une présentation **16:9**, choisir **Importer → Importer des
   fichiers**, puis sélectionner le PNG depuis Téléchargements.
5. Ajouter l’image à la page et la définir comme arrière-plan, ou l’ajuster à la
   largeur/hauteur en conservant ses proportions. Ne pas l’étirer séparément.

Les joueurs, photos et textes sont dans une image aplatie : ils ne deviennent pas
des éléments Canva indépendants. Pour déplacer un joueur, modifier le document
sur le site puis refaire l’export. L’aperçu conserve la version ouverte lors du clic
Exporter ; fermer et rouvrir l’aperçu pour exporter une modification ultérieure.

Le PDF de composition contient **uniquement le terrain**. Les variantes A4 portrait
et A4 paysage sont aussi disponibles, chacune sur une page.

## Vidéo tactique ou exercice animé

1. Vérifier les étapes et lire l’animation sur le site.
2. Choisir **Vidéo**, garder l’onglet visible et attendre le téléchargement. Une
   annulation ne télécharge pas une vidéo incomplète et ne modifie pas l’exercice.
3. Importer le fichier dans Canva via **Importer des fichiers**.
4. Conserver les proportions. La vidéo tactique mesure 1920 × 1080 ; celle de
   l’atelier d’exercice mesure 2400 × 1500, comme son schéma. Dans une présentation
   16:9, centrer cette dernière plutôt que de l’étirer.

Le conteneur est MP4 lorsque l’encodeur du navigateur le permet, sinon WebM.
Les tests Chromium ont produit des MP4 lisibles ; un autre navigateur peut choisir
un autre codec. Si Canva refuse le fichier, relever son extension et le navigateur
utilisé. Une image PNG reste disponible sans passer par l’encodeur vidéo.

## Séance et rapport PDF

Choisir **PDF**, puis **Enregistrer au format PDF** dans la fenêtre du navigateur.
Conserver le format A4 portrait, l’échelle normale et activer les graphiques
d’arrière-plan pour retrouver les couleurs. Désactiver les en-têtes/pieds de page
du navigateur si celui-ci ajoute une URL ou une date.

Les fiches détaillées peuvent occuper plusieurs pages ; vérifier la dernière page.
Les tableaux répètent leurs en-têtes et les schémas sont conservés entiers.
Pour les importer dans Canva, importer le PDF en tant que document. Une fiche A4
ne doit pas être étirée sur une présentation 16:9 si l’on veut conserver sa mise
en page et la lisibilité des textes.

## Validation à faire dans le compte du club

Les téléchargements, dimensions, images, textes PDF et vidéos ont été contrôlés
localement. Aucun accès au compte Canva du club n’est disponible dans cet
environnement : l’import réel doit encore y être essayé. Vérifier une composition
avec photo, une vidéo et une fiche de séance avant de considérer ce parcours externe
comme validé. Aucun document du club n’est envoyé automatiquement à Canva.
