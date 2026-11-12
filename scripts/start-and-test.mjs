import { spawn } from 'child_process';
import http from 'http';

function checkReady() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:3000', (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(maxWaitMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const ready = await checkReady();
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

async function main() {
  console.log('🚀 Launching Next.js production server on 127.0.0.1:3000...');
  
  const server = spawn('cmd.exe', ['/c', 'npx', 'next', 'start', '-H', '127.0.0.1', '-p', '3000'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: '3000', HOSTNAME: '127.0.0.1' },
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  const isReady = await waitForServer();
  if (!isReady) {
    console.error('❌ Server failed to respond on 127.0.0.1:3000 within 25 seconds.');
    server.kill();
    process.exit(1);
  }

  console.log('✅ Next.js server responded ready on http://127.0.0.1:3000! Starting E2E test suite...\n');

  const tester = spawn('node', ['scripts/test-e2e.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, BASE_URL: 'http://127.0.0.1:3000' },
  });

  tester.on('close', (code) => {
    console.log(`\n🧹 Shutting down test server (exit code: ${code})...`);
    server.kill();
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
