#!/usr/bin/env node
/**
 * Простой скрипт - просто открывает Lavka и сохраняет cookies
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIES_PATH = path.join(__dirname, '../src/data/lavka_cookies.json');

async function main() {
  console.log('\n🚀 Открываю браузер...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: path.join(__dirname, '../.chrome-profile'), // Сохраняем профиль!
    args: ['--no-sandbox', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 },
  });
  
  const page = await browser.newPage();
  
  console.log('📱 Иду на lavka.yandex.kz...\n');
  await page.goto('https://lavka.yandex.kz', { waitUntil: 'networkidle2' });
  
  // Проверяем Session_id
  let cookies = await page.cookies();
  let hasSession = cookies.some(c => c.name === 'Session_id');
  
  if (!hasSession) {
    console.log('❌ Не залогинен. Открываю passport...\n');
    await page.goto('https://passport.yandex.kz/auth', { waitUntil: 'networkidle2' });
    
    console.log('👉 Введи номер и SMS в браузере');
    console.log('👉 Скрипт подождёт 2 минуты\n');
    
    // Ждём пока появится Session_id (до 2 минут)
    const startTime = Date.now();
    while (!hasSession && Date.now() - startTime < 120000) {
      await new Promise(r => setTimeout(r, 3000));
      cookies = await page.cookies('https://yandex.kz', 'https://passport.yandex.kz');
      hasSession = cookies.some(c => c.name === 'Session_id');
      if (hasSession) {
        console.log('✅ Session_id появился!\n');
      }
    }
  }
  
  if (hasSession) {
    // Идём на Lavka для полных cookies
    await page.goto('https://lavka.yandex.kz', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.goto('https://lavka.yandex.kz/cart', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Собираем ВСЕ cookies
    cookies = await page.cookies('https://lavka.yandex.kz', 'https://yandex.kz', 'https://passport.yandex.kz');
    
    await fs.mkdir(path.dirname(COOKIES_PATH), { recursive: true });
    await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    
    const session = cookies.find(c => c.name === 'Session_id');
    const lavka = cookies.filter(c => c.name.includes('lavka'));
    
    console.log(`💾 Сохранено ${cookies.length} cookies\n`);
    console.log('🔑 Важные:');
    if (session) console.log(`   Session_id: ${session.value.substring(0, 40)}...`);
    lavka.forEach(c => console.log(`   ${c.name}: ${c.value.substring(0, 30)}...`));
    console.log('\n🎉 Готово! Lavka API будет работать.\n');
  } else {
    console.log('❌ Не удалось получить Session_id. Попробуй ещё раз.\n');
  }
  
  await browser.close();
  console.log('👋 Браузер закрыт.\n');
}

main().catch(console.error);
