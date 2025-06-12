import multer from 'multer';
import oneDriveService from '../services/oneDrive.service.js';
import { ERROR_MESSAGES } from '../config/constants.js';

// Configuration de multer pour le stockage en mémoire
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // Augmentation à 25MB pour les fichiers plus volumineux
  },
  fileFilter: (req, file, cb) => {
    // Types MIME acceptés
    const allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain',
      'text/csv',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed'
    ];

    // Vérifier si le type MIME est autorisé
    if (file.mimetype.startsWith('image/') || allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non supporté: ${file.mimetype}. Types acceptés: images, PDF, documents Office, fichiers texte et archives.`), false);
    }
  },
}).single('file');

/**
 * Middleware pour gérer l'upload de fichier
 */
const handleFileUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Une erreur de multer (taille de fichier, etc.)
      return res.status(400).json({
        success: false,
        error: `Erreur lors de l'upload: ${err.message}`
      });
    } else if (err) {
      // Une erreur inattendue
      console.error('Erreur lors du traitement du fichier:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Erreur lors du traitement du fichier'
      });
    }
    
    // Vérifier qu'un fichier a bien été fourni
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }
    
    next();
  });
};

/**
 * Contrôleur pour l'upload de fichiers vers OneDrive
 */
const uploadToOneDrive = async (req, res) => {
  try {
    const { file } = req;
    const folderName = process.env.ONEDRIVE_FOLDER || 'SAV_Images';
    
    console.log(`Tentative d'upload du fichier: ${file.originalname} (${file.size} octets)`);
    
    // Uploader le fichier vers OneDrive et obtenir le lien de partage
    const result = await oneDriveService.uploadFile(
      file.buffer,
      file.originalname,
      folderName,
      file.mimetype
    );
    
    // Formater la réponse pour le client
    const response = {
      success: result.success,
      message: result.message,
      file: {
        name: result.fileInfo.name,
        url: result.webUrl,
        shareLink: result.shareLink,
        id: result.fileInfo.id,
        size: result.fileInfo.size,
        lastModified: result.fileInfo.lastModified,
        mimeType: file.mimetype
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Erreur lors de l\'upload vers OneDrive:', error);
    
    let statusCode = 500;
    let errorMessage = ERROR_MESSAGES.UPLOAD_FAILED;
    
    // Gestion des erreurs spécifiques
    if (error.message.includes('invalid_grant') || error.message.includes('AADSTS7000215')) {
      statusCode = 401;
      errorMessage = 'Erreur d\'authentification. Vérifiez vos identifiants Microsoft.';
    } else if (error.statusCode === 401 || error.statusCode === 403) {
      statusCode = error.statusCode;
      errorMessage = 'Accès refusé. Vérifiez les autorisations de l\'application.';
    } else if (error.statusCode === 400) {
      statusCode = 400;
      errorMessage = 'Requête invalide. Vérifiez les données envoyées.';
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Endpoint de test
 */
const testEndpoint = (req, res) => {
  res.json({
    status: 'ok',
    message: 'Le serveur fonctionne correctement',
    timestamp: new Date().toISOString()
  });
};

export { handleFileUpload, uploadToOneDrive, testEndpoint };

export default {
  handleFileUpload,
  uploadToOneDrive,
  testEndpoint
};
