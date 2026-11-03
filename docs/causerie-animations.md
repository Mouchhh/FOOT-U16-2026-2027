# Démonstrations dans la causerie

Depuis la causerie, « Démonstrations » permet de choisir les séquences enregistrées du coach et de l’équipe actifs. Le choix et les fichiers ajoutés sont propres au document courant et restent en mémoire jusqu’à la fermeture du site. Les exercices et leurs moteurs ne sont pas modifiés. Une séquence prédéfinie doit être enregistrée depuis sa première étape pour exporter la séquence complète ; les séquences personnalisées repartent de leur base enregistrée.

Chaque séquence sélectionnée ajoute deux diapositives :

- Des pions éditables et des trajectoires natives PowerPoint (`p:animMotion`), déclenchées au clic en diaporama. Les positions, étapes, branche de passe choisie et durées sont issues de l’enregistrement. Le moteur de lecture PowerPoint gère l’interpolation native ; il peut différer du lissage cubic du navigateur.
- Un GIF animé 960 × 540, produit localement avec le rendu et l’interpolation existants, pour fournir un média compatible aux outils qui ne reprennent pas les trajectoires OOXML. La vidéo MP4 ou le GIF d’un autre exercice peut également être joint (5 fichiers, 20 Mo par fichier). Aucun mouvement n’est inventé à partir du texte pédagogique d’un exercice.

Le bouton « GIF pour Canva » télécharge également le GIF séparément pour un import média direct dans Canva. Le PPTX embarque ses médias. Les animations nécessitent le mode diaporama ; l’aperçu et un PDF restent statiques. L’import Canva peut conserver uniquement la première image d’un GIF contenu dans un PPTX selon son importeur : sa conservation doit être vérifiée dans Canva. L’ajout d’un MP4 peut également nécessiter un import média séparé. Aucun test local ne garantit le comportement d’une version précise de PowerPoint ni du service Canva.

Les boutons Canva et « Télécharger en PPT (Animé) » restent côte à côte. Le connecteur Canva existant crée toujours dans le compte personnel connecté. Aucun lien de modèle n’a été inventé : un vrai lien « utiliser comme modèle » doit provenir de Canva. L’accès de tous les éducateurs demeure soumis aux autorisations et à la publication de l’intégration Canva. Le transfert reste explicite ; la limite du serveur est de 20 Mo pour toute la présentation.

`causerie-animations.js` ajoute les diapositives puis complète uniquement les fichiers XML de ces nouvelles diapositives après génération PptxGenJS. JSZip est celui du bundle PptxGenJS existant ; gifenc 1.0.3 (MIT) est fourni localement avec sa licence.

Validation : `python3 tests/causerie-animations-browser.py` contrôle le PPTX réel, ses cibles de trajectoires, déplacements, GIF multiframe, l’absence de mutation du document et l’isolation entre causeries. Les tests existants d’export et de placement contrôlent les textes exacts et le responsive.
