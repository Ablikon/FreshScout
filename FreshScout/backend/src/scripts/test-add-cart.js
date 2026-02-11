#!/usr/bin/env node
/**
 * Test adding item to cart on Wolt
 */

import { getBrowser, closeBrowser } from '../services/stores/wolt.puppeteer.js';
import fs from 'fs/promises';

const COOKIES_PATH = '/app/data/wolt_cookies.json';

async function testAddToCart() {
  console.log('🛒 Testing Add to Cart\n');
  
  try {
    const { page } = await getBrowser();
    
    // Open Wolt Market
    console.log('1. Opening Wolt Market...');
    await page.goto('https://wolt.com/ru/kaz/almaty/venue/wolt-market-shevchenko', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    await new Promise(r => setTimeout(r, 3000));
    console.log('   ✅ Page loaded\n');
    
    // Search for milk
    console.log('2. Searching for "молоко"...');
    const searchInput = await page.$('input[type="search"], input[placeholder*="Поиск"], [data-test-id="SearchInput"] input');
    if (searchInput) {
      await searchInput.click();
      await searchInput.type('молоко', { delay: 50 });
      await new Promise(r => setTimeout(r, 2000));
      console.log('   ✅ Typed search query\n');
    } else {
      console.log('   ❌ Search input not found\n');
    }
    
    // Screenshot after search
    await page.screenshot({ path: '/app/data/search_result.png' });
    console.log('   📸 Screenshot: /app/data/search_result.png\n');
    
    // Find first product
    console.log('3. Looking for products...');
    const products = await page.$$('[data-test-id*="MenuItem"], [data-test-id*="horizontal-item"], [data-test-id*="ProductCard"]');
    console.log(`   Found ${products.length} product elements\n`);
    
    if (products.length > 0) {
      console.log('4. Clicking first product...');
      await products[0].click();
      await new Promise(r => setTimeout(r, 1500));
      
      // Screenshot of product modal
      await page.screenshot({ path: '/app/data/product_modal.png' });
      console.log('   📸 Screenshot: /app/data/product_modal.png\n');
      
      // Try to find add button
      console.log('5. Looking for Add button...');
      const addBtn = await page.$('[data-test-id="product-modal.submit"], [data-test-id*="add-to-cart"], button[data-test-id*="add"]');
      if (addBtn) {
        const btnText = await addBtn.evaluate(el => el.textContent);
        console.log(`   Found button: "${btnText}"`);
        
        // Don't click - just show we found it
        console.log('   ⚠️  Not clicking (test mode)\n');
      } else {
        console.log('   ❌ Add button not found\n');
        
        // List all buttons
        const buttons = await page.$$eval('button', btns => 
          btns.map(b => ({ text: b.textContent?.substring(0, 50), testId: b.dataset?.testId }))
        );
        console.log('   Available buttons:', buttons.filter(b => b.text).slice(0, 10));
      }
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await closeBrowser();
  }
}

testAddToCart();
