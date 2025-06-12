import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

// Configuration des chemins pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Création de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Configuration CORS pour le développement
if (process.env.NODE_ENV !== 'production') {
  import('cors').then(corsModule => {
    const cors = corsModule.default;
    app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));
  });
}

// Importation du serveur principal
import('./vue-sav-app/server/server.js').then(({ default: server }) => {
  // Montage des routes de l'API sous le préfixe /api
  app.use('/api', server);
  
  // En production, servir les fichiers statiques du client
  if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, 'vue-sav-app/client/dist');
    
    // Servir les fichiers statiques du client
    app.use(express.static(clientBuildPath));
    
    // Pour toutes les autres requêtes, renvoyer index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  }
  
  // Démarrer le serveur
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(error => {
  console.error('Erreur lors du chargement du serveur:', error);
  process.exit(1);
});

export default app;
