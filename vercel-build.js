const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting Vercel build process...');

// Créer le répertoire de sortie s'il n'existe pas
const distDir = path.join(__dirname, 'client/dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

try {
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('Building client...');
  execSync('cd vue-sav-app/client && npm install && npm run build', { stdio: 'inherit' });

  console.log('Copying client files...');
  const clientDist = path.join(__dirname, 'vue-sav-app/client/dist');
  
  // Copier les fichiers construits au bon endroit
  if (fs.existsSync(clientDist)) {
    execSync(`cp -r ${clientDist}/* ${distDir}`, { stdio: 'inherit' });
    console.log('Client files copied successfully');
  } else {
    console.error('Client dist directory not found at:', clientDist);
    process.exit(1);
  }

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
