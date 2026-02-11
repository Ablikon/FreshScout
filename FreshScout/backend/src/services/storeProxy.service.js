/**
 * Store Proxy Ordering Service
 * 
 * Coordinates placing real orders on each store platform
 * when a FreshScout order is created.
 * 
 * Architecture:
 * 1. FreshScout order comes in with items grouped by store (subOrders)
 * 2. For each subOrder, we call the store-specific adapter
 * 3. Each adapter: logs in → adds items to cart → sets address → places order
 * 4. We update subOrder status + externalOrderId
 * 
 * Store adapters:
 * - Wolt (covers Wolt Market + Airba Fresh) — wolt.com API
 * - Arbuz — arbuz.kz API
 * - Magnum — kaspi.kz / magnum API
 * - Yandex Lavka — lavka.yandex.kz API
 */

import Order from '../models/Order.js';
import { placeWoltOrder } from './stores/wolt.adapter.js';
import { placeArbuzOrder } from './stores/arbuz.adapter.js';
import { placeLavkaOrder, addToLavkaCart, clearLavkaCart } from './stores/lavka.adapter.js';
// import { placeMagnumOrder } from './stores/magnum.adapter.js';

/**
 * Lavka order helper - clears cart, adds items, places order
 */
async function placeLavkaOrderAdapter(options) {
  const { items, address, apartment, entrance, floor, comment, contactPhone, city } = options;
  const coordinates = { lat: 43.238949, lon: 76.945465 }; // Default Almaty coords
  
  console.log('[StoreProxy] Placing Lavka order for', items.length, 'items');
  
  // 1. Clear cart
  try {
    await clearLavkaCart(coordinates);
  } catch (e) {
    console.log('[StoreProxy] Clear cart error (continuing):', e.message);
  }
  
  // 2. Add items to cart
  for (const item of items) {
    let productId = item.productId;
    if (productId && productId.startsWith('lavka_')) {
      productId = productId.replace('lavka_', '');
    }
    console.log('[StoreProxy] Adding to Lavka cart:', item.title, 'x', item.quantity);
    await addToLavkaCart(productId, item.quantity || 1, coordinates);
  }
  
  // 3. Place order
  const result = await placeLavkaOrder({
    coordinates,
    address,
    apartment,
    entrance,
    floor,
    comment,
    phone: contactPhone,
    paymentMethod: 'card_on_delivery',
  });
  
  return { orderId: result.orderId, trackingUrl: result.trackingUrl };
}

const STORE_ADAPTERS = {
  wolt: placeWoltOrder,
  airba: placeWoltOrder,  // Airba Fresh = Wolt venue
  arbuz: placeArbuzOrder,
  yandex: placeLavkaOrderAdapter,
  lavka: placeLavkaOrderAdapter,
  // magnum: placeMagnumOrder,
};

/**
 * Place orders on each store for a FreshScout order
 * Called after order is saved to DB
 */
export async function placeStoreOrders(order) {
  console.log(`📦 Placing store orders for FreshScout order ${order._id}`);

  // Update main order status
  order.status = 'processing';
  await order.save();

  for (const sub of order.subOrders) {
    const adapter = STORE_ADAPTERS[sub.store];
    if (!adapter) {
      console.warn(`⚠️ No adapter for store: ${sub.store}`);
      sub.status = 'failed';
      sub.storeError = `Адаптер для ${sub.storeName} не настроен`;
      continue;
    }

    try {
      console.log(`  🏪 Placing order on ${sub.storeName}...`);
      sub.status = 'processing';
      await order.save();

      const result = await adapter({
        items: sub.items,
        address: order.address,
        apartment: order.apartment,
        entrance: order.entrance,
        floor: order.floor,
        comment: order.comment,
        contactName: order.contactName,
        contactPhone: order.contactPhone,
        paymentMethod: order.paymentMethod,
        city: order.city,
      });

      sub.externalOrderId = result.orderId || '';
      sub.status = 'picking';
      console.log(`  ✅ ${sub.storeName} order placed: ${result.orderId}`);
    } catch (err) {
      console.error(`  ❌ ${sub.storeName} order failed:`, err.message);
      sub.status = 'failed';
      sub.storeError = err.message;
    }
  }

  // Determine overall status
  const statuses = order.subOrders.map(s => s.status);
  if (statuses.every(s => s === 'failed')) {
    order.status = 'cancelled';
  } else if (statuses.some(s => s === 'failed')) {
    order.status = 'partially_done';
  } else {
    order.status = 'processing';
  }

  await order.save();
  console.log(`📦 Order ${order._id} status: ${order.status}`);
  return order;
}
