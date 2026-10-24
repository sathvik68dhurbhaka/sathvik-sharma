const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const esbuildPath = path.join(__dirname, 'node_modules/@esbuild/win32-x64/esbuild.exe');
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('Bundling with esbuild.exe...');
const args = [
  'src/main.tsx',
  '--bundle',
  '--outfile=dist/bundle.js',
  '--format=esm',
  '--jsx=automatic',
  '--alias:lucide-react=./src/icons.tsx',
  '--define:process.env.NODE_ENV="production"'
];

const output = execFileSync(esbuildPath, args, { cwd: __dirname, encoding: 'utf8' });
console.log('Bundle output:', output);

const stat = fs.statSync(path.join(distDir, 'bundle.js'));
console.log('Bundle generated successfully! Size:', (stat.size / 1024).toFixed(1) + ' KB');
