import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';

// Configuration des chemins pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Création de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Configuration CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://sav.fruitstock.eu', 'https://www.sav.fruitstock.eu'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Log des requêtes pour le débogage
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Test de la route racine
app.get('/', (req, res) => {
  res.json({ status: 'API is running', environment: process.env.NODE_ENV || 'development' });
});

// Importation du serveur principal
import('./vue-sav-app/server/server.js')
  .then(({ default: server }) => {
    // Montage des routes de l'API sous le préfixe /api
    app.use('/api', server);
    
    // En production, servir les fichiers statiques du client
    if (process.env.NODE_ENV === 'production') {
      const clientBuildPath = path.join(__dirname, 'vue-sav-app/client/dist');
      
      console.log('Chemin des fichiers statiques du client:', clientBuildPath);
      
      // Servir les fichiers statiques du client
      app.use(express.static(clientBuildPath, { index: false }));
      
      // Pour toutes les autres requêtes, renvoyer index.html
      app.get('*', (req, res) => {
        console.log('Requête reçue pour:', req.path);
        res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
          if (err) {
            console.error('Erreur lors de l\'envoi du fichier index.html:', err);
            res.status(404).json({ error: 'Fichier non trouvé' });
          }
        });
      });
    }
    
    // Gestion des erreurs 404
    app.use((req, res) => {
      res.status(404).json({ error: 'Route non trouvée' });
    });
    
    // Gestion des erreurs globales
    app.use((err, req, res, next) => {
      console.error('Erreur non gérée:', err);
      res.status(500).json({ 
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });
    
    // Démarrer le serveur
    app.listen(PORT, '0.0.0.0', () => {
      console.log('=== Configuration du serveur ===');
      console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Port: ${PORT}`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`URL API: http://localhost:${PORT}/api`);
      console.log('================================');
    });
  })
  .catch(error => {
    console.error('Erreur critique lors du chargement du serveur:');
    console.error(error);
    console.error('Chemin du serveur tenté:', path.join(__dirname, 'vue-sav-app/server/server.js'));
    process.exit(1);
  });

export default app;
