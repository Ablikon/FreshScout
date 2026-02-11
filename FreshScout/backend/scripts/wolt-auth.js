/**
 * Wolt Authentication Script
 * Opens browser for manual login, then captures tokens
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKENS_FILE = path.join(__dirname, '../src/data/wolt_tokens.json');

async function captureWoltTokens() {
  console.log('🌐 Opening Wolt for authentication...');
  console.log('📝 Please log in to your Wolt account');
  console.log('');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Intercept API responses to capture tokens
  let accessToken = null;
  let refreshToken = null;
  
  page.on('response', async (response) => {
    const url = response.url();
    
    // Capture token from auth responses
    if (url.includes('/v1/auth') || url.includes('oauth') || url.includes('token')) {
      try {
        const json = await response.json().catch(() => null);
        if (json) {
          if (json.access_token) {
            accessToken = json.access_token;
            console.log('✅ Captured access token!');
          }
          if (json.refresh_token) {
            refreshToken = json.refresh_token;
            console.log('✅ Captured refresh token!');
          }
        }
      } catch (e) {}
    }
  });
  
  // Also capture from localStorage after page loads
  const checkLocalStorage = async () => {
    try {
      const tokens = await page.evaluate(() => {
        const stored = localStorage.getItem('wolt-auth-token');
        if (stored) {
          try {
            return JSON.parse(stored);
          } catch (e) {
            return null;
          }
        }
        return null;
      });
      
      if (tokens) {
        if (tokens.accessToken) accessToken = tokens.accessToken;
        if (tokens.refreshToken) refreshToken = tokens.refreshToken;
        console.log('✅ Found tokens in localStorage!');
        return true;
      }
    } catch (e) {}
    return false;
  };
  
  await page.goto('https://wolt.com/ru/kaz/almaty', { waitUntil: 'networkidle2' });
  
  console.log('');
  console.log('🔐 Please log in to Wolt using your phone number or email.');
  console.log('   After successful login, wait for the main page to load.');
  console.log('');
  console.log('⏳ Waiting for authentication...');
  console.log('   (Press Ctrl+C when done if script doesn\'t detect automatically)');
  
  // Check every 3 seconds for tokens
  let attempts = 0;
  const maxAttempts = 120; // 6 minutes
  
  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 3000));
    attempts++;
    
    // Check localStorage
    const foundInStorage = await checkLocalStorage();
    
    // Also check cookies
    const cookies = await page.cookies();
    const authCookie = cookies.find(c => c.name === 'wolt_auth' || c.name.includes('token'));
    
    if (accessToken && refreshToken) {
      console.log('');
      console.log('🎉 Authentication successful!');
      break;
    }
    
    if (attempts % 10 === 0) {
      console.log(`   Still waiting... (${attempts * 3}s)`);
    }
  }
  
  // If we have tokens, save them
  if (accessToken) {
    const tokenData = {
      accessToken,
      refreshToken: refreshToken || '',
      expiresAt: Date.now() + 3600000, // 1 hour
      capturedAt: new Date().toISOString()
    };
    
    // Ensure directory exists
    const dir = path.dirname(TOKENS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokenData, null, 2));
    console.log(`✅ Tokens saved to ${TOKENS_FILE}`);
  } else {
    console.log('');
    console.log('⚠️ Could not capture tokens automatically.');
    console.log('   Please check the browser developer tools (F12) > Application > Local Storage');
    console.log('   Look for "wolt-auth-token" and copy the values manually.');
  }
  
  console.log('');
  console.log('Press Enter to close the browser...');
  
  // Wait for user input
  process.stdin.setRawMode(true);
  process.stdin.resume();
  await new Promise(resolve => process.stdin.once('data', resolve));
  
  await browser.close();
  console.log('Done!');
  process.exit(0);
}

captureWoltTokens().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
