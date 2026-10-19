import 'dotenv/config';
import path from 'node:path';
import { existsSync } from 'node:fs';
import express from 'express';
import { createApp } from './app';

const app = createApp();
const port = Number(process.env.PORT || 3000);
const distDirectory = path.resolve('dist');
const indexFile = path.join(distDirectory, 'index.html');

if (existsSync(indexFile)) {
  app.use(express.static(distDirectory, {
    index: false,
    maxAge: '1h',
    setHeaders(response, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  app.get('*', (request, response, next) => {
    if (request.path.startsWith('/api/') || request.path.startsWith('/media/')) {
      next();
      return;
    }
    response.sendFile(indexFile);
  });
} else {
  app.get('/', (_request, response) => {
    response.status(503).send('Salon Website Builder has not been built yet. Run npm run build first.');
  });
}

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Salon Website Builder listening on 0.0.0.0:${port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
