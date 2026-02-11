/**
 * Скрипт для отслеживания API вызовов Lavka
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';

async function captureApiCalls() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');

  // Загружаем cookies
  const cookiesData = await fs.readFile('./src/data/lavka_cookies.json', 'utf-8');
  const cookies = JSON.parse(cookiesData);
  await page.setCookie(...cookies);

  // Слушаем сетевые запросы
  const apiCalls = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/api/')) {
      apiCalls.push({ method: req.method(), url: url });
    }
  });

  // Идём на сайт
  console.log('Loading lavka.yandex.kz...');
  await page.goto('https://lavka.yandex.kz/', { waitUntil: 'networkidle2', timeout: 60000 });

  console.log('\n=== API calls captured ===');
  apiCalls.forEach(c => console.log(c.method, c.url));

  await browser.close();
}

captureApiCalls().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
