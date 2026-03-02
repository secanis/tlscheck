const fs = require('fs');
const path = require('path');

const platform = process.argv[2];

if (!platform) {
  console.error('Usage: node scripts/build.js <platform>');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const platformDir = path.join(rootDir, 'platforms', platform);
const distDir = path.join(rootDir, 'dist', 'extension', platform);

if (!fs.existsSync(platformDir)) {
  console.error(`Platform "${platform}" not found in platforms/ directory.`);
  process.exit(1);
}

// Ensure dist directory exists
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

const execOrFail = (command, cwd) => {
  try {
    require('child_process').execSync(command, {
      stdio: 'inherit',
      cwd
    });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    process.exit(1);
  }
};

// Compile TypeScript for extension
execOrFail('npx tsc -p tsconfig.extension.json', rootDir);

const removeTypeScriptFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeTypeScriptFiles(fullPath);
      return;
    }
    if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      fs.rmSync(fullPath, { force: true });
    }
  });
};

// Copy shared source files
try {
  const items = fs.readdirSync(srcDir);
  items.forEach(item => {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(distDir, item);
    fs.cpSync(srcPath, destPath, { recursive: true });
  });
  removeTypeScriptFiles(distDir);
  console.log(`Copied source files to dist/extension/${platform}`);
} catch (err) {
  console.error('Error copying source files:', err);
  process.exit(1);
}

// Replace compiled JS in dist from TypeScript output
const compiledDir = path.join(rootDir, 'dist', 'extension-build');
if (fs.existsSync(compiledDir)) {
  const compiledItems = fs.readdirSync(compiledDir);
  compiledItems.forEach(item => {
    const compiledPath = path.join(compiledDir, item);
    const destPath = path.join(distDir, item);
    fs.cpSync(compiledPath, destPath, { recursive: true });
  });
  console.log(`Copied compiled extension scripts from dist/extension-build`);
}

// Copy platform-specific manifest
const manifestSrc = path.join(platformDir, 'manifest.json');
const manifestDest = path.join(distDir, 'manifest.json');

if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, manifestDest);
  console.log(`Copied manifest for ${platform}`);
} else {
  console.error(`Manifest not found for platform ${platform}`);
  process.exit(1);
}

console.log(`Build complete for ${platform}! Output directory: dist/extension/${platform}`);
