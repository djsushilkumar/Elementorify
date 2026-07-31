import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = pkg.version || '1.7.0';

const zip = new AdmZip();

const filesToInclude = [
  'manifest.json',
  'background.iife.js',
  'icon-16.png',
  'icon-32.png',
  'icon-48.png',
  'icon-128.png',
  'icon-256.png',
];

const dirsToInclude = [
  'content-ui',
  'popup',
  '_locales',
];

console.log(`📦 Packaging Elementorify Chrome Extension (v${version})...`);

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

const outputPathVersioned = path.join(rootDir, `elementorify-v${version}.zip`);
const outputPathStandard = path.join(rootDir, 'elementorify.zip');

zip.writeZip(outputPathVersioned);
zip.writeZip(outputPathStandard);

console.log(`✅ Packages successfully created:`);
console.log(`   - ${outputPathVersioned}`);
console.log(`   - ${outputPathStandard}`);
