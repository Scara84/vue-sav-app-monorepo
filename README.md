# SAV Application - Monorepo

Application de gestion des demandes SAV avec interface client et API serveur.

## Structure du projet

```
.
├── client/          # Application client Vue.js
├── server/          # API serveur Node.js
└── package.json     # Configuration du monorepo
```

## Prérequis

- Node.js >= 16.0.0
- Yarn (recommandé) ou npm

## Installation

1. Installer les dépendances :

```bash
yarn install
```

## Développement

### Lancer le client uniquement

```bash
yarn client
```

### Lancer le serveur uniquement

```bash
yarn server
```

### Lancer les deux en même temps

```bash
yarn dev
```

## Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables nécessaires pour le client et le serveur.

## Déploiement

```bash
yarn build
```
