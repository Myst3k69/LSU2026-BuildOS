# BuildOS

## Brief du projet

Les porteurs de projet pilotent leur business avec l’IA, mais leurs conversations ChatGPT ou Claude sont éparpillées et sans structure : décisions perdues, étapes oubliées et aucune vision d’ensemble.

## Cible

Les fondateurs early-stage qui construisent seuls ou à deux, avec l’IA comme principal collaborateur.

## Proposition de valeur

Un espace unique où chaque conversation avec l’IA est rattachée au projet. L’outil structure le projet en domaines, propose les tâches et les ressources indispensables, et fait avancer ces tâches avec l’IA.

L’objectif : un porteur de projet augmenté, qui n’oublie aucune étape clé. Le plan met en évidence les étapes souvent oubliées pour offrir une vision d’ensemble du projet et guider sa progression.

## Principes de la V1

- L’application doit être utilisable depuis un téléphone.
- Aucun compte à créer.
- Le projet est sauvegardé côté serveur et retrouvé sur le même navigateur.

## Prototype autonome

Cette implémentation reprend la direction visuelle de la maquette et permet de créer un projet, consulter son plan, suivre les tâches et ouvrir un copilote attaché à chaque tâche. Les conversations, livrables et décisions sont conservés avec l’avancement.

Pour respecter la contrainte d’absence d’appels réseau, le prototype utilise une **assistance IA simulée** et une **sauvegarde locale dans le navigateur** (`localStorage`). Le plan repose sur une trame de six domaines ; il n’est pas généré par un modèle IA. La sauvegarde serveur décrite dans le brief reste une fonctionnalité de la future V1.

Un seul projet est conservé par navigateur. Il est retrouvé après rechargement ou réouverture à la même adresse. Effacer les données du navigateur le supprime ; les paramètres permettent d’exporter le projet en JSON. L’export sert de copie de sauvegarde, sans fonction d’import dans ce prototype.

## Développement

Prérequis : Node.js 20 ou supérieur et npm. **Aucune dépendance à installer.**

```sh
npm run dev
```

Le serveur de fichiers local écoute sur le port 3000 (modifiable via `PORT`). Il ne fait aucun appel à un service externe. L’application n’utilise ni API, ni CDN, ni police distante ; les ressources sont livrées avec le projet.

```sh
npm test
npm run build
npm start
```

Le build vérifie la syntaxe JavaScript et l’absence d’URL externe ou d’appel réseau, puis produit `dist/`. `npm start` sert ce dossier. Le serveur désactive les connexions applicatives avec la politique `connect-src 'none'`.

## Parcours disponibles

- Explorer le projet d’exemple Moonshot ou le remplacer par votre propre brief.
- Consulter les domaines, le plan, les tâches et les étapes souvent oubliées.
- Filtrer, rechercher, ajouter et terminer des tâches.
- Échanger avec le copilote simulé dans une tâche.
- Modifier et sauvegarder un livrable ; enregistrer une décision.
- Retrouver les ressources pratiques et exporter le projet.

L’interface s’adapte au téléphone et au bureau. Les fenêtres sont accessibles au clavier, se ferment avec Échap et les animations respectent la préférence de réduction des mouvements.

## Déploiement Vercel

Le fichier `vercel.json` configure un hébergement statique : preset **Other**, build `npm run build`, sortie `dist`. Aucune installation de dépendance applicative n’est nécessaire. Le serveur Node de développement n’est pas déployé.

Pour un nouveau projet Vercel, importez `Myst3k69/LSU2026-BuildOS` et sélectionnez la branche `develop` pour le premier déploiement. Si `develop` doit fournir le site de production, définissez-la comme branche de production dans les paramètres Git du projet Vercel.

L’application déployée reste un prototype avec IA simulée et stockage local. Les données sont propres au navigateur et à l’adresse du site : une nouvelle URL de déploiement ne récupère pas les données enregistrées sur une autre adresse.
