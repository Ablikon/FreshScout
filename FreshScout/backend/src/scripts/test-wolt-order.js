/**
 * Test Wolt order flow via Puppeteer
 */
import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const COOKIES_PATH = '/app/data/wolt_cookies.json';

async function testOrderFlow() {
  console.log('Loading cookies...');
  let cookies = [];
  try {
    const data = await fs.readFile(COOKIES_PATH, 'utf-8');
    cookies = JSON.parse(data);
    console.log('Loaded', cookies.length, 'cookies');
  } catch (e) {
    console.log('No cookies file');
    return;
  }
  
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  await page.setCookie(...cookies);
  
  // Go to Wolt Market
  console.log('Going to Wolt Market...');
  await page.goto('https://wolt.com/ru/kaz/almaty/venue/wolt-market-shevchenko', { 
    waitUntil: 'networkidle2', 
    timeout: 60000 
  });
  
  console.log('Page loaded, checking auth...');
  
  // Check auth status and page content
  const pageInfo = await page.evaluate(() => {
    // Check header elements
    const loginBtn = document.querySelector('[data-test-id="header.login-button"]');
    const cartBtn = document.querySelector('[data-test-id="header.cart-button"]');
    const searchBar = document.querySelector('[data-test-id="venue-search-input"]');
    
    // Check if we see products
    const productCards = document.querySelectorAll('[data-test-id*="MenuItem"], [data-test-id*="horizontal-item"]');
    
    // Check for any error messages
    const errorEl = document.querySelector('[class*="error"], [class*="Error"]');
    
    return {
      hasLoginButton: !!loginBtn,
      hasCartButton: !!cartBtn,
      hasSearchBar: !!searchBar,
      productCount: productCards.length,
      hasError: !!errorEl,
      errorText: errorEl?.textContent || null,
      title: document.title,
      url: window.location.href,
    };
  });
  
  console.log('Page info:', pageInfo);
  
  // Try to search for a product
  console.log('Searching for "Coca-Cola"...');
  
  const searchInput = await page.$('input[placeholder*="Поиск"], [data-test-id="venue-search-input"], input[type="search"]');
  if (searchInput) {
    await searchInput.click();
    await searchInput.type('Coca-Cola', { delay: 50 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Check search results
    const searchResults = await page.evaluate(() => {
      const items = document.querySelectorAll('[data-test-id*="MenuItem"], [data-test-id*="horizontal-item"], [data-test-id*="search-result"]');
      return {
        count: items.length,
        firstItemText: items[0]?.textContent?.substring(0, 100) || null
      };
    });
    console.log('Search results:', searchResults);
  } else {
    console.log('Search input not found');
  }
  
  // Screenshot for debugging
  await page.screenshot({ path: '/app/data/wolt-test-screenshot.png' });
  console.log('Screenshot saved to /app/data/wolt-test-screenshot.png');
  
  await browser.close();
  console.log('Done!');
}

testOrderFlow().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
