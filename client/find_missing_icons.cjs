const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const iconsFile = path.join(srcDir, 'icons.tsx');
const iconsContent = fs.readFileSync(iconsFile, 'utf8');

const exportedIcons = new Set();
const exportMatches = iconsContent.matchAll(/export const ([a-zA-Z0-9_]+) =/g);
for (const m of exportMatches) {
  exportedIcons.add(m[1]);
}

const importedIcons = new Set();

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      scanDir(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      if (f === 'icons.tsx') continue;
      const content = fs.readFileSync(full, 'utf8');
      const importMatches = content.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g);
      for (const m of importMatches) {
        const names = m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
        names.forEach(n => importedIcons.add(n));
      }
    }
  }
}

scanDir(srcDir);

const missing = [];
for (const icon of importedIcons) {
  if (!exportedIcons.has(icon)) {
    missing.push(icon);
  }
}

console.log('Total unique icons used:', importedIcons.size);
console.log('Missing icons:', missing);
