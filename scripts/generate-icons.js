import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourceIcon = path.join(rootDir, 'icon-256.png');
const sizes = [16, 32, 48, 128];

console.log('🎨 Generating Chrome Extension icons (16, 32, 48, 128)...');

async function generateIcons() {
  if (!fs.existsSync(sourceIcon)) {
    console.error('Source icon icon-256.png not found!');
    return;
  }

  const inputBuffer = fs.readFileSync(sourceIcon);

  for (const size of sizes) {
    const dest = path.join(rootDir, `icon-${size}.png`);
    await sharp(inputBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(dest);
    console.log(`  + Created icon-${size}.png (${size}x${size})`);
  }

  console.log('✅ All icons generated successfully!');
}

generateIcons().catch(err => console.error('Error generating icons:', err));
