import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/products.routes.js';
import userRoutes from './routes/user.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import { syncAllProducts } from './services/sync.service.js';
import { setWoltTokens } from './services/stores/wolt.adapter.js';
import { setLavkaTokens } from './services/stores/lavka.adapter.js';

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
app.use('/api/orders', ordersRoutes);

// Manual sync endpoint (protected by a simple key)
app.post('/api/sync', async (req, res) => {
  try {
    const count = await syncAllProducts();
    res.json({ success: true, synced: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Wolt token management endpoint (для сохранения токенов)
app.post('/api/wolt/tokens', async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.body;
    if (!accessToken || !refreshToken) {
      return res.status(400).json({ error: 'accessToken and refreshToken required' });
    }
    await setWoltTokens({ accessToken, refreshToken });
    res.json({ success: true, message: 'Tokens saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lavka token management endpoint (для сохранения токенов Яндекс Лавки)
app.post('/api/lavka/tokens', async (req, res) => {
  try {
    const { sessionId, lavkaSession, authProxyCt, authProxyState, csrfToken } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId required' });
    }
    await setLavkaTokens({ sessionId, lavkaSession, authProxyCt, authProxyState, csrfToken });
    res.json({ success: true, message: 'Lavka tokens saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ LAVKA ENDPOINTS (Puppeteer) ============
import { 
  getLavkaDeliveryInfo, 
  searchLavkaProducts, 
  addToLavkaCart, 
  getLavkaCart, 
  clearLavkaCart,
  placeLavkaOrder,
  checkLavkaAuth 
} from './services/stores/lavka.adapter.js';

// Delivery info
app.get('/api/test/lavka', async (req, res) => {
  try {
    const { lat = 43.238949, lon = 76.945465 } = req.query;
    const result = await getLavkaDeliveryInfo({ lat: parseFloat(lat), lon: parseFloat(lon) });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search products
app.get('/api/lavka/search', async (req, res) => {
  try {
    const { q, lat = 43.238949, lon = 76.945465 } = req.query;
    if (!q) return res.status(400).json({ error: 'Query (q) required' });
    
    const products = await searchLavkaProducts(q, { lat: parseFloat(lat), lon: parseFloat(lon) });
    res.json({ products, count: products.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to cart
app.post('/api/lavka/cart/add', async (req, res) => {
  try {
    const { productId, quantity = 1, lat = 43.238949, lon = 76.945465 } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    
    const result = await addToLavkaCart(productId, quantity, { lat, lon });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cart
app.get('/api/lavka/cart', async (req, res) => {
  try {
    const { lat = 43.238949, lon = 76.945465 } = req.query;
    const cart = await getLavkaCart({ lat: parseFloat(lat), lon: parseFloat(lon) });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear cart
app.delete('/api/lavka/cart', async (req, res) => {
  try {
    const { lat = 43.238949, lon = 76.945465 } = req.query;
    await clearLavkaCart({ lat: parseFloat(lat), lon: parseFloat(lon) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Place order
app.post('/api/lavka/order', async (req, res) => {
  try {
    const { lat = 43.238949, lon = 76.945465, address, apartment, entrance, floor, comment, phone, paymentMethod } = req.body;
    if (!address || !phone) return res.status(400).json({ error: 'address and phone required' });
    
    const result = await placeLavkaOrder({
      coordinates: { lat, lon },
      address,
      apartment,
      entrance,
      floor,
      comment,
      phone,
      paymentMethod
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth status
app.get('/api/lavka/auth-status', async (req, res) => {
  try {
    const isLoggedIn = await checkLavkaAuth();
    res.json({ loggedIn: isLoggedIn });
  } catch (error) {
    res.json({ loggedIn: false, error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
