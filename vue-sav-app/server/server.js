import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { fileURLToPath as fileURLToPath2 } from 'url';
import { dirname } from 'path';
import { access, mkdir } from 'fs/promises';
import serverConfig from './src/config/server.config.js';
import routes from './src/routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialisation de l'application Express
const app = express();

// Configuration des logs
const setupLogs = async () => {
  try {
    const logsDir = path.join(__dirname, serverConfig.logs.dir);
    await access(logsDir).catch(async () => {
      await mkdir(logsDir, { recursive: true });
      console.log(`Dossier de logs créé: ${logsDir}`);
    });
    
    // Redirection des logs vers des fichiers
    const logStream = createWriteStream(
      path.join(logsDir, serverConfig.logs.filename), 
      { flags: 'a' }
    );
    const errorStream = createWriteStream(
      path.join(logsDir, serverConfig.logs.errorFilename), 
      { flags: 'a' }
    );
    
    // Rediriger la sortie standard et d'erreur
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
      ).join(' ');
      logStream.write(`[${new Date().toISOString()}] ${message}\n`);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      const message = args.map(arg => 
        arg instanceof Error ? `${arg.message}\n${arg.stack}` : 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
      ).join(' ');
      errorStream.write(`[${new Date().toISOString()}] ${message}\n`);
      originalError(...args);
    };
    
  } catch (error) {
    console.error('Erreur lors de la configuration des logs:', error);
  }
};

// Configuration CORS
app.use(cors(serverConfig.cors));

// Middleware pour parser le JSON
app.use(express.json({ limit: serverConfig.bodyParser.limit }));
app.use(express.urlencoded({ 
  extended: serverConfig.bodyParser.extended, 
  limit: serverConfig.bodyParser.limit 
}));

// Middleware de logging des requêtes
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} from ${ip} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, serverConfig.static.uploads)));

// Routes de l'API
app.use('/api', routes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV
  });
});

// Redirection pour la compatibilité avec l'ancienne URL
app.post('/upload-onedrive', (req, res) => {
  // Redirige vers la version avec /api/ tout en conservant la méthode et le corps de la requête
  req.url = '/api/upload-onedrive';
  
  // Réinitialiser les en-têtes de la réponse
  res.setHeader('Access-Control-Allow-Origin', serverConfig.cors.origin);
  res.setHeader('Access-Control-Allow-Methods', serverConfig.cors.methods.join(','));
  res.setHeader('Access-Control-Allow-Headers', serverConfig.cors.allowedHeaders.join(','));
  
  // Poursuivre le traitement de la requête
  app.handle(req, res);
});

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';
  const stack = serverConfig.isDev ? err.stack : undefined;
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(stack && { stack })
  });
});

// Fonction pour démarrer le serveur
const startServer = async () => {
  try {
    // Configuration des logs
    await setupLogs();
    
    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = path.join(__dirname, serverConfig.static.uploads);
    await access(uploadsDir).catch(async () => {
      await mkdir(uploadsDir, { recursive: true });
      console.log(`Dossier uploads créé: ${uploadsDir}`);
    });
    
    // Démarrer le serveur
    const server = app.listen(serverConfig.port, '0.0.0.0', () => {
      console.log('\n=== Serveur démarré avec succès ===');
      console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`URL: http://localhost:${serverConfig.port}`);
      console.log(`URL API: http://localhost:${serverConfig.port}/api`);
      console.log(`Dossier uploads: ${uploadsDir}`);
      console.log('====================================');
    });
    
    // Gestion des erreurs non capturées
    process.on('uncaughtException', (error) => {
      console.error('Exception non capturée:', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Rejet non géré à:', promise, 'raison:', reason);
    });
    
    // Gestion de l'arrêt propre
    const gracefulShutdown = () => {
      console.log('\nArrêt du serveur en cours...');
      server.close(() => {
        console.log('Serveur arrêté avec succès');
        process.exit(0);
      });
      
      // Forcer l'arrêt après 5 secondes
      setTimeout(() => {
        console.error('Arrêt forcé du serveur');
        process.exit(1);
      }, 5000);
    };
    
    // Écouter les signaux d'arrêt
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Démarrer le serveur uniquement si ce fichier est exécuté directement
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Exporter l'application et la fonction de démarrage
export { app, startServer };

export default app;