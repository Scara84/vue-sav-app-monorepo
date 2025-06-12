import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import config from '../config/index.js';
import { MS_GRAPH, ERROR_MESSAGES } from '../config/constants.js';

class OneDriveService {
  constructor() {
    this.msalClient = new ConfidentialClientApplication(config.msal);
    this.graphClient = null;
    this.drivePath = config.microsoft.drivePath;
    this.initialized = false;
  }

  /**
   * Initialise le client Graph avec un token d'accès
   */
  async initialize() {
    if (this.initialized) return true;

    try {
      const token = await this.getAccessToken();
      
      this.graphClient = Client.init({
        authProvider: (done) => {
          done(null, token);
        }
      });

      this.initialized = true;
      console.log('OneDriveService initialisé avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de OneDriveService:', error);
      throw new Error(ERROR_MESSAGES.AUTH_FAILED);
    }
  }

  /**
   * Obtient un token d'accès via MSAL
   */
  async getAccessToken() {
    try {
      const response = await this.msalClient.acquireTokenByClientCredential({
        scopes: config.microsoft.scopes,
      });

      if (!response || !response.accessToken) {
        throw new Error('Aucun token d\'accès reçu');
      }

      return response.accessToken;
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token d\'accès:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un dossier existe et le crée si nécessaire
   */
  async ensureFolderExists(folderName = MS_GRAPH.DEFAULT_FOLDER) {
    if (!this.initialized) await this.initialize();

    try {
      console.log(`Vérification de l'existence du dossier: ${folderName}`);
      
      // Vérifier si le dossier existe déjà
      await this.graphClient
        .api(`${MS_GRAPH.BASE_URL}/${MS_GRAPH.DRIVE_ID}/root:/${encodeURIComponent(folderName)}`)
        .get();
      
      console.log('Dossier trouvé');
      return true;
      
    } catch (error) {
      if (error.statusCode === 404) {
        try {
          // Le dossier n'existe pas, on le crée
          console.log('Dossier non trouvé, création en cours...');
          
          await this.graphClient
            .api(`${MS_GRAPH.BASE_URL}/${MS_GRAPH.DRIVE_ID}/root/children`)
            .post({
              name: folderName,
              folder: {},
              '@microsoft.graph.conflictBehavior': 'rename'
            });
            
          console.log('Dossier créé avec succès');
          return true;
        } catch (createError) {
          console.error('Erreur lors de la création du dossier:');
          console.error('Code:', createError.code);
          console.error('Message:', createError.message);
          if (createError.statusCode) console.error('Status:', createError.statusCode);
          throw createError;
        }
      }
      
      console.error('Erreur lors de la vérification du dossier:');
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      if (error.statusCode) console.error('Status:', error.statusCode);
      throw error;
    }
  }

  /**
   * Upload un fichier vers OneDrive
   */
  async uploadFile(fileBuffer, fileName, folderName = MS_GRAPH.DEFAULT_FOLDER, mimeType = 'application/octet-stream') {
    if (!this.initialized) await this.initialize();
    
    try {
      // S'assurer que le dossier existe
      await this.ensureFolderExists(folderName);
      
      console.log(`Tentative d'upload du fichier: ${folderName}/${fileName}`);
      
      // Uploader le fichier
      const uploadResponse = await this.graphClient
        .api(`${MS_GRAPH.BASE_URL}/${MS_GRAPH.DRIVE_ID}/root:/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}:/content`)
        .header('Content-Type', mimeType)
        .put(fileBuffer);
      
      console.log('Fichier uploadé avec succès, création du lien de partage...');
      
      // Créer un lien de partage
      const shareResponse = await this.graphClient
        .api(`${MS_GRAPH.BASE_URL}/${MS_GRAPH.DRIVE_ID}/items/${uploadResponse.id}/createLink`)
        .post({
          type: 'view',
          scope: 'anonymous'
        });
      
      console.log('Lien de partage créé avec succès');
      
      return {
        success: true,
        fileInfo: {
          name: uploadResponse.name,
          webUrl: shareResponse.link?.webUrl || uploadResponse.webUrl,
          downloadUrl: uploadResponse['@microsoft.graph.downloadUrl'] || shareResponse.link?.webUrl,
          id: uploadResponse.id,
          size: uploadResponse.size,
          lastModified: uploadResponse.lastModifiedDateTime
        }
      };
      
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:');
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      if (error.statusCode) console.error('Status:', error.statusCode);
      if (error.body) {
        try {
          const errorBody = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
          console.error('Détails:', errorBody);
        } catch (e) {
          console.error('Corps de l\'erreur:', error.body);
        }
      }
      throw error;
    }
  }
}

const oneDriveService = new OneDriveService();
export default oneDriveService;
