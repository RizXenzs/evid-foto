const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\RizXenzs\\.gemini\\antigravity-ide\\brain\\f7de6e4b-574b-48b5-923f-dc870f1d85f7\\evidfoto_pwa_icon_1782969688582.png';
const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.copyFileSync(srcPath, path.join(publicDir, 'icon-192.png'));
fs.copyFileSync(srcPath, path.join(publicDir, 'icon-512.png'));

console.log('Successfully copied PWA icons to public directory!');
