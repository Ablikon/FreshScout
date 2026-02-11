/**
 * Test Wolt internal APIs while logged in
 */
import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const COOKIES_PATH = '/app/data/wolt_cookies.json';

async function testAPIs() {
  console.log('Starting...');
  
  // Load cookies
  let cookies = [];
  try {
    cookies = JSON.parse(await fs.readFile(COOKIES_PATH, 'utf-8'));
    console.log('Loaded', cookies.length, 'cookies');
  } catch (e) {
    console.log('No cookies');
    return;
  }
  
  // Launch browser
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
    ]
  });
  
  const page = await browser.newPage();
  await page.setCookie(...cookies);
  
  // Enable request interception to capture API calls
  await page.setRequestInterception(true);
  
  const apiCalls = [];
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('consumer-api.wolt.com')) {
      apiCalls.push({
        url: url.split('?')[0],
        method: request.method(),
        headers: request.headers(),
      });
    }
    request.continue();
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('consumer-api.wolt.com') && !url.includes('/google/')) {
      console.log('API:', response.status(), response.request().method(), url.split('?')[0]);
    }
  });
  
  // Go to Wolt Market
  console.log('Going to Wolt Market...');
  await page.goto('https://wolt.com/ru/kaz/almaty/venue/wolt-market-shevchenko', { 
    waitUntil: 'networkidle0',
    timeout: 60000 
  });
  
  console.log('Page loaded, checking auth state...');
  
  // Check if we're logged in by looking for user elements
  const authCheck = await page.evaluate(() => {
    // Look for user-related elements in the page
    const userIcon = document.querySelector('[data-test-id="user-status-component"]');
    const loginBtn = document.querySelector('[data-test-id="header.login-button"]');
    
    // Check localStorage for auth data
    const localStorageKeys = Object.keys(localStorage || {});
    const authKeys = localStorageKeys.filter(k => k.includes('auth') || k.includes('token') || k.includes('user'));
    
    return {
      hasUserIcon: !!userIcon,
      hasLoginBtn: !!loginBtn,
      isLoggedIn: !!userIcon && !loginBtn,
      authKeys,
      localStorageSize: localStorageKeys.length,
    };
  });
  
  console.log('Auth check:', authCheck);
  
  // Try to get cart info 
  console.log('\nTrying to access cart...');
  const cartBtn = await page.$('[data-test-id="header.cart-button"]');
  if (cartBtn) {
    await cartBtn.click();
    await new Promise(r => setTimeout(r, 2000));
    
    const cartInfo = await page.evaluate(() => {
      // Look for cart content
      const cartContent = document.querySelector('[data-test-id*="cart"], [class*="CartView"]');
      const emptyCart = document.querySelector('[data-test-id="EmptyCartView"]');
      return {
        hasCartContent: !!cartContent,
        isEmpty: !!emptyCart,
        bodyText: document.body?.innerText?.substring(0, 500) || ''
      };
    });
    console.log('Cart info:', { hasCartContent: cartInfo.hasCartContent, isEmpty: cartInfo.isEmpty });
  }
  
  // Print captured API endpoints
  console.log('\nCaptured API endpoints:');
  const uniqueApis = [...new Set(apiCalls.map(a => `${a.method} ${a.url}`))];
  uniqueApis.slice(0, 15).forEach(api => console.log(' ', api));
  
  await browser.close();
  console.log('\nDone!');
}

testAPIs().catch(e => console.error('Fatal:', e.message));
