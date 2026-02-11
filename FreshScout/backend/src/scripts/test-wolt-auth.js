/**
 * Test Wolt auth via Puppeteer
 */
import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const COOKIES_PATH = process.env.NODE_ENV === 'production' 
  ? '/app/data/wolt_cookies.json' 
  : './src/data/wolt_cookies.json';

async function testAuth() {
  console.log('Loading cookies...');
  let cookies = [];
  try {
    const data = await fs.readFile(COOKIES_PATH, 'utf-8');
    cookies = JSON.parse(data);
    console.log('Loaded', cookies.length, 'cookies');
  } catch (e) {
    console.log('No cookies file');
  }
  
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  if (cookies.length > 0) {
    await page.setCookie(...cookies);
  }
  
  console.log('Going to Wolt...');
  await page.goto('https://wolt.com/ru/kaz/almaty/', { 
    waitUntil: 'networkidle2', 
    timeout: 30000 
  });
  
  // Check if logged in
  const authStatus = await page.evaluate(() => {
    const loginBtn = document.querySelector('[data-test-id="header.login-button"]');
    const userStatus = document.querySelector('[data-test-id="user-status-component"]');
    return {
      hasLoginButton: !!loginBtn,
      hasUserStatus: !!userStatus,
      bodyText: document.body?.innerText?.substring(0, 500) || ''
    };
  });
  
  console.log('Auth status:', {
    hasLoginButton: authStatus.hasLoginButton,
    hasUserStatus: authStatus.hasUserStatus,
    isLoggedIn: !authStatus.hasLoginButton || authStatus.hasUserStatus
  });
  
  // Save updated cookies
  const newCookies = await page.cookies();
  await fs.writeFile(COOKIES_PATH, JSON.stringify(newCookies, null, 2));
  console.log('Saved', newCookies.length, 'cookies');
  
  await browser.close();
  console.log('Done!');
}

testAuth().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
