/**
 * Yandex Lavka Adapter
 * 
 * Яндекс Лавка - экспресс-доставка продуктов за 5-15 минут
 * 
 * Использует Puppeteer для всех API запросов (обход CSRF)
 */

import * as lavkaPuppeteer from './lavka.puppeteer.js';

// Координаты по умолчанию (Алматы центр)
const DEFAULT_COORDS = { lat: 43.238949, lon: 76.945465 };

/**
 * Проверка что координаты в зоне доставки Алматы
 */
function isInAlmatyArea(lat, lon) {
  return lat >= 43.1 && lat <= 43.45 && lon >= 76.7 && lon <= 77.2;
}

/**
 * Получить информацию о доставке
 */
export async function getLavkaDeliveryInfo(coordinates) {
  const { lat, lon } = coordinates || DEFAULT_COORDS;
  
  console.log('[Lavka] Getting delivery info for', lat, lon);
  
  if (!isInAlmatyArea(lat, lon)) {
    return {
      available: false,
      error: 'Адрес вне зоны доставки Лавки (Алматы)',
      isInDeliveryArea: false,
    };
  }
  
  return lavkaPuppeteer.getDeliveryInfo(lat, lon);
}

/**
 * Поиск товаров
 */
export async function searchLavkaProducts(query, coordinates) {
  const { lat, lon } = coordinates || DEFAULT_COORDS;
  
  console.log('[Lavka] Searching products:', query);
  
  return lavkaPuppeteer.searchProducts(query, lat, lon);
}

/**
 * Получить каталог
 */
export async function getLavkaCatalog(coordinates) {
  const { lat, lon } = coordinates || DEFAULT_COORDS;
  
  return lavkaPuppeteer.getCatalog(lat, lon);
}

/**
 * Получить товары категории
 */
export async function getLavkaCategoryProducts(categoryId, coordinates) {
  const { lat, lon } = coordinates || DEFAULT_COORDS;
  
  return lavkaPuppeteer.getCategoryProducts(categoryId, lat, lon);
}

/**
 * Добавить товар в корзину
 */
export async function addToLavkaCart(productId, quantity, coordinates) {
  const { lat, lon } = coordinates || DEFAULT_COORDS;
  
  return lavkaPuppeteer.addToCart(productId, quantity, lat, lon);
}

/**
 * Получить корзину
 */
export async function getLavkaCart(coordinates) {
  const { lat, lon } = coordinates || DEFAULT_COORDS;
  
  return lavkaPuppeteer.getCart(lat, lon);
}

/**
 * Очистить корзину
 */
export async function clearLavkaCart(coordinates) {
  const { lat, lon } = coordinates || DEFAULT_COORDS;
  
  return lavkaPuppeteer.clearCart(lat, lon);
}

/**
 * Оформить заказ
 */
export async function placeLavkaOrder({ coordinates, address, apartment, entrance, floor, comment, phone, paymentMethod }) {
  const { lat, lon } = coordinates || DEFAULT_COORDS;
  
  console.log('[Lavka] Placing order to:', address);
  
  return lavkaPuppeteer.placeOrder({
    lat,
    lon,
    address,
    apartment,
    entrance,
    floor,
    comment,
    phone,
    paymentMethod,
  });
}

/**
 * Получить статус заказа
 */
export async function getLavkaOrderStatus(orderId) {
  return lavkaPuppeteer.getOrderStatus(orderId);
}

/**
 * Получить историю заказов
 */
export async function getLavkaOrderHistory() {
  return lavkaPuppeteer.getOrderHistory();
}

/**
 * Проверить авторизацию
 */
export async function checkLavkaAuth() {
  return lavkaPuppeteer.checkAuth();
}

/**
 * Закрыть браузер (для graceful shutdown)
 */
export async function closeLavkaBrowser() {
  return lavkaPuppeteer.closeBrowser();
}

// Legacy exports для совместимости
export const setLavkaTokens = async () => {
  console.log('[Lavka] setLavkaTokens deprecated - using Puppeteer now');
  return { success: true };
};

export default {
  getLavkaDeliveryInfo,
  searchLavkaProducts,
  getLavkaCatalog,
  getLavkaCategoryProducts,
  addToLavkaCart,
  getLavkaCart,
  clearLavkaCart,
  placeLavkaOrder,
  getLavkaOrderStatus,
  getLavkaOrderHistory,
  checkLavkaAuth,
  closeLavkaBrowser,
  setLavkaTokens,
};
