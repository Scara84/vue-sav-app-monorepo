require('dotenv').config();

module.exports = {
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tenantId: process.env.MICROSOFT_TENANT_ID,
    userEmail: process.env.MICROSOFT_USER_EMAIL,
    oneDriveFolder: process.env.ONEDRIVE_FOLDER || 'SAV_Images'
  },
  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development'
  }
};
