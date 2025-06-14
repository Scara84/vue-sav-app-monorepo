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

const runCommand = (command, cwd = __dirname) => {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd,
      env: { ...process.env, VERCEL_BUILD_RUNNING: 'true' }
    });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`, error);
    return false;
  }
};

try {
  // Installer les dépendances racine
  console.log('Installing root dependencies...');
  if (!runCommand('npm install')) {
    throw new Error('Failed to install root dependencies');
  }

  // Construire le client
  console.log('Building client...');
  if (!runCommand('npm install && npm run build', join(__dirname, 'vue-sav-app/client'))) {
    throw new Error('Failed to build client');
  }

  // Copier les fichiers du client
  console.log('Copying client files...');
  const clientDist = join(__dirname, 'vue-sav-app/client/dist');
  
  if (existsSync(clientDist)) {
    if (!runCommand(`cp -r ${clientDist}/* ${distDir}`)) {
      throw new Error('Failed to copy client files');
    }
    console.log('Client files copied successfully');
  } else {
    throw new Error(`Client dist directory not found at: ${clientDist}`);
  }

  console.log('Vercel build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
