#!/usr/bin/env node
/**
 * Lavka Yandex Authorization CLI
 * 
 * Запуск: node scripts/lavka-auth.js
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIES_PATH = path.join(__dirname, '../src/data/lavka_cookies.json');

async function main() {
  console.log('\n🛒 ====================================');
  console.log('   Lavka Yandex - Авторизация');
  console.log('====================================\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const question = (q) => new Promise(resolve => rl.question(q, resolve));
  
  console.log('Откроется страница авторизации Yandex.');
  console.log('Введи номер телефона и SMS код.\n');
  
  await question('Нажми Enter чтобы открыть браузер...');
  
  console.log('\n🚀 Запускаю браузер...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,800',
    ],
    defaultViewport: { width: 1280, height: 800 },
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // СРАЗУ идём на passport.yandex.kz для авторизации
  console.log('📱 Открываю страницу входа Yandex...\n');
  await page.goto('https://passport.yandex.kz/auth', {
    waitUntil: 'networkidle2',
  });
  
  console.log('✅ Страница входа открыта!');
  console.log('');
  console.log('   👉 Введи номер телефона');
  console.log('   👉 Получи SMS и введи код');
  console.log('');
  console.log('⏳ Жду завершения авторизации...');
  console.log('   (Когда залогинишься - нажми Enter в терминале)\n');
  
  // Ждём пока пользователь скажет что готово
  await question('Нажми Enter когда авторизуешься в браузере...');
  
  console.log('\n🔄 Перехожу на Lavka для сбора cookies...\n');
  
  // Теперь идём на Lavka
  await page.goto('https://lavka.yandex.kz', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Идём на корзину чтобы точно получить все cookies
  await page.goto('https://lavka.yandex.kz/cart', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Собираем cookies со всех доменов
  const cookies = await page.cookies('https://lavka.yandex.kz', 'https://yandex.kz', 'https://passport.yandex.kz');
  
  // Сохраняем
  await fs.mkdir(path.dirname(COOKIES_PATH), { recursive: true });
  await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  
  console.log(`💾 Сохранено ${cookies.length} cookies\n`);
  
  // Проверяем важные cookies
  const sessionCookie = cookies.find(c => c.name === 'Session_id');
  const lavkaCookies = cookies.filter(c => c.name.includes('lavka'));
  
  console.log('🔑 Статус:');
  if (sessionCookie) {
    console.log(`   ✅ Session_id: ${sessionCookie.value.substring(0, 40)}...`);
  } else {
    console.log('   ❌ Session_id НЕ НАЙДЕН!');
    console.log('   Возможно авторизация не прошла. Попробуй ещё раз.');
  }
  
  lavkaCookies.forEach(c => {
    console.log(`   ✅ ${c.name}: ${c.value.substring(0, 30)}...`);
  });
  
  if (sessionCookie) {
    console.log('\n🎉 Готово! Lavka API теперь будет работать.');
  }
  
  await browser.close();
  rl.close();
  
  console.log('\n👋 Браузер закрыт.\n');
}

main().catch(console.error);
