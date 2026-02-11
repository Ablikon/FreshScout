/**
 * Simple test - just open Wolt and check products
 */
import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const COOKIES_PATH = '/app/data/wolt_cookies.json';

async function test() {
  console.log('Starting...');
  
  // Load cookies
  let cookies = [];
  try {
    cookies = JSON.parse(await fs.readFile(COOKIES_PATH, 'utf-8'));
    console.log('Loaded', cookies.length, 'cookies');
  } catch (e) {
    console.log('No cookies');
  }
  
  // Launch with simplified args
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
  
  console.log('Browser launched');
  const page = await browser.newPage();
  
  // Set cookies
  if (cookies.length > 0) {
    await page.setCookie(...cookies);
    console.log('Cookies set');
  }
  
  // Go to page with short timeout
  console.log('Going to Wolt Market...');
  try {
    await page.goto('https://wolt.com/ru/kaz/almaty/venue/wolt-market-shevchenko', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    console.log('Page loaded!');
    console.log('Title:', await page.title());
  } catch (e) {
    console.log('Goto error:', e.message);
  }
  
  await browser.close();
  console.log('Done!');
}

test().catch(e => console.error('Fatal:', e.message));
