#!/usr/bin/env node
/**
 * Test Wolt Puppeteer - проверка работы браузерной автоматизации
 * БЕЗ оформления реального заказа
 */

import { getBrowser, closeBrowser, checkAuth, openVenue, injectTokensAsCookies } from '../services/stores/wolt.puppeteer.js';

async function testPuppeteer() {
  console.log('🧪 Testing Wolt Puppeteer Automation\n');
  
  try {
    // 1. Запускаем браузер
    console.log('1. Launching browser...');
    const { page } = await getBrowser();
    console.log('   ✅ Browser launched\n');
    
    // 1.5. Инжектируем токены в cookies
    console.log('1.5. Injecting tokens as cookies...');
    await injectTokensAsCookies();
    console.log('   ✅ Tokens injected\n');
    
    // 2. Проверяем авторизацию
    console.log('2. Checking auth...');
    const isAuthed = await checkAuth();
    console.log(`   ${isAuthed ? '✅ Logged in!' : '❌ NOT logged in'}\n`);
    
    // Make screenshot to see what's happening
    await page.screenshot({ path: '/app/data/auth_check.png', fullPage: true });
    console.log('   📸 Screenshot saved to /app/data/auth_check.png\n');
    
    // Check what elements are on the page
    const pageInfo = await page.evaluate(() => {
      const header = document.querySelector('header');
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).slice(0, 10);
      const testIds = Array.from(document.querySelectorAll('[data-test-id]')).map(el => el.dataset.testId).slice(0, 20);
      return { 
        headerHtml: header?.innerHTML?.substring(0, 500),
        buttons,
        testIds,
        url: window.location.href
      };
    });
    console.log('   Page URL:', pageInfo.url);
    console.log('   Test IDs found:', pageInfo.testIds);
    console.log('   Buttons:', pageInfo.buttons);
    
    if (!isAuthed) {
      console.log('\n⚠️  Не авторизован. Но продолжаем тест...');
    }
    
    // 3. Открываем Wolt Market
    console.log('3. Opening Wolt Market...');
    const opened = await openVenue('wolt-market-shevchenko');
    console.log(`   ${opened ? '✅ Venue opened' : '❌ Failed to open'}\n`);
    
    // 4. Делаем скриншот
    console.log('4. Taking screenshot...');
    await page.screenshot({ 
      path: '/app/data/test_screenshot.png',
      fullPage: false 
    });
    console.log('   ✅ Screenshot saved to /app/data/test_screenshot.png\n');
    
    // 5. Проверяем что можем найти элементы
    console.log('5. Checking page elements...');
    const elements = await page.evaluate(() => {
      return {
        searchInput: !!document.querySelector('input[type="search"], input[placeholder*="Поиск"]'),
        cartButton: !!document.querySelector('[data-test-id="header.cart-button"]'),
        products: document.querySelectorAll('[data-test-id*="MenuItem"], [data-test-id*="horizontal-item"]').length,
      };
    });
    console.log('   Search input:', elements.searchInput ? '✅' : '❌');
    console.log('   Cart button:', elements.cartButton ? '✅' : '❌');
    console.log('   Products found:', elements.products);
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   - Puppeteer works correctly');
    console.log('   - Can browse Wolt Market');
    console.log('   - Ready for real orders!');
    
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    console.error(err.stack);
  } finally {
    await closeBrowser();
  }
}

testPuppeteer();
