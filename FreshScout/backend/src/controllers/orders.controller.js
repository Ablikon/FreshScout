/**
 * Orders Controller
 * 
 * Handles order creation and management.
 * For real orders, routes to appropriate store adapters.
 */

import Order from '../models/Order.js';
import { placeArbuzOrder } from '../services/stores/arbuz.adapter.js';
import { placeWoltOrder, checkDelivery, addressAutocomplete, getPlaceCoordinates } from '../services/stores/wolt.adapter.js';
import { getLavkaDeliveryInfo, placeLavkaOrder, addToLavkaCart, clearLavkaCart } from '../services/stores/lavka.adapter.js';
// import { placeMagnumOrder } from '../services/stores/magnum.adapter.js';

// Store name mapping
const STORE_NAMES = {
  arbuz: 'Arbuz.kz',
  magnum: 'Magnum',
  wolt: 'Wolt Market',
  lavka: 'Яндекс Лавка',
  airba: 'Airba Fresh',
};

/**
 * Address autocomplete handler
 */
export async function addressAutocompleteHandler(req, res) {
  try {
    const { input, city = 'almaty' } = req.query;
    
    if (!input || input.length < 3) {
      return res.json({ predictions: [] });
    }
    
    const result = await addressAutocomplete(input, city);
    res.json(result);
    
  } catch (err) {
    console.error('[Orders] Autocomplete error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Check delivery availability and fees for address
 */
export async function checkDeliveryHandler(req, res) {
  try {
    const { address, placeId, city = 'almaty', stores = ['wolt', 'airba', 'lavka'] } = req.body;
    
    if (!address && !placeId) {
      return res.status(400).json({ error: 'Адрес обязателен' });
    }
    
    console.log('[Orders] Checking delivery for:', address || placeId);
    
    // If placeId provided, get exact coordinates
    let coordinates = null;
    if (placeId) {
      coordinates = await getPlaceCoordinates(placeId);
    }
    
    // Filter out lavka from wolt stores (it uses separate adapter)
    const woltStores = stores.filter(s => s !== 'lavka');
    const result = await checkDelivery({ address, city, stores: woltStores, coordinates });
    
    // Add Lavka if requested
    if (stores.includes('lavka') && result.coordinates) {
      try {
        result.stores.lavka = await getLavkaDeliveryInfo(result.coordinates);
      } catch (err) {
        console.error('[Orders] Lavka check failed:', err.message);
        result.stores.lavka = {
          available: false,
          error: err.message,
        };
      }
    }
    
    res.json(result);
    
  } catch (err) {
    console.error('[Orders] Delivery check error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Place Lavka order with items
 * 1. Clear cart
 * 2. Add items to cart
 * 3. Place order
 */
async function placeLavkaOrderWithItems(items, orderDetails) {
  console.log('[Orders] Placing Lavka order for', items.length, 'items');
  
  try {
    const coordinates = orderDetails.coordinates || { lat: 43.238949, lon: 76.945465 };
    
    // 1. Clear cart first
    try {
      await clearLavkaCart(coordinates);
    } catch (e) {
      console.log('[Orders] Clear cart error (continuing):', e.message);
    }
    
    // 2. Add each item to cart
    for (const item of items) {
      // Extract Lavka product ID from our productId
      // Format: lavka_xxx or just the raw ID
      let productId = item.productId;
      if (productId.startsWith('lavka_')) {
        productId = productId.replace('lavka_', '');
      }
      
      console.log('[Orders] Adding to Lavka cart:', item.title || item.name, 'x', item.quantity);
      await addToLavkaCart(productId, item.quantity || 1, coordinates);
    }
    
    // 3. Place order
    const result = await placeLavkaOrder({
      coordinates,
      address: orderDetails.address,
      apartment: orderDetails.apartment,
      entrance: orderDetails.entrance,
      floor: orderDetails.floor,
      comment: orderDetails.comment,
      phone: orderDetails.contactPhone,
      paymentMethod: 'card_on_delivery',
    });
    
    return {
      success: true,
      orderId: result.orderId,
      trackingUrl: result.trackingUrl,
    };
  } catch (err) {
    console.error('[Orders] Lavka order failed:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Place orders to real stores
 */
async function placeStoreOrders(storeGroups, orderDetails) {
  const results = {};
  
  for (const [store, items] of Object.entries(storeGroups)) {
    console.log(`[Orders] Placing order at ${store} for ${items.length} items`);
    
    try {
      let result;
      
      switch (store.toLowerCase()) {
        case 'arbuz':
          result = await placeArbuzOrder({
            items,
            ...orderDetails
          });
          break;
          
        case 'magnum':
          // result = await placeMagnumOrder({ items, ...orderDetails });
          result = { success: false, error: 'Magnum adapter not yet implemented' };
          break;
          
        case 'wolt':
          result = await placeWoltOrder({
            items,
            ...orderDetails
          });
          break;
          
        case 'lavka':
        case 'yandex':
        case 'yandex lavka':
          result = await placeLavkaOrderWithItems(items, orderDetails);
          break;
          
        case 'airba':
          // Airba is on Wolt platform
          result = await placeWoltOrder({
            items,
            ...orderDetails
          });
          break;
          
        default:
          result = { success: false, error: `Unknown store: ${store}` };
      }
      
      results[store] = result;
      
    } catch (err) {
      console.error(`[Orders] Error placing ${store} order:`, err.message);
      results[store] = { success: false, error: err.message };
    }
  }
  
  return results;
}

/**
 * Create order handler
 */
export async function createOrderHandler(req, res) {
  try {
    const userId = req.user.id;
    const {
      items,
      address,
      apartment,
      entrance,
      floor,
      comment,
      contactName,
      contactPhone,
      paymentMethod,
      city = 'almaty',
      coordinates,
      placeRealOrders = true // Enable real ordering by default
    } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    // Group items by store
    const storeGroups = {};
    for (const item of items) {
      const store = item.store || 'unknown';
      if (!storeGroups[store]) storeGroups[store] = [];
      storeGroups[store].push(item);
    }
    
    // Calculate totals per store and overall
    const subOrders = [];
    let total = 0;
    
    for (const [store, storeItems] of Object.entries(storeGroups)) {
      const subtotal = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      total += subtotal;
      
      subOrders.push({
        store: store.toLowerCase(),
        storeName: STORE_NAMES[store.toLowerCase()] || store,
        items: storeItems.map(item => ({
          productId: item.productId,
          title: item.name,
          cost: item.price,
          quantity: item.quantity,
          imageUrl: item.image,
          measure: item.measure || '',
          url: item.url || '',
        })),
        subtotal,
        status: 'pending',
        externalOrderId: '',
        storeError: '',
      });
    }
    
    // If placeRealOrders is true, actually place orders at stores
    if (placeRealOrders) {
      console.log('[Orders] Placing REAL orders at stores...');
      const storeOrderResults = await placeStoreOrders(storeGroups, {
        address,
        apartment,
        entrance,
        floor,
        comment,
        contactPhone,
        city,
        coordinates
      });
      
      // Update subOrders with results
      for (const subOrder of subOrders) {
        const result = storeOrderResults[subOrder.store];
        if (result) {
          // Check if this is a manual checkout (deep link) order
          if (result.manualCheckout) {
            subOrder.status = 'pending_manual';
            subOrder.externalOrderId = result.orderId || '';
            subOrder.venueUrl = result.venueUrl || '';
            subOrder.deepLinks = result.deepLinks || [];
            subOrder.message = result.message || '';
          } else {
            subOrder.status = result.success ? 'processing' : 'failed';
            subOrder.externalOrderId = result.orderId || '';
            subOrder.storeError = result.error || '';
          }
        }
      }
    }
    
    // Create order in our database
    const order = new Order({
      userId,
      address,
      apartment,
      entrance,
      floor,
      comment,
      contactName,
      contactPhone,
      paymentMethod,
      subOrders,
      total,
      savings: 0, // TODO: calculate from original prices
      city,
      status: placeRealOrders ? 'processing' : 'pending',
    });
    
    await order.save();
    
    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        status: order.status,
        total: order.total,
        subOrders: order.subOrders.map(so => ({
          store: so.storeName,
          status: so.status,
          orderId: so.externalOrderId,
          error: so.storeError,
          // Include deep links for manual checkout
          venueUrl: so.venueUrl || null,
          deepLinks: so.deepLinks || [],
          message: so.message || null,
          requiresManualCheckout: so.status === 'pending_manual',
        })),
      },
    });
    
  } catch (err) {
    console.error('[Orders] Create order error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get user's orders
 */
export async function getOrdersHandler(req, res) {
  try {
    const userId = req.user.id;
    
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ orders });
    
  } catch (err) {
    console.error('[Orders] Get orders error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get single order by ID
 */
export async function getOrderHandler(req, res) {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;
    
    const order = await Order.findOne({ _id: orderId, userId });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ order });
    
  } catch (err) {
    console.error('[Orders] Get order error:', err);
    res.status(500).json({ error: err.message });
  }
}
