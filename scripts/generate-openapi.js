const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const API_PORT = 3000;
const TIMEOUT_MS = 15000;

async function isApiRunning(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function fetchOpenApi(port) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${port}/docs/json`, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
    });

    req.on('error', reject);
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function waitForApi(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const running = await isApiRunning(port);
    if (running) return true;
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  const apiRunning = await isApiRunning(API_PORT);
  let apiProcess = null;

  if (!apiRunning) {
    console.log('Building API...');
    const { execSync } = require('child_process');
    execSync('npm run build:api', { stdio: 'inherit' });

    console.log('Starting API...');
    apiProcess = spawn('node', ['dist/api/index.js'], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    const started = await waitForApi(API_PORT);
    if (!started) {
      if (apiProcess) apiProcess.kill();
      throw new Error('API failed to start');
    }
    console.log('API started successfully');
  } else {
    console.log('API already running, skipping start...');
  }

  try {
    console.log('Fetching OpenAPI schema...');
    const openapiJson = await fetchOpenApi(API_PORT);
    
    const outputPath = path.join(process.cwd(), 'docs', 'openapi.json');
    fs.writeFileSync(outputPath, openapiJson);
    console.log(`OpenAPI schema written to ${outputPath}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (apiProcess) {
      apiProcess.kill();
    }
  }
}

main();
