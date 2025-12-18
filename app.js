
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import path from 'path';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Load Next.js config (optional, but useful for basePath)
import nextConfig from './next.config.mjs'
const { basePath = '', trailingSlash = false } = nextConfig;

// Static file serving for `/media` (adjust path as needed)
const mediaDir = path.join(process.cwd(), 'media');
const mediaStatic = serveStatic(mediaDir, {
  index: false,
  etag: true,
  maxAge: '1h',
  fallthrough: false, // Ensure requests to /media/* don't leak to Next.js
});

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    const { pathname } = parsedUrl;

    // 1. Handle /media/* requests
    const mediaPrefix = `${basePath}/media`;
    if (pathname?.startsWith(mediaPrefix)) {
      console.log('[server] Serving media:', pathname);
      req.url = pathname.slice(mediaPrefix.length) || '/'; // Strip /media prefix
      return mediaStatic(req, res, finalhandler(req, res));
    }

    // 2. Handle Next.js API routes (/api/*)
    if (pathname?.startsWith(`${basePath}/api`)) {
      console.log('[server] Forwarding API request:', pathname);
      return handle(req, res, parsedUrl);
    }

    // 3. Handle all other requests (pages, assets, etc.)
    handle(req, res, parsedUrl);
  });

  server.listen(port, hostname, () => {
    console.log(`
      > Ready on http://${hostname}:${port}${basePath}
      > Environment: ${dev ? 'development' : process.env.NODE_ENV}
      > basePath: ${basePath || '/'}
      > Media files: ${mediaDir}
    `);
  });

  // Error handling
  server.on('error', (err) => {
    console.error('[server] Error:', err);
    process.exit(1);
  });
});
