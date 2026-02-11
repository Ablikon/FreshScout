/**
 * Arbuz.kz Store Adapter
 * 
 * Uses direct HTTP API calls to arbuz.kz
 * 
 * Flow:
 * 1. Use saved auth token (from env or manual login)
 * 2. Clear cart via API
 * 3. Add items to cart
 * 4. Create order
 * 
 * CREDENTIALS: 
 * - ARBUZ_TOKEN: Auth token (get from browser dev tools after login)
 * - ARBUZ_PHONE: Phone number
 */

import fs from 'fs/promises';

const BASE_URL = 'https://arbuz.kz';
const API_URL = 'https://arbuz.kz/api/v1';
const TOKEN_PATH = '/app/data/arbuz_token.json';

/**
 * Get saved token or from env
 */
async function getToken() {
  // First check env
  if (process.env.ARBUZ_TOKEN) {
    return process.env.ARBUZ_TOKEN;
  }
  
  // Then check saved file
  try {
    const data = await fs.readFile(TOKEN_PATH, 'utf-8');
    const { token, expiresAt } = JSON.parse(data);
    if (new Date(expiresAt) > new Date()) {
      return token;
    }
  } catch {}
  
  return null;
}

/**
 * Save token to file
 */
async function saveToken(token, expiresIn = 30 * 24 * 60 * 60 * 1000) {
  try {
    await fs.mkdir('/app/data', { recursive: true });
    await fs.writeFile(TOKEN_PATH, JSON.stringify({
      token,
      expiresAt: new Date(Date.now() + expiresIn).toISOString(),
    }));
    console.log('[Arbuz] Token saved');
  } catch (err) {
    console.error('[Arbuz] Failed to save token:', err.message);
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const token = await getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Arbuz API error ${response.status}: ${text}`);
  }
  
  return response.json();
}

/**
 * Clear cart
 */
async function clearCart() {
  console.log('[Arbuz] Clearing cart...');
  try {
    await apiRequest('/cart', { method: 'DELETE' });
  } catch (err) {
    // Cart might be empty, ignore
    console.log('[Arbuz] Cart clear:', err.message);
  }
}

/**
 * Add item to cart
 */
async function addToCart(productId, quantity = 1) {
  console.log(`[Arbuz] Adding product ${productId} x${quantity}`);
  
  return apiRequest('/cart/items', {
    method: 'POST',
    body: JSON.stringify({
      product_id: parseInt(productId),
      quantity,
    }),
  });
}

/**
 * Create order
 */
async function createArbuzOrder({ address, apartment, entrance, floor, comment, contactPhone, paymentMethod = 'card' }) {
  console.log('[Arbuz] Creating order...');
  
  return apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify({
      address: {
        street: address,
        apartment,
        entrance,
        floor,
      },
      comment,
      phone: contactPhone,
      payment_method: paymentMethod,
    }),
  });
}

/**
 * Main function to place an Arbuz order
 */
export async function placeArbuzOrder({ items, address, apartment, entrance, floor, comment, contactPhone, city = 'almaty' }) {
  const token = await getToken();
  
  if (!token) {
    throw new Error(
      'Arbuz не авторизован. Нужно получить токен:\n' +
      '1. Зайди на arbuz.kz и авторизуйся\n' +
      '2. Открой DevTools → Network\n' +
      '3. Найди запрос с Authorization: Bearer ...\n' +
      '4. Скопируй токен и добавь ARBUZ_TOKEN в docker-compose.yml'
    );
  }
  
  console.log('[Arbuz] Starting order for', items.length, 'items');
  
  try {
    // Clear cart first
    await clearCart();
    
    // Add all items
    for (const item of items) {
      let productId = item.productId;
      
      // Extract from URL if needed: /item/123456-slug
      if (!productId && item.url) {
        const match = item.url.match(/item\/(\d+)/);
        if (match) productId = match[1];
      }
      
      if (productId) {
        await addToCart(productId, item.quantity || 1);
      } else {
        console.warn('[Arbuz] No productId for item:', item.name || item.title);
      }
    }
    
    // Create order
    const result = await createArbuzOrder({
      address,
      apartment,
      entrance,
      floor,
      comment,
      contactPhone,
    });
    
    console.log('[Arbuz] Order created:', result);
    
    return {
      success: true,
      orderId: result.id || result.order_id || 'created',
      data: result,
    };
    
  } catch (err) {
    console.error('[Arbuz] Order failed:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Set token programmatically
 */
export async function setArbuzToken(token) {
  await saveToken(token);
  return { success: true };
}
