require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration du stockage des fichiers uploadés
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ 
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Configuration Microsoft (gérée côté client)
const clientId = process.env.VITE_MICROSOFT_CLIENT_ID;

// Middleware pour logger les requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Endpoint de test
app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Le serveur fonctionne correctement' });
});

// 2. Endpoint pour uploader un fichier (stockage local temporaire)
app.post('/upload-onedrive', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier téléchargé' });
    }

    // Ici, vous pouvez ajouter une logique de traitement supplémentaire si nécessaire
    // Par exemple, renommer le fichier, le déplacer, etc.
    
    const fileInfo = {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      // Générer une URL pour accéder au fichier (à adapter selon votre configuration)
      url: `/uploads/${path.basename(req.file.path)}`
    };

    // Dans une vraie application, vous pourriez vouloir:
    // 1. Stocker le fichier dans un stockage cloud (S3, etc.)
    // 2. Enregistrer les métadonnées dans une base de données
    // 3. Retourner l'URL publique du fichier

    res.json({
      message: 'Fichier téléchargé avec succès',
      file: fileInfo,
      // Pour la compatibilité avec votre code existant
      webUrl: `http://localhost:3001${fileInfo.url}`,
      id: path.basename(req.file.path, path.extname(req.file.path))
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    res.status(500).json({ 
      error: 'Erreur lors du traitement du fichier',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static(uploadsDir));

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/test`);
  console.log(`Dossier uploads: ${uploadsDir}`);
});