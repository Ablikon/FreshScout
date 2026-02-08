import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/products.routes.js';
import userRoutes from './routes/user.routes.js';
import { syncAllProducts } from './services/sync.service.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api', userRoutes);

// Manual sync endpoint (protected by a simple key)
app.post('/api/sync', async (req, res) => {
  try {
    const count = await syncAllProducts();
    res.json({ success: true, synced: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
