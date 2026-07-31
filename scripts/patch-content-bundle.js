import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bundlePath = path.resolve(__dirname, '../content-ui/index.iife.js');

console.log('🛠️ Patching content-ui/index.iife.js with absolute URL resolution...');

let code = fs.readFileSync(bundlePath, 'utf8');

const helperFunc = `function _fixUrls(s){if(typeof s!="string")return s;const o=window.location.origin;let r=s.replace(/(src|href)=["']\\/(?!\\/)([^"']+)["']/gi,(m,a,p)=>\`\${a}="\${o}/\${p}"\`);r=r.replace(/"url"\\s*:\\s*"\\/(?!\\/)([^"]+)"/gi,(m,p)=>\`"url":"\${o}/\${p}"\`);r=r.replace(/url\\((['"]?)\\/(?!\\/)([^'")]+)\\1\\)/gi,(m,q,p)=>\`url(\${q}\${o}/\${p}\${q})\`);return r};`;

if (!code.includes('_fixUrls')) {
  code = helperFunc + code;
}

code = code.replace(
  'await navigator.clipboard.writeText(fe)',
  'await navigator.clipboard.writeText(_fixUrls(fe))'
);

code = code.replace(
  'navigator.clipboard.writeText(zt)',
  'navigator.clipboard.writeText(_fixUrls(zt))'
);

code = code.replace(
  'await navigator.clipboard.writeText(L)',
  'await navigator.clipboard.writeText(_fixUrls(L))'
);

fs.writeFileSync(bundlePath, code, 'utf8');
console.log('✅ content-ui/index.iife.js successfully patched!');
