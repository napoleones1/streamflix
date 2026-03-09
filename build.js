import { execSync } from 'child_process';
import { cpSync, mkdirSync } from 'fs';

console.log('Building client...');
execSync('cd client && npm install && npm run build', { stdio: 'inherit' });

console.log('Copying build output...');
mkdirSync('dist', { recursive: true });
cpSync('client/dist', 'dist', { recursive: true });

console.log('Build complete!');
