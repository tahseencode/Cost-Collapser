import express from 'express';
import { storeRouter } from './storeRouter.js';
import { CONFIG } from '../config.js';

export function createMockStoreServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(storeRouter);

  // Redirect root to main product demo
  app.get('/', (req, res) => {
    res.redirect('/products/titan-carbide-drill-5000');
  });

  return app;
}

// Standalone execution support
if (process.argv[1]?.endsWith('server.js') && process.argv.includes('--store-only')) {
  const app = createMockStoreServer();
  app.listen(CONFIG.MOCK_STORE_PORT, () => {
    console.log(`🏪 Mock Industrial Store running at http://localhost:${CONFIG.MOCK_STORE_PORT}`);
  });
}
