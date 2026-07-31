import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const zip = new AdmZip();

const filesToInclude = [
  'manifest.json',
  'background.iife.js',
  'icon-256.png',
];

const dirsToInclude = [
  'content-ui',
  '_locales',
];

console.log('📦 Packaging Elementorify Chrome Extension...');

filesToInclude.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    zip.addLocalFile(filePath);
    console.log(`  + Added file: ${file}`);
  } else {
    console.warn(`  ! File missing: ${file}`);
  }
});

dirsToInclude.forEach(dir => {
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath)) {
    zip.addLocalFolder(dirPath, dir);
    console.log(`  + Added folder: ${dir}`);
  } else {
    console.warn(`  ! Folder missing: ${dir}`);
  }
});

const outputPath = path.join(rootDir, 'elementorify-v1.1.6.zip');
zip.writeZip(outputPath);

console.log(`✅ Package successfully created at: ${outputPath}`);
