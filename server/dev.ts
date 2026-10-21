import 'dotenv/config';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createViteServer } from 'vite';
import { createApp } from './app';

const app = createApp();
const port = Number(process.env.PORT || 3000);
const server = createHttpServer(app);

const vite = await createViteServer({
  server: {
    middlewareMode: true,
    hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
  },
  appType: 'spa',
});

app.use(vite.middlewares);

server.listen(port, '0.0.0.0', () => {
  console.log(`Salon Website Builder dev server listening on 0.0.0.0:${port}`);
});

const shutdown = async () => {
  await vite.close();
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
