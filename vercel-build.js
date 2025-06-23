import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Empêcher la récursion
if (process.env.VERCEL_BUILD_RUNNING === 'true') {
  console.log('Build already in progress, skipping recursive build');
  process.exit(0);
}

// Définir une variable d'environnement pour éviter la récursion
process.env.VERCEL_BUILD_RUNNING = 'true';

console.log('Starting Vercel build process...');

// Créer le répertoire de sortie s'il n'existe pas
const distDir = join(__dirname, 'client/dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

try {
  // Installer les dépendances racine
  console.log('Installing root dependencies...');
  execSync('npm install', {
    stdio: 'inherit',
    cwd: __dirname
  });

  // Construire le client
  console.log('Building client...');
  execSync('npm install && npm run build', {
    stdio: 'inherit',
    cwd: join(__dirname, 'vue-sav-app/client')
  });
  console.log('Client built successfully!');

  // Copier les fichiers du client
  console.log('Copying client files...');
  const clientDist = join(__dirname, 'vue-sav-app/client/dist');
  
  if (existsSync(clientDist)) {
    execSync(`cp -r ${clientDist}/* ${distDir}`, {
      stdio: 'inherit',
      cwd: __dirname
    });
    console.log('Client files copied successfully');
  } else {
    throw new Error(`Client dist directory not found at: ${clientDist}`);
  }

  console.log('Vercel build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
