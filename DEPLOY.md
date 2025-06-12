# Instructions de déploiement Infomaniak

Ce guide explique comment déployer l'application sur un hébergement Node.js Infomaniak en utilisant Git.

## Prérequis

- Un compte Infomaniak avec un hébergement Node.js activé
- Git installé en local
- Accès en SSH à votre serveur Infomaniak

## Configuration du dépôt Git

1. Connectez-vous à votre espace client Infomaniak
2. Allez dans "Hébergements" > Votre hébergement > "Node.js"
3. Activez le déploiement Git si ce n'est pas déjà fait
4. Notez l'URL du dépôt Git fournie par Infomaniak (au format `git@git.infomaniak.com:...`)

## Configuration locale

1. Assurez-vous que tous vos changements sont commités :
   ```bash
   git add .
   git commit -m "Préparation pour déploiement Infomaniak"
   ```

2. Ajoutez le dépôt distant d'Infomaniak :
   ```bash
   git remote add infomaniak git@git.infomaniak.com:VOTRE_DEPOT.git
   ```

3. Poussez le code vers Infomaniak :
   ```bash
   git push infomaniak master
   ```
   (ou `main` selon le nom de votre branche principale)

## Configuration des variables d'environnement

1. Dans l'interface Infomaniak, allez dans la section "Variables d'environnement"
2. Ajoutez toutes les variables nécessaires (voir le fichier `.env.example`)
3. Assurez-vous que `NODE_ENV` est défini sur `production`

## Premier déploiement

1. Après le premier push, Infomaniak va automatiquement :
   - Installer les dépendances avec `npm install`
   - Construire l'application avec `npm run build`
   - Démarrer l'application avec `node app.js`

2. Les logs de déploiement sont disponibles dans l'interface Infomaniak

## Mises à jour ultérieures

Pour déployer des mises à jour, il suffit de pousser vos changements :

```bash
git add .
git commit -m "Description des modifications"
git push infomaniak master
```

## Dépannage

- **Problèmes de dépendances** : Vérifiez les logs de déploiement pour les erreurs d'installation
- **Variables d'environnement manquantes** : Assurez-vous que toutes les variables nécessaires sont définies
- **Problèmes de port** : Vérifiez que le port configuré correspond à celui d'Infomaniak (généralement dans une variable d'environnement `PORT`)

## Accès aux logs

Les logs de l'application sont disponibles dans l'interface Infomaniak :
1. Allez dans "Hébergements" > Votre hébergement > "Node.js"
2. Cliquez sur "Logs"

## Configuration avancée

Le fichier `app.infomaniak.yaml` contient la configuration spécifique au déploiement Infomaniak. Vous pouvez le modifier pour personnaliser le processus de déploiement.
