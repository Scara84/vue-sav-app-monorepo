import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './src/config/index.js';
import routes from './src/routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration CORS
const whitelist = process.env.NODE_ENV === 'production' 
  ? [process.env.CLIENT_URL]
  : ['http://localhost:3000', 'http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Initialisation de l'application Express
const app = express();

// Middleware CORS
app.use(cors(corsOptions));

// Middleware pour parser le JSON
app.use(express.json({ limit: config.server.uploadLimit }));
app.use(express.urlencoded({ extended: true, limit: config.server.uploadLimit }));

// Servir les fichiers statiques (si nécessaire)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes de l'API
app.use('/api', routes);

// Redirection pour la compatibilité avec l'ancienne URL
app.post('/upload-onedrive', (req, res) => {
  // Redirige vers la version avec /api/ tout en conservant la méthode et le corps de la requête
  req.url = '/api/upload-onedrive';
  app.handle(req, res);
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    name: 'SAV App Backend',
    version: '1.0.0',
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trouvé'
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  
  res.status(500).json({
    success: false,
    error: 'Une erreur est survenue sur le serveur',
    // Ne pas envoyer les détails de l'erreur en production
    details: config.server.nodeEnv === 'development' ? err.message : undefined
  });
});

// Démarrer le serveur
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`\n=== SAV App Backend ===`);
  console.log(`Environnement: ${config.server.nodeEnv}`);
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Endpoint de test: http://localhost:${PORT}/api/test`);
  console.log(`Dossier OneDrive: ${config.microsoft.oneDriveFolder}`);
  console.log('========================\n');
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;