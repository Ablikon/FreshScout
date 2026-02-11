/**
 * Lavka Browser Automation
 * 
 * Использует Puppeteer для:
 * 1. Авторизации в Yandex (один раз с SMS)
 * 2. Сохранения cookies сессии
 * 3. Выполнения API запросов через браузерный контекст
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIES_PATH = path.join(__dirname, '../../data/lavka_cookies.json');
const LAVKA_URL = 'https://lavka.yandex.kz';

let browser = null;
let page = null;

/**
 * Запуск браузера
 */
async function launchBrowser(headless = true) {
  if (browser) return { browser, page };
  
  console.log('[Lavka Browser] Launching browser...');
  browser = await puppeteer.launch({
    headless: headless ? 'new' : false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  
  page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });
  
  // Загружаем сохранённые cookies если есть
  await loadCookies();
  
  return { browser, page };
}

/**
 * Закрытие браузера
 */
async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
  }
}

/**
 * Сохранение cookies
 */
async function saveCookies() {
  if (!page) return;
  
  const cookies = await page.cookies();
  await fs.mkdir(path.dirname(COOKIES_PATH), { recursive: true });
  await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  console.log('[Lavka Browser] Cookies saved:', cookies.length, 'items');
}

/**
 * Загрузка cookies
 */
async function loadCookies() {
  try {
    const data = await fs.readFile(COOKIES_PATH, 'utf-8');
    const cookies = JSON.parse(data);
    if (cookies.length > 0 && page) {
      await page.setCookie(...cookies);
      console.log('[Lavka Browser] Loaded', cookies.length, 'cookies');
      return true;
    }
  } catch {
    console.log('[Lavka Browser] No saved cookies found');
  }
  return false;
}

/**
 * Проверка авторизации
 */
async function checkAuth() {
  await launchBrowser(true);
  
  await page.goto(LAVKA_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Проверяем есть ли кнопка входа или уже авторизованы
  const loginButton = await page.$('[data-testid="header-login-button"], .HeaderLoginButton, [class*="login"]');
  
  if (loginButton) {
    console.log('[Lavka Browser] Not logged in');
    return false;
  }
  
  // Проверяем есть ли элементы авторизованного пользователя
  const userElement = await page.$('[data-testid="header-user"], .HeaderUser, [class*="profile"], [class*="user"]');
  
  if (userElement) {
    console.log('[Lavka Browser] Already logged in');
    await saveCookies();
    return true;
  }
  
  // Пробуем определить по URL или контенту
  const url = page.url();
  if (url.includes('passport.yandex')) {
    console.log('[Lavka Browser] Redirected to login page');
    return false;
  }
  
  console.log('[Lavka Browser] Auth status unclear, assuming logged in');
  await saveCookies();
  return true;
}

/**
 * Авторизация в Yandex (интерактивная - с SMS)
 * Запускать с headless: false чтобы увидеть браузер
 */
export async function loginToYandex(phoneNumber) {
  console.log('[Lavka Browser] Starting login process...');
  
  await launchBrowser(false); // Открываем видимый браузер
  
  await page.goto('https://passport.yandex.kz/auth', { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });
  
  // Ждём загрузки формы логина
  await page.waitForSelector('input[name="login"], input[type="tel"], input[id="passp-field-login"]', { timeout: 10000 });
  
  // Вводим номер телефона
  const phoneInput = await page.$('input[name="login"], input[type="tel"], input[id="passp-field-login"]');
  if (phoneInput) {
    await phoneInput.type(phoneNumber, { delay: 100 });
    console.log('[Lavka Browser] Phone entered:', phoneNumber);
    
    // Нажимаем кнопку продолжить
    const submitBtn = await page.$('button[type="submit"], [data-t="button:action"]');
    if (submitBtn) {
      await submitBtn.click();
    }
  }
  
  console.log('[Lavka Browser] ⏳ Waiting for SMS code input...');
  console.log('[Lavka Browser] 📱 Enter SMS code in the browser window');
  
  // Ждём пока пользователь введёт SMS код и авторизуется
  // Проверяем редирект на Lavka или успешный логин
  await page.waitForFunction(
    () => {
      return window.location.href.includes('lavka.yandex') || 
             window.location.href.includes('passport.yandex.kz/profile') ||
             document.querySelector('[data-testid="header-user"]');
    },
    { timeout: 120000 } // 2 минуты на ввод SMS
  );
  
  console.log('[Lavka Browser] ✅ Login successful!');
  
  // Переходим на Lavka чтобы получить все нужные cookies
  await page.goto(LAVKA_URL, { waitUntil: 'networkidle2' });
  await saveCookies();
  
  console.log('[Lavka Browser] 🎉 Cookies saved, you can now use Lavka API');
  
  return true;
}

/**
 * Получить информацию о доставке через браузер
 */
export async function getDeliveryInfoBrowser(lat, lon) {
  console.log('[Lavka Browser] Getting delivery info via browser...');
  
  await launchBrowser(true);
  
  // Проверяем авторизацию
  const isLoggedIn = await checkAuth();
  if (!isLoggedIn) {
    throw new Error('Не авторизован в Yandex. Запустите loginToYandex()');
  }
  
  // Идём на страницу с нужными координатами
  const url = `${LAVKA_URL}/?lat=${lat}&lon=${lon}`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Ждём загрузки данных о доставке
  await page.waitForSelector('[class*="DeliveryInfo"], [class*="delivery"], [class*="eta"]', { timeout: 10000 })
    .catch(() => console.log('[Lavka Browser] Delivery info element not found'));
  
  // Извлекаем данные со страницы
  const deliveryInfo = await page.evaluate(() => {
    // Ищем время доставки
    const etaElement = document.querySelector('[class*="eta"], [class*="DeliveryTime"], [class*="delivery-time"]');
    const eta = etaElement?.textContent || '5-15 мин';
    
    // Ищем стоимость доставки
    const feeElement = document.querySelector('[class*="delivery-fee"], [class*="DeliveryFee"]');
    const fee = feeElement?.textContent || '';
    
    // Проверяем доступность
    const unavailable = document.querySelector('[class*="unavailable"], [class*="closed"]');
    
    return {
      available: !unavailable,
      deliveryTime: eta,
      rawFee: fee,
    };
  });
  
  await saveCookies();
  
  return {
    available: deliveryInfo.available,
    deliveryTime: deliveryInfo.deliveryTime,
    deliveryFee: 390, // Базовая стоимость
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
    statusMessage: 'Экспресс-доставка ' + deliveryInfo.deliveryTime,
  };
}

/**
 * Выполнить API запрос через браузерный контекст
 */
export async function apiRequestBrowser(endpoint, options = {}) {
  console.log('[Lavka Browser] API request:', endpoint);
  
  await launchBrowser(true);
  
  // Идём на Lavka чтобы быть в правильном контексте
  const currentUrl = page.url();
  if (!currentUrl.includes('lavka.yandex')) {
    await page.goto(LAVKA_URL, { waitUntil: 'networkidle2' });
  }
  
  // Выполняем fetch из контекста страницы
  const result = await page.evaluate(async (endpoint, options) => {
    try {
      const response = await fetch(`https://lavka.yandex.kz/api${endpoint}`, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        body: options.body,
        credentials: 'include',
      });
      
      const text = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        data: text,
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, endpoint, options);
  
  if (!result.ok) {
    throw new Error(`Lavka API error ${result.status}: ${result.data || result.error}`);
  }
  
  await saveCookies();
  
  try {
    return JSON.parse(result.data);
  } catch {
    return { raw: result.data };
  }
}

/**
 * Добавить товар в корзину
 */
export async function addToCartBrowser(productId, quantity = 1) {
  console.log('[Lavka Browser] Adding to cart:', productId, 'qty:', quantity);
  
  return apiRequestBrowser('/v1/cart/update', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ product_id: productId, quantity }],
    }),
  });
}

/**
 * Получить корзину
 */
export async function getCartBrowser() {
  console.log('[Lavka Browser] Getting cart...');
  return apiRequestBrowser('/v1/cart');
}

/**
 * CLI для авторизации
 */
export async function runAuthCLI() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const question = (q) => new Promise(resolve => rl.question(q, resolve));
  
  console.log('\n🛒 Lavka Yandex Authorization\n');
  
  const phone = await question('Введите номер телефона (например +77001234567): ');
  
  try {
    await loginToYandex(phone);
    console.log('\n✅ Авторизация успешна! Cookies сохранены.');
    console.log('Теперь Lavka API будет работать автоматически.\n');
  } catch (err) {
    console.error('\n❌ Ошибка авторизации:', err.message);
  }
  
  rl.close();
  await closeBrowser();
}

// Если запущен напрямую - запускаем CLI авторизации
const isMainModule = process.argv[1]?.includes('lavka.browser');
if (isMainModule) {
  runAuthCLI();
}

export { launchBrowser, closeBrowser, checkAuth, saveCookies };
