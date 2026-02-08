import 'dotenv/config';
import connectDB from './config/db.js';
import app from './app.js';
import { syncAllProducts } from './services/sync.service.js';

const PORT = process.env.PORT || 8080;

async function start() {
  // Connect to MongoDB
  await connectDB();

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 FreshScout API running on port ${PORT}`);
  });

  // Initial sync if DB is empty
  const Product = (await import('./models/Product.js')).default;
  const count = await Product.countDocuments();
  if (count === 0) {
    console.log('📦 Database empty, starting initial sync...');
    syncAllProducts().catch(err => console.error('Initial sync failed:', err));
  } else {
    console.log(`📦 Database has ${count} products`);
  }

  // Schedule periodic sync
  const intervalHours = Number(process.env.SYNC_INTERVAL_HOURS) || 6;
  setInterval(() => {
    console.log('⏰ Scheduled sync starting...');
    syncAllProducts().catch(err => console.error('Scheduled sync failed:', err));
  }, intervalHours * 60 * 60 * 1000);
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
