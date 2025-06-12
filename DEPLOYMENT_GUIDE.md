# Guide de déploiement pour Infomaniak

Ce guide explique comment déployer l'application SAV sur l'hébergement Node.js d'Infomaniak.

## Prérequis

- Compte Infomaniak avec accès à l'hébergement Node.js
- Accès SSH au serveur (si nécessaire pour le débogage)
- Node.js 20.x installé localement pour le développement
- Git pour la gestion du code source

## Structure du projet

```
.
├── app.js                    # Point d'entrée principal de l'application
├── app.infomaniak.yaml        # Configuration spécifique à Infomaniak
├── package.json               # Dépendances et scripts racine
├── vue-sav-app/               # Dossier principal de l'application
│   ├── client/                # Application Vue.js (frontend)
│   └── server/                # Serveur Node.js/Express (backend)
└── Procfile                  # Configuration pour les plateformes comme Heroku
```

## Configuration requise

### Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
NODE_ENV=production
PORT=3000
NPM_CONFIG_PRODUCTION=false
NODE_OPTIONS=--max_old_space_size=1024

# Configuration CORS (exemple)
CORS_ORIGIN=https://votredomaine.com

# Configuration Microsoft 365 / OneDrive
MICROSOFT_CLIENT_ID=votre_client_id
MICROSOFT_CLIENT_SECRET=votre_client_secret
MICROSOFT_TENANT_ID=votre_tenant_id
MICROSOFT_REDIRECT_URI=https://votredomaine.com/api/auth/callback
ONEDRIVE_FOLDER=SAV_Uploads
```

## Déploiement sur Infomaniak

### 1. Configuration du dépôt Git

1. Connectez-vous à votre espace d'hébergement Infomaniak
2. Allez dans "Hébergement" > "Node.js"
3. Sélectionnez votre application ou créez-en une nouvelle
4. Dans l'onglet "Déploiement", choisissez "Git" comme méthode de déploiement
5. Configurez le dépôt Git (URL et branche)

### 2. Configuration du déploiement

Dans l'interface d'Infomaniak, configurez les paramètres suivants :

- **Version de Node.js** : 20.x
- **Répertoire racine** : `/` (racine du dépôt)
- **Commandes de build** :
  ```bash
  npm install --legacy-peer-deps --no-audit --prefer-offline
  cd vue-sav-app/client && npm install --legacy-peer-deps --no-audit --prefer-offline && npm run build && cd ../..
  cd vue-sav-app/server && npm install --legacy-peer-deps --no-audit --prefer-offline && cd ../..
  ```
- **Commande de démarrage** : `node app.js`
- **Port d'écoute** : `3000`

### 3. Variables d'environnement

Dans l'interface d'Infomaniak, allez dans "Variables d'environnement" et ajoutez toutes les variables listées dans la section "Configuration requise".

### 4. Démarrage de l'application

1. Cliquez sur "Démarrer l'application"
2. Vérifiez les logs pour vous assurer que tout s'est bien passé
3. Visitez l'URL de votre application pour vérifier qu'elle fonctionne correctement

## Dépannage

### Erreurs courantes

1. **Module non trouvé** :
   - Vérifiez que toutes les dépendances sont correctement installées
   - Essayez de supprimer le dossier `node_modules` et de réinstaller les dépendances

2. **Problèmes de CORS** :
   - Vérifiez que la variable `CORS_ORIGIN` est correctement configurée
   - Assurez-vous que le frontend et le backend utilisent le même domaine et le même protocole (http/https)

3. **Erreurs de port** :
   - Vérifiez qu'aucun autre service n'utilise le port 3000
   - Assurez-vous que la variable `PORT` est correctement définie

### Accès aux logs

Les logs sont disponibles dans l'interface d'administration d'Infomaniak sous l'onglet "Logs". Vous pouvez également y accéder via SSH dans le répertoire `/var/log/nodejs/`.

## Maintenance

### Redémarrage de l'application

1. Allez dans l'interface d'administration d'Infomaniak
2. Sélectionnez votre application Node.js
3. Cliquez sur "Redémarrer"

### Mise à jour de l'application

1. Poussez vos modifications sur la branche configurée pour le déploiement
2. Infomaniak détectera automatiquement les changements et relancera l'application
3. Vérifiez les logs pour vous assurer que le déploiement s'est bien passé

## Sécurité

- Ne stockez jamais d'informations sensibles dans le code source
- Utilisez toujours HTTPS
- Gardez vos dépendances à jour
- Limitez les accès aux ressources sensibles
- Mettez en place un système de sauvegarde régulier

## Support

Pour toute question ou problème, veuillez contacter l'équipe de développement ou le support Infomaniak.
