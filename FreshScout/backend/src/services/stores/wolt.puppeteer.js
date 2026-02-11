/**
 * Wolt Puppeteer Integration
 * 
 * Автоматизирует создание заказов через браузер
 * для обхода ограничений API
 * 
 * Процесс:
 * 1. Открыть корзину на сайте
 * 2. Добавить товары
 * 3. Установить адрес доставки  
 * 4. Оформить заказ
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIES_PATH = process.env.NODE_ENV === 'production'
  ? '/app/data/wolt_cookies.json'
  : path.join(__dirname, '../../data/wolt_cookies.json');

const WOLT_URL = 'https://wolt.com';
const ALMATY_COORDS = { lat: 43.2322204, lon: 76.9230351 };

// Singleton браузер
let browserInstance = null;
let pageInstance = null;
let lastActivity = Date.now();
let isLoggedIn = false;

// Закрываем браузер после 10 минут неактивности
const IDLE_TIMEOUT = 10 * 60 * 1000;

/**
 * Получить или создать браузер
 */
async function getBrowser() {
  // Закрываем если простаивал
  if (browserInstance && Date.now() - lastActivity > IDLE_TIMEOUT) {
    console.log('[Wolt Puppeteer] Closing idle browser...');
    await closeBrowser();
  }
  
  if (!browserInstance) {
    console.log('[Wolt Puppeteer] Launching browser...');
    
    // Use system Chromium in Docker, or bundled in dev
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--single-process',
        '--no-zygote',
        '--window-size=1440,900',
      ],
    };
    
    // In Docker, use system Chromium
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    
    browserInstance = await puppeteer.launch(launchOptions);
    
    pageInstance = await browserInstance.newPage();
    await pageInstance.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await pageInstance.setViewport({ width: 1440, height: 900 });
    
    // Включаем перехват запросов для отладки
    pageInstance.on('response', response => {
      const url = response.url();
      if (url.includes('consumer-api.wolt.com') && !url.includes('/google/')) {
        console.log('[Wolt Puppeteer] API Response:', response.status(), url.split('?')[0]);
      }
    });
    
    // Загружаем cookies
    await loadCookies();
    isLoggedIn = false;
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
    isLoggedIn = false;
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
      // Filter and normalize cookies for Puppeteer
      const validCookies = cookies
        .filter(c => c.name && c.value && c.domain)
        .filter(c => c.domain.includes('wolt')) // Only wolt cookies
        .map(c => ({
          name: c.name,
          value: c.value,
          domain: '.wolt.com', // Always use .wolt.com for consistency
          path: c.path || '/',
          secure: true,
          httpOnly: c.httpOnly || false,
        }));
      
      await pageInstance.setCookie(...validCookies);
      console.log('[Wolt Puppeteer] Loaded', validCookies.length, 'cookies');
      return true;
    }
  } catch (err) {
    console.log('[Wolt Puppeteer] No cookies file:', err.message);
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
    console.log('[Wolt Puppeteer] Saved', cookies.length, 'cookies');
  } catch (err) {
    console.error('[Wolt Puppeteer] Save cookies error:', err.message);
  }
}

/**
 * Проверить авторизацию
 */
async function checkAuth() {
  const { page } = await getBrowser();
  
  console.log('[Wolt Puppeteer] Checking auth...');
  
  try {
    // Переходим на главную
    await page.goto(`${WOLT_URL}/ru/kaz/almaty/`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    
    // Ждём загрузки JS
    await new Promise(r => setTimeout(r, 3000));
    
    // Проверяем есть ли кнопка входа (значит НЕ залогинен)
    const isLoggedIn = await page.evaluate(() => {
      // Новые test-id Wolt
      const loginBtn = document.querySelector('[data-test-id="UserStatus.Login"]');
      const signupBtn = document.querySelector('[data-test-id="UserStatus.Signup"]');
      // Старые test-id
      const oldLoginBtn = document.querySelector('[data-test-id="header.login-button"]');
      
      const hasLoginButton = loginBtn || signupBtn || oldLoginBtn;
      
      // Ищем признаки авторизации - аватар пользователя или корзину с бейджем
      const userAvatar = document.querySelector('[data-test-id="user-status-component"], [data-test-id="UserAvatar"]');
      const cartBadge = document.querySelector('[data-test-id="header.cart-button"] [data-test-id*="badge"]');
      
      return !hasLoginButton || !!userAvatar;
    });
    
    console.log('[Wolt Puppeteer] Auth status:', isLoggedIn ? 'LOGGED IN' : 'NOT LOGGED IN');
    await saveCookies();
    
    return isLoggedIn;
  } catch (err) {
    console.error('[Wolt Puppeteer] Auth check error:', err.message);
    return false;
  }
}

/**
 * Инжектировать cookies из wolt_tokens.json
 * Wolt использует JWT токены в cookies для авторизации
 */
async function injectTokensAsCookies() {
  const { page } = await getBrowser();
  
  try {
    const tokenPath = process.env.NODE_ENV === 'production'
      ? '/app/data/wolt_tokens.json'
      : path.join(__dirname, '../../data/wolt_tokens.json');
    
    const data = await fs.readFile(tokenPath, 'utf-8');
    const tokens = JSON.parse(data);
    
    if (tokens.accessToken) {
      // Wolt хранит токен в __wtoken cookie
      await page.setCookie({
        name: '__wtoken',
        value: tokens.accessToken,
        domain: '.wolt.com',
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'Lax',
      });
      
      // Также refreshToken
      if (tokens.refreshToken) {
        await page.setCookie({
          name: '__wrtoken',
          value: tokens.refreshToken,
          domain: '.wolt.com',
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
        });
      }
      
      console.log('[Wolt Puppeteer] Injected tokens as cookies');
      return true;
    }
  } catch (err) {
    console.error('[Wolt Puppeteer] Token injection error:', err.message);
  }
  return false;
}

/**
 * Открыть страницу магазина
 */
async function openVenue(venueSlug) {
  const { page } = await getBrowser();
  
  console.log('[Wolt Puppeteer] Opening venue:', venueSlug);
  
  const url = `${WOLT_URL}/ru/kaz/almaty/venue/${venueSlug}`;
  
  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // Ждём загрузки контента
    await page.waitForSelector('[data-test-id="venue-content"]', { timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('[Wolt Puppeteer] Venue page loaded');
    return true;
  } catch (err) {
    console.error('[Wolt Puppeteer] Failed to open venue:', err.message);
    return false;
  }
}

/**
 * Найти товар на странице магазина
 */
async function findProduct(productName) {
  const { page } = await getBrowser();
  
  console.log('[Wolt Puppeteer] Searching for product:', productName);
  
  try {
    // Ищем через поиск
    const searchInput = await page.$('[data-test-id="venue-search-input"]');
    if (searchInput) {
      await searchInput.click();
      await searchInput.type(productName, { delay: 50 });
      await new Promise(r => setTimeout(r, 1500)); // Ждём результаты поиска
    }
    
    // Ищем карточку товара
    const productCard = await page.$(`[data-test-id="horizontal-item-card"]`);
    if (productCard) {
      return productCard;
    }
    
    // Альтернативный поиск
    const products = await page.$$('[data-test-id*="MenuItem"]');
    for (const product of products) {
      const text = await product.evaluate(el => el.textContent);
      if (text?.toLowerCase().includes(productName.toLowerCase())) {
        return product;
      }
    }
    
    return null;
  } catch (err) {
    console.error('[Wolt Puppeteer] Product search error:', err.message);
    return null;
  }
}

/**
 * Добавить товар в корзину
 */
async function addToCart(productElement, quantity = 1) {
  const { page } = await getBrowser();
  
  try {
    // Кликаем на товар чтобы открыть модалку
    await productElement.click();
    await new Promise(r => setTimeout(r, 1500));
    
    // Ищем кнопку "Добавить к заказу" - она содержит цену
    // Селекторы для разных вариантов кнопки
    const addButtonSelectors = [
      'button:has-text("Добавить к заказу")',
      'button:has-text("Добавить")',
      '[data-test-id="product-modal.submit"]',
      '[data-test-id*="add-to-order"]',
      '[data-test-id*="add-to-cart"]',
    ];
    
    let addButton = null;
    
    // Пробуем найти кнопку по тексту через evaluate
    addButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => 
        btn.textContent?.includes('Добавить к заказу') ||
        btn.textContent?.includes('Добавить в корзину') ||
        (btn.textContent?.includes('Добавить') && btn.textContent?.includes('KZT'))
      );
    });
    
    if (!addButton || !(await addButton.asElement())) {
      // Пробуем через data-test-id
      addButton = await page.$('[data-test-id="product-modal.submit"]');
    }
    
    if (!addButton || !(await addButton.asElement())) {
      console.log('[Wolt Puppeteer] Add button not found by selectors, searching...');
      // Последний шанс - ищем любую кнопку с ценой
      addButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => /\d+\s*(KZT|₸|тг)/i.test(btn.textContent || ''));
      });
    }
    
    if (!addButton || !(await addButton.asElement())) {
      throw new Error('Кнопка добавления не найдена');
    }
    
    // Если нужно больше 1, увеличиваем количество
    if (quantity > 1) {
      const plusBtn = await page.$('[data-test-id="product-modal.quantity-plus"], [data-test-id*="increase"], [aria-label*="увеличить"]');
      for (let i = 1; i < quantity; i++) {
        if (plusBtn) {
          await plusBtn.click();
          await new Promise(r => setTimeout(r, 300));
        }
      }
    }
    
    // Кликаем добавить
    await addButton.asElement().click();
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('[Wolt Puppeteer] ✅ Added to cart, quantity:', quantity);
    return true;
  } catch (err) {
    console.error('[Wolt Puppeteer] Add to cart error:', err.message);
    return false;
  }
}

/**
 * Перейти к оформлению
 */
async function goToCheckout() {
  const { page } = await getBrowser();
  
  try {
    console.log('[Wolt Puppeteer] Going to checkout...');
    
    // Кликаем на корзину (иконка в хедере)
    const cartButton = await page.$('[data-test-id="header.cart-button"], [data-test-id*="cart"]');
    if (cartButton) {
      await cartButton.click();
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // Ищем кнопку "Оформить заказ" или "К оплате"
    let checkoutBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => 
        btn.textContent?.includes('Оформить заказ') ||
        btn.textContent?.includes('К оплате') ||
        btn.textContent?.includes('Перейти к оплате') ||
        btn.textContent?.includes('Checkout')
      );
    });
    
    if (!checkoutBtn || !(await checkoutBtn.asElement())) {
      checkoutBtn = await page.$('[data-test-id="CartViewNextStepButton"], [data-test-id*="checkout"]');
    }
    
    if (checkoutBtn && (await checkoutBtn.asElement())) {
      await checkoutBtn.asElement().click();
      await new Promise(r => setTimeout(r, 2000));
      console.log('[Wolt Puppeteer] ✅ On checkout page');
      return true;
    }
    
    console.log('[Wolt Puppeteer] Checkout button not found');
    return false;
  } catch (err) {
    console.error('[Wolt Puppeteer] Go to checkout error:', err.message);
    return false;
  }
}

/**
 * Установить адрес доставки
 */
async function setDeliveryAddress(address) {
  const { page } = await getBrowser();
  
  console.log('[Wolt Puppeteer] Setting delivery address:', address);
  
  try {
    // Кликаем на поле адреса
    const addressField = await page.$('[data-test-id="delivery-address-selector"]');
    if (addressField) {
      await addressField.click();
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Вводим адрес
    const addressInput = await page.waitForSelector('[data-test-id="address-search-input"]', { timeout: 5000 });
    await addressInput.click({ clickCount: 3 }); // Выделяем всё
    await addressInput.type(address, { delay: 30 });
    await new Promise(r => setTimeout(r, 1500)); // Ждём автокомплит
    
    // Выбираем первый результат
    const firstResult = await page.$('[data-test-id="address-search-result"]');
    if (firstResult) {
      await firstResult.click();
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Подтверждаем
    const confirmBtn = await page.$('[data-test-id="address-confirmation-button"]');
    if (confirmBtn) {
      await confirmBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log('[Wolt Puppeteer] Address set');
    return true;
  } catch (err) {
    console.error('[Wolt Puppeteer] Set address error:', err.message);
    return false;
  }
}

/**
 * Подтвердить заказ (ОПЛАТА!)
 */
async function confirmOrder() {
  const { page } = await getBrowser();
  
  try {
    console.log('[Wolt Puppeteer] Looking for pay button...');
    
    // Ищем кнопку оплаты
    let payButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => 
        btn.textContent?.includes('Оплатить') ||
        btn.textContent?.includes('Заказать') ||
        btn.textContent?.includes('Подтвердить заказ') ||
        btn.textContent?.includes('Place order') ||
        (btn.textContent?.includes('KZT') && btn.closest('[data-test-id*="checkout"], [data-test-id*="submit"]'))
      );
    });
    
    if (!payButton || !(await payButton.asElement())) {
      payButton = await page.$('[data-test-id="CheckoutSubmitButton"], [data-test-id*="place-order"], [data-test-id*="submit"]');
    }
    
    if (!payButton || !(await payButton.asElement())) {
      // Скриншот для отладки
      await page.screenshot({ path: '/app/data/checkout_debug.png' });
      throw new Error('Кнопка оплаты не найдена');
    }
    
    // Читаем текст кнопки для лога
    const buttonText = await page.evaluate(btn => btn?.textContent, await payButton.asElement());
    console.log('[Wolt Puppeteer] 💳 Pay button:', buttonText);
    
    // НАЖИМАЕМ ОПЛАТУ!
    console.log('[Wolt Puppeteer] ⚡ CLICKING PAY BUTTON...');
    await payButton.asElement().click();
    
    // Ждём обработки заказа
    await new Promise(r => setTimeout(r, 5000));
    
    // Скриншот результата
    await page.screenshot({ path: '/app/data/order_result.png' });
    
    // Проверяем успех
    const result = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const isSuccess = 
        text.includes('Ваш заказ принят') ||
        text.includes('Заказ оформлен') ||
        text.includes('Спасибо за заказ') ||
        text.includes('Order confirmed') ||
        text.includes('заказ принят');
      
      // Ищем номер заказа
      const orderMatch = text.match(/(?:заказ|order)[^\d]*(\d{6,})/i) ||
                         text.match(/#(\d{6,})/) ||
                         text.match(/([A-Z0-9]{8,})/);
      
      return {
        success: isSuccess,
        orderId: orderMatch ? orderMatch[1] : null,
        pageText: text.substring(0, 500),
      };
    });
    
    if (result.success) {
      console.log('[Wolt Puppeteer] ✅ ORDER CONFIRMED!');
      if (result.orderId) console.log('[Wolt Puppeteer] 📋 Order ID:', result.orderId);
      return { success: true, orderId: result.orderId };
    }
    
    console.log('[Wolt Puppeteer] ⚠️  Order status unclear, page:', result.pageText.substring(0, 200));
    return { success: false, error: 'Подтверждение заказа не обнаружено', debug: result.pageText };
    
  } catch (err) {
    console.error('[Wolt Puppeteer] ❌ Confirm order error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Главная функция: разместить заказ на Wolt через браузер
 */
export async function placeWoltOrderViaBrowser({
  venueSlug,
  items,
  deliveryAddress,
  apartment,
  comment,
  phone,
}) {
  console.log('\n[Wolt Puppeteer] ═══════════════════════════════════════');
  console.log('[Wolt Puppeteer] 🛒 STARTING REAL ORDER');
  console.log('[Wolt Puppeteer] ═══════════════════════════════════════');
  console.log('[Wolt Puppeteer] Venue:', venueSlug);
  console.log('[Wolt Puppeteer] Items:', items.length, items.map(i => i.name || i.title).join(', '));
  console.log('[Wolt Puppeteer] Address:', deliveryAddress);
  
  const { page } = await getBrowser();
  
  try {
    // Инжектируем токены из файла
    await injectTokensAsCookies();
    
    // Открываем магазин (без проверки UI авторизации - API работает)
    console.log('\n[Wolt Puppeteer] 📍 Opening venue...');
    const venueOpened = await openVenue(venueSlug);
    if (!venueOpened) {
      return { success: false, error: 'Не удалось открыть магазин' };
    }
    await new Promise(r => setTimeout(r, 2000));
    
    // Добавляем товары в корзину
    console.log('\n[Wolt Puppeteer] 🛍️  Adding items to cart...');
    let addedCount = 0;
    
    for (const item of items) {
      const productName = item.name || item.title || item.productId;
      console.log(`[Wolt Puppeteer] Looking for: "${productName}"`);
      
      const productEl = await findProduct(productName);
      
      if (productEl) {
        const added = await addToCart(productEl, item.quantity || 1);
        if (added) {
          addedCount++;
          console.log(`[Wolt Puppeteer] ✅ Added: ${productName}`);
        }
      } else {
        console.warn(`[Wolt Puppeteer] ⚠️  Not found: ${productName}`);
      }
      
      // Небольшая пауза между товарами
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.log(`\n[Wolt Puppeteer] Added ${addedCount}/${items.length} items`);
    
    if (addedCount === 0) {
      await page.screenshot({ path: '/app/data/no_items_added.png' });
      return { success: false, error: 'Не удалось добавить ни одного товара в корзину' };
    }
    
    // Переходим к оформлению
    console.log('\n[Wolt Puppeteer] 🛒 Going to checkout...');
    const checkoutReady = await goToCheckout();
    if (!checkoutReady) {
      await page.screenshot({ path: '/app/data/checkout_failed.png' });
      return { success: false, error: 'Не удалось перейти к оформлению' };
    }
    
    // Адрес уже установлен в профиле пользователя Wolt
    // Если нужно изменить - раскомментировать:
    // if (deliveryAddress) {
    //   await setDeliveryAddress(deliveryAddress + (apartment ? `, кв. ${apartment}` : ''));
    // }
    
    // ПОДТВЕРЖДАЕМ ЗАКАЗ!
    console.log('\n[Wolt Puppeteer] 💳 CONFIRMING ORDER...');
    const result = await confirmOrder();
    
    await saveCookies();
    
    console.log('\n[Wolt Puppeteer] ═══════════════════════════════════════');
    if (result.success) {
      console.log('[Wolt Puppeteer] ✅ ORDER PLACED SUCCESSFULLY!');
      console.log('[Wolt Puppeteer] Order ID:', result.orderId || 'N/A');
    } else {
      console.log('[Wolt Puppeteer] ❌ ORDER FAILED:', result.error);
    }
    console.log('[Wolt Puppeteer] ═══════════════════════════════════════\n');
    
    return result;
    
  } catch (err) {
    console.error('[Wolt Puppeteer] ❌ Order failed:', err.message);
    await page.screenshot({ path: '/app/data/order_error.png' }).catch(() => {});
    return { success: false, error: err.message };
  }
}

/**
 * Экспорт для тестов
 */
export {
  getBrowser,
  closeBrowser,
  checkAuth,
  openVenue,
  injectTokensAsCookies,
};
