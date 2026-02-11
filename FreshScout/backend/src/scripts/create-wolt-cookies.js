/**
 * Скрипт для быстрого создания Wolt cookies из токена
 * 
 * Запуск: node src/scripts/create-wolt-cookies.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.join(__dirname, '../data/wolt_tokens.json');
const COOKIES_PATH = path.join(__dirname, '../data/wolt_cookies.json');

async function createCookies() {
  // Читаем токены
  const tokensData = await fs.readFile(TOKENS_PATH, 'utf-8');
  const tokens = JSON.parse(tokensData);
  
  if (!tokens.accessToken) {
    console.error('No access token found!');
    return;
  }
  
  // Создаём cookies
  const cookies = [
    {
      name: '__wtoken',
      value: tokens.accessToken,
      domain: '.wolt.com',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
    {
      name: '__wrtoken',
      value: tokens.refreshToken || '',
      domain: '.wolt.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
    {
      name: 'wolt_country',
      value: 'KAZ',
      domain: '.wolt.com',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
    {
      name: 'wolt_city',
      value: 'almaty',
      domain: '.wolt.com',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
  ];
  
  await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  console.log('✅ Cookies created from tokens');
  console.log('   Saved to:', COOKIES_PATH);
}

createCookies().catch(console.error);
