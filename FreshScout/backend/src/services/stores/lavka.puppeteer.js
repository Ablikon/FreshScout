/**
 * Lavka Puppeteer Integration
 * 
 * Все запросы к Lavka API выполняются через браузер
 * для обхода CSRF защиты Яндекса
 * 
 * Медленнее (~3-5 сек), но работает стабильно
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIES_PATH = path.join(__dirname, '../../data/lavka_cookies.json');
const LAVKA_URL = 'https://lavka.yandex.kz';
const API_URL = 'https://lavka.yandex.kz/api';

// Singleton браузер для переиспользования
let browserInstance = null;
let pageInstance = null;
let lastActivity = Date.now();
let isInitialized = false;
let csrfToken = null;

// Закрываем браузер после 5 минут неактивности
const IDLE_TIMEOUT = 5 * 60 * 1000;

/**
 * Получить или создать браузер
 */
async function getBrowser() {
  // Закрываем если слишком долго простаивал
  if (browserInstance && Date.now() - lastActivity > IDLE_TIMEOUT) {
    console.log('[Lavka Puppeteer] Closing idle browser...');
    await closeBrowser();
  }
  
  if (!browserInstance) {
    console.log('[Lavka Puppeteer] Launching browser...');
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });
    
    pageInstance = await browserInstance.newPage();
    await pageInstance.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await pageInstance.setViewport({ width: 1280, height: 800 });
    
    // Загружаем cookies
    await loadCookies();
    isInitialized = false;
  }
  
  lastActivity = Date.now();
  return { browser: browserInstance, page: pageInstance };
}

/**
 * Закрыть браузер
 */
async function closeBrowser() {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch {}
    browserInstance = null;
    pageInstance = null;
    isInitialized = false;
  }
}

/**
 * Загрузить cookies
 */
async function loadCookies() {
  try {
    const data = await fs.readFile(COOKIES_PATH, 'utf-8');
    const cookies = JSON.parse(data);
    if (cookies.length > 0 && pageInstance) {
      // Фильтруем только валидные cookies
      const validCookies = cookies.filter(c => c.name && c.value && c.domain);
      await pageInstance.setCookie(...validCookies);
      console.log('[Lavka Puppeteer] Loaded', validCookies.length, 'cookies');
      return true;
    }
  } catch (err) {
    console.log('[Lavka Puppeteer] No cookies:', err.message);
  }
  return false;
}

/**
 * Сохранить cookies
 */
async function saveCookies() {
  if (!pageInstance) return;
  try {
    const cookies = await pageInstance.cookies();
    await fs.mkdir(path.dirname(COOKIES_PATH), { recursive: true });
    await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    console.log('[Lavka Puppeteer] Saved', cookies.length, 'cookies');
  } catch (err) {
    console.error('[Lavka Puppeteer] Save cookies error:', err.message);
  }
}

/**
 * Инициализировать сессию (зайти на сайт и получить CSRF)
 */
async function initSession() {
  if (isInitialized && csrfToken) return true;
  
  const { page } = await getBrowser();
  
  console.log('[Lavka Puppeteer] Initializing session...');
  
  try {
    // Сначала пробуем быстро загрузить страницу
    await page.goto(LAVKA_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    // Ждём немного для JS
    await new Promise(r => setTimeout(r, 2000));
    
    // Пробуем извлечь CSRF токен из страницы
    csrfToken = await page.evaluate(() => {
      // Ищем в window.__INITIAL_STATE__
      if (window.__INITIAL_STATE__?.csrfToken) {
        return window.__INITIAL_STATE__.csrfToken;
      }
      if (window.__INITIAL_STATE__?.env?.csrfToken) {
        return window.__INITIAL_STATE__.env.csrfToken;
      }
      // Ищем в meta теге
      const meta = document.querySelector('meta[name="csrf-token"]');
      if (meta) return meta.content;
      // Ищем в скриптах
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const match = script.textContent?.match(/"csrf[Tt]oken"\s*:\s*"([^"]+)"/);
        if (match) return match[1];
      }
      // Ищем в HTML
      const html = document.documentElement.innerHTML;
      const htmlMatch = html.match(/csrf[Tt]oken['":\s]+['"]([a-f0-9]+:[0-9]+)['"]/);
      if (htmlMatch) return htmlMatch[1];
      return null;
    });
    
    console.log('[Lavka Puppeteer] CSRF from page:', csrfToken ? csrfToken.substring(0, 30) + '...' : 'NOT FOUND');
    
    await saveCookies();
    isInitialized = true;
    console.log('[Lavka Puppeteer] Session initialized');
    return true;
  } catch (err) {
    console.error('[Lavka Puppeteer] Init failed:', err.message);
    // Всё равно помечаем как инициализированное, попробуем получить CSRF из API ответа
    isInitialized = true;
    return true;
  }
}

/**
 * Выполнить API запрос через браузерный контекст
 */
async function apiRequest(endpoint, options = {}, retryCount = 0) {
  await initSession();
  
  const { page } = await getBrowser();
  
  console.log('[Lavka Puppeteer] API:', options.method || 'POST', endpoint, 'csrf:', csrfToken ? 'yes' : 'no');
  
  // Передаём CSRF токен в evaluate
  const result = await page.evaluate(async (apiUrl, endpoint, options, csrf) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://lavka.yandex.kz',
        'Referer': 'https://lavka.yandex.kz/',
        ...options.headers,
      };
      
      // Добавляем CSRF токен
      if (csrf) {
        headers['X-Csrf-Token'] = csrf;
      }
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: options.method || 'POST',
        headers,
        body: options.body,
        credentials: 'include',
      });
      
      const text = await response.text();
      
      // Если 401 с CSRF, извлекаем новый токен из ответа
      if (response.status === 401) {
        try {
          const errorData = JSON.parse(text);
          // Яндекс возвращает новый токен в data.data.token
          const newToken = errorData?.data?.data?.token;
          if (newToken) {
            return {
              ok: false,
              status: 401,
              newCsrf: newToken,
              data: text,
            };
          }
        } catch {}
      }
      
      return {
        ok: response.ok,
        status: response.status,
        data: text,
      };
    } catch (err) {
      return { ok: false, status: 0, error: err.message };
    }
  }, API_URL, endpoint, options, csrfToken);
  
  // Если получили новый CSRF - обновляем и повторяем (максимум 2 раза)
  if (result.newCsrf && retryCount < 2) {
    console.log('[Lavka Puppeteer] Got new CSRF:', result.newCsrf.substring(0, 30) + '...');
    csrfToken = result.newCsrf;
    return apiRequest(endpoint, options, retryCount + 1);
  }
  
  if (!result.ok) {
    console.error('[Lavka Puppeteer] API error:', result.status, result.data?.substring(0, 200));
    throw new Error(`Lavka API ${result.status}: ${result.error || result.data?.substring(0, 100)}`);
  }
  
  try {
    return JSON.parse(result.data);
  } catch {
    return { raw: result.data };
  }
}

/**
 * Получить информацию о доставке
 */
export async function getDeliveryInfo(lat, lon) {
  console.log('[Lavka Puppeteer] Getting delivery info for', lat, lon);
  
  try {
    await initSession();
    const { page } = await getBrowser();
    
    // Идём на страницу с координатами - это самый надёжный способ
    // Лавка сама определит зону доставки и покажет информацию
    const url = `${LAVKA_URL}/?lat=${lat}&lon=${lon}`;
    console.log('[Lavka Puppeteer] Navigating to:', url);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000)); // Ждём загрузки данных
    
    // Извлекаем информацию о доставке со страницы
    const deliveryInfo = await page.evaluate(() => {
      // Ищем время доставки в разных местах
      const etaSelectors = [
        '[class*="DeliveryEta"]',
        '[class*="delivery-time"]',
        '[class*="eta"]',
        '[class*="Eta"]',
        '[data-testid*="delivery"]',
      ];
      
      let eta = null;
      for (const sel of etaSelectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent) {
          const text = el.textContent;
          if (text.includes('мин') || text.includes('min')) {
            eta = text.trim();
            break;
          }
        }
      }
      
      // Проверяем доступность
      const unavailableEl = document.querySelector('[class*="unavailable"], [class*="closed"], [class*="Closed"]');
      const isAvailable = !unavailableEl;
      
      // Ищем минимальную сумму заказа
      const minOrderEl = document.querySelector('[class*="minOrder"], [class*="min-order"]');
      const minOrderText = minOrderEl?.textContent || '';
      
      return {
        eta: eta || '5-15 мин',
        available: isAvailable,
        minOrderText,
        pageTitle: document.title,
      };
    });
    
    console.log('[Lavka Puppeteer] Page info:', deliveryInfo);
    
    await saveCookies();
    
    return {
      available: deliveryInfo.available,
      deliveryFee: 390,
      deliveryTime: deliveryInfo.eta,
      minOrderAmount: 1000,
      isInDeliveryArea: true,
      venueName: 'Яндекс Лавка',
      isOpen: deliveryInfo.available,
      isOnline: true,
      hasStandardDelivery: true,
      hasScheduledDelivery: false,
      deliveryTiers: [
        { maxAmount: 2000, fee: 390 },
        { maxAmount: 3500, fee: 200 },
        { maxAmount: Infinity, fee: 5 },
      ],
      statusMessage: 'Экспресс-доставка ' + deliveryInfo.eta,
    };
  } catch (err) {
    console.error('[Lavka Puppeteer] Delivery info error:', err.message);
    
    // Fallback
    return {
      available: true,
      deliveryFee: 390,
      deliveryTime: '5-15 мин',
      minOrderAmount: 1000,
      isInDeliveryArea: true,
      venueName: 'Яндекс Лавка',
      isOpen: true,
      isOnline: true,
      hasStandardDelivery: true,
      hasScheduledDelivery: false,
      deliveryTiers: [
        { maxAmount: 2000, fee: 390 },
        { maxAmount: 3500, fee: 200 },
        { maxAmount: Infinity, fee: 5 },
      ],
      estimated: true,
      statusMessage: 'Экспресс-доставка 5-15 мин',
    };
  }
}

/**
 * Поиск товаров
 */
export async function searchProducts(query, lat, lon) {
  console.log('[Lavka Puppeteer] Searching:', query);
  
  try {
    await initSession();
    const { page } = await getBrowser();
    
    // Идём на страницу поиска
    const searchUrl = `${LAVKA_URL}/search?text=${encodeURIComponent(query)}&lat=${lat}&lon=${lon}`;
    console.log('[Lavka Puppeteer] Search URL:', searchUrl);
    
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000)); // Ждём загрузки результатов
    
    // Извлекаем товары со страницы
    const products = await page.evaluate(() => {
      const items = [];
      
      // Ищем карточки товаров
      const productCards = document.querySelectorAll('[class*="ProductCard"], [class*="product-card"], [data-testid*="product"]');
      
      productCards.forEach((card, i) => {
        if (i >= 30) return; // Лимит 30 товаров
        
        const nameEl = card.querySelector('[class*="title"], [class*="name"], [class*="Title"], h3, h4');
        const priceEl = card.querySelector('[class*="price"], [class*="Price"]');
        const imgEl = card.querySelector('img');
        const weightEl = card.querySelector('[class*="weight"], [class*="Weight"], [class*="subtitle"]');
        
        const name = nameEl?.textContent?.trim();
        const priceText = priceEl?.textContent?.trim() || '';
        // Берём только первое число (цена без скидки может дублироваться)
        const priceMatch = priceText.match(/(\d[\d\s]*)/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/\s/g, '')) : 0;
        const image = imgEl?.src || '';
        const weight = weightEl?.textContent?.trim() || '';
        
        if (name && price > 0) {
          items.push({
            id: `lavka_${i}_${Date.now()}`,
            name,
            price,
            currency: 'KZT',
            image,
            weight,
            available: true,
          });
        }
      });
      
      return items;
    });
    
    console.log('[Lavka Puppeteer] Found', products.length, 'products');
    
    await saveCookies();
    return products;
  } catch (err) {
    console.error('[Lavka Puppeteer] Search error:', err.message);
    return [];
  }
}

/**
 * Получить каталог/категории
 */
export async function getCatalog(lat, lon) {
  console.log('[Lavka Puppeteer] Getting catalog...');
  
  try {
    const response = await apiRequest('/v1/catalog', {
      method: 'POST',
      body: JSON.stringify({
        position: {
          location: [lon, lat],
        },
      }),
    });
    
    return response.categories || response.items || [];
  } catch (err) {
    console.error('[Lavka Puppeteer] Catalog error:', err.message);
    return [];
  }
}

/**
 * Получить товары категории
 */
export async function getCategoryProducts(categoryId, lat, lon) {
  console.log('[Lavka Puppeteer] Getting category:', categoryId);
  
  try {
    const response = await apiRequest('/v1/category', {
      method: 'POST',
      body: JSON.stringify({
        category_id: categoryId,
        position: {
          location: [lon, lat],
        },
        limit: 50,
      }),
    });
    
    const products = response.products || response.items || [];
    
    return products.map(p => ({
      id: p.product_id || p.id,
      name: p.title || p.name,
      price: p.price?.value || p.price || 0,
      currency: 'KZT',
      image: p.image?.url || p.images?.[0]?.url || '',
      weight: p.weight_str || p.weight || '',
      available: p.is_available !== false,
    }));
  } catch (err) {
    console.error('[Lavka Puppeteer] Category error:', err.message);
    return [];
  }
}

/**
 * Добавить в корзину
 */
export async function addToCart(productId, quantity, lat, lon) {
  console.log('[Lavka Puppeteer] Add to cart:', productId, 'x', quantity);
  
  try {
    const response = await apiRequest('/v1/cart/update', {
      method: 'POST',
      body: JSON.stringify({
        position: {
          location: [lon, lat],
        },
        items: [{
          product_id: productId,
          quantity,
        }],
      }),
    });
    
    return {
      success: true,
      cart: response,
    };
  } catch (err) {
    console.error('[Lavka Puppeteer] Add to cart error:', err.message);
    throw err;
  }
}

/**
 * Получить корзину
 */
export async function getCart(lat, lon) {
  console.log('[Lavka Puppeteer] Getting cart...');
  
  try {
    const response = await apiRequest('/v1/cart', {
      method: 'POST',
      body: JSON.stringify({
        position: {
          location: [lon, lat],
        },
      }),
    });
    
    return response;
  } catch (err) {
    console.error('[Lavka Puppeteer] Get cart error:', err.message);
    return { items: [], total: 0 };
  }
}

/**
 * Очистить корзину
 */
export async function clearCart(lat, lon) {
  console.log('[Lavka Puppeteer] Clearing cart...');
  
  try {
    const response = await apiRequest('/v1/cart/clear', {
      method: 'POST',
      body: JSON.stringify({
        position: {
          location: [lon, lat],
        },
      }),
    });
    
    return { success: true };
  } catch (err) {
    console.error('[Lavka Puppeteer] Clear cart error:', err.message);
    throw err;
  }
}

/**
 * Оформить заказ
 */
export async function placeOrder({ lat, lon, address, apartment, entrance, floor, comment, phone, paymentMethod = 'card_on_delivery' }) {
  console.log('[Lavka Puppeteer] Placing order to:', address);
  
  try {
    // 1. Установить адрес доставки
    await apiRequest('/v1/cart/address', {
      method: 'POST',
      body: JSON.stringify({
        position: {
          location: [lon, lat],
        },
        address: {
          full_address: address,
          flat: apartment || '',
          entrance: entrance || '',
          floor: floor || '',
          comment: comment || '',
        },
        phone: phone,
      }),
    });
    
    console.log('[Lavka Puppeteer] Address set');
    
    // 2. Создать заказ
    const orderResponse = await apiRequest('/v1/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        position: {
          location: [lon, lat],
        },
        payment_method: paymentMethod,
      }),
    });
    
    console.log('[Lavka Puppeteer] Order created:', orderResponse.order_id);
    
    return {
      success: true,
      orderId: orderResponse.order_id,
      trackingUrl: orderResponse.tracking_url,
      status: orderResponse.status,
      estimatedDelivery: orderResponse.eta,
    };
  } catch (err) {
    console.error('[Lavka Puppeteer] Place order error:', err.message);
    throw err;
  }
}

/**
 * Получить статус заказа
 */
export async function getOrderStatus(orderId) {
  console.log('[Lavka Puppeteer] Getting order status:', orderId);
  
  try {
    const response = await apiRequest(`/v1/orders/${orderId}`, {
      method: 'GET',
    });
    
    return {
      orderId: response.order_id,
      status: response.status,
      statusText: response.status_text,
      eta: response.eta,
      trackingUrl: response.tracking_url,
      items: response.items,
      total: response.total,
    };
  } catch (err) {
    console.error('[Lavka Puppeteer] Get order status error:', err.message);
    throw err;
  }
}

/**
 * Получить историю заказов
 */
export async function getOrderHistory() {
  console.log('[Lavka Puppeteer] Getting order history...');
  
  try {
    const response = await apiRequest('/v1/orders', {
      method: 'GET',
    });
    
    return response.orders || [];
  } catch (err) {
    console.error('[Lavka Puppeteer] Get orders error:', err.message);
    return [];
  }
}

/**
 * Проверить авторизацию
 */
export async function checkAuth() {
  try {
    await initSession();
    const { page } = await getBrowser();
    
    // Попробуем простой API запрос
    const result = await page.evaluate(async (apiUrl) => {
      try {
        const response = await fetch(`${apiUrl}/v1/user`, {
          credentials: 'include',
        });
        return { ok: response.ok, status: response.status };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }, API_URL);
    
    return result.ok || result.status !== 401;
  } catch {
    return false;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});

export default {
  getDeliveryInfo,
  searchProducts,
  getCatalog,
  getCategoryProducts,
  addToCart,
  getCart,
  clearCart,
  placeOrder,
  getOrderStatus,
  getOrderHistory,
  checkAuth,
  closeBrowser,
};
