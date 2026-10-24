const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5173;
const dist = path.join(__dirname, 'dist');

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api')) {
    // Proxy API requests to backend on port 5000
    const headers = { ...req.headers, host: '127.0.0.1:5000' };
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: req.url,
      method: req.method,
      headers
    };
    const proxy = http.request(options, (pRes) => {
      res.writeHead(pRes.statusCode, pRes.headers);
      pRes.pipe(res, { end: true });
    });
    proxy.on('error', (err) => {
      console.error('Proxy error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Backend gateway error: port 5000 unavailable' }));
      }
    });
    if (req.method === 'GET' || req.method === 'HEAD') {
      proxy.end();
    } else {
      req.pipe(proxy, { end: true });
    }
    return;
  }

  // Serve static files from client/dist
  let filePath = path.join(dist, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(dist, 'index.html'); // SPA fallback
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  const contentType = mimeTypes[ext] || 'text/html';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading asset');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Frontend Dev Server running on http://localhost:${PORT}`);
  console.log(` Proxying /api -> http://127.0.0.1:5000`);
  console.log(`===============================================`);
});
