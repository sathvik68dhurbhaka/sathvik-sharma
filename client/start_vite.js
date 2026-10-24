import { createServer } from './node_modules/vite/dist/node/index.js';

async function start() {
  console.log('Starting Vite development server...');
  const server = await createServer({
    configFile: './vite.config.ts',
    server: {
      port: 5173,
      host: '0.0.0.0'
    }
  });
  await server.listen();
  console.log('Vite server running at http://localhost:5173');
  server.printUrls();
}

start().catch(err => {
  console.error('Failed to start Vite dev server:', err);
  process.exit(1);
});
