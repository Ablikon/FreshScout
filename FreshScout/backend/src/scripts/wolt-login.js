#!/usr/bin/env node
/**
 * Интерактивный вход в Wolt
 * 
 * Этот скрипт открывает браузер где ты можешь войти в свой аккаунт Wolt.
 * После входа cookies сохраняются и будут использоваться для автоматических заказов.
 * 
 * ВАЖНО: Входи через НОМЕР ТЕЛЕФОНА, не через Google!
 * Google блокирует вход через автоматизированные браузеры.
 * 
 * Запуск: node src/scripts/wolt-login.js
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIES_PATH = path.join(__dirname, '../data/wolt_cookies.json');

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🔐 Wolt Login Helper');
  console.log('====================\n');
  console.log('⚠️  ВАЖНО: Входи через НОМЕР ТЕЛЕФОНА, не через Google!');
  console.log('   Google блокирует вход из автоматизированных браузеров.\n');
  
  // Запускаем браузер с GUI (не headless)
  const browser = await puppeteer.launch({
    headless: false, // Показываем браузер!
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,800',
      '--disable-blink-features=AutomationControlled', // Скрываем автоматизацию
    ],
    defaultViewport: { width: 1280, height: 800 },
    ignoreDefaultArgs: ['--enable-automation'], // Убираем флаг автоматизации
  });
  
  const page = await browser.newPage();
  
  // Скрываем признаки автоматизации
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  
  // Идём на страницу входа Wolt
  console.log('📱 Открываю Wolt...');
  await page.goto('https://wolt.com/ru/kaz/almaty/', {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });
  
  console.log('\n✅ Браузер открыт!');
  console.log('\n📋 Инструкции:');
  console.log('1. Нажми "Войти" в правом верхнем углу');
  console.log('2. Выбери "Продолжить с номером телефона" (НЕ Google!)');
  console.log('3. Введи номер телефона и код из SMS');
  console.log('4. Убедись что ты вошёл (видишь свой профиль)');
  console.log('5. Вернись в терминал и нажми Enter\n');
  
  await prompt('Нажми Enter когда войдёшь в аккаунт...');
  
  // Проверяем авторизацию
  console.log('\n🔍 Проверяю авторизацию...');
  
  // Сначала переходим на wolt.com чтобы получить все cookies
  await page.goto('https://wolt.com/ru/kaz/almaty/', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const authCheck = await page.evaluate(() => {
    const loginBtn = document.querySelector('[data-test-id="UserStatus.Login"]');
    const userStatus = document.querySelector('[data-test-id="user-status-component"]');
    return {
      hasLoginButton: !!loginBtn,
      hasUserStatus: !!userStatus,
      isLoggedIn: !loginBtn,
    };
  });
  
  if (!authCheck.isLoggedIn) {
    console.log('❌ Похоже ты не вошёл. Попробуй ещё раз.');
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Авторизация подтверждена!');
  
  // Сохраняем ВСЕ cookies с wolt.com
  console.log('\n💾 Сохраняю cookies...');
  
  // Получаем cookies только с wolt.com
  const allCookies = await page.cookies('https://wolt.com');
  const woltCookies = allCookies.filter(c => c.domain.includes('wolt.com'));
  
  await fs.mkdir(path.dirname(COOKIES_PATH), { recursive: true });
  await fs.writeFile(COOKIES_PATH, JSON.stringify(woltCookies, null, 2));
  
  console.log(`✅ Сохранено ${woltCookies.length} cookies в ${COOKIES_PATH}`);
  
  // Показываем информацию о токене
  const wtoken = cookies.find(c => c.name === '__wtoken');
  if (wtoken) {
    try {
      const payload = JSON.parse(atob(wtoken.value.split('.')[1]));
      console.log('\n👤 Аккаунт:', payload.user?.name?.first_name || 'Unknown');
      console.log('📧 Email:', payload.user?.email || 'Unknown');
      console.log('📱 Телефон:', payload.user?.phone_number || 'Unknown');
      
      const exp = new Date(payload.exp * 1000);
      console.log('⏰ Токен действителен до:', exp.toLocaleString());
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  await browser.close();
  
  console.log('\n🎉 Готово! Теперь можно делать заказы через FreshScout.');
  console.log('\n💡 Подсказка: скопируй cookies в Docker:');
  console.log('   docker cp src/data/wolt_cookies.json freshscout-backend-1:/app/data/');
}

main().catch(err => {
  console.error('❌ Ошибка:', err.message);
  process.exit(1);
});
