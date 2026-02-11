/**
 * SMS Service — отправка OTP-кодов через WhatsApp (WAHA)
 *
 * WAHA (WhatsApp HTTP API) — self-hosted контейнер, крутится рядом.
 * Телефон сканирует QR → WAHA отправляет сообщения от его имени.
 *
 * Env:
 *   SMS_PROVIDER=waha  (или "console" для разработки)
 *   WAHA_API_URL=http://waha:3000  (внутри docker network)
 *   WAHA_SESSION=default
 */

const PROVIDER = process.env.SMS_PROVIDER || 'console';
const WAHA_API_URL = process.env.WAHA_API_URL || 'http://waha:3000';
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';
const WAHA_API_KEY = process.env.WAHA_API_KEY || '';

// ────────────────────────────────────────
// Provider: WAHA (WhatsApp HTTP API)
// ────────────────────────────────────────
async function sendViaWaha(phone, code) {
  // +77001234567 → 77001234567@c.us
  const chatId = phone.replace(/^\+/, '') + '@c.us';
  const text = `🔐 *FreshScout* — код подтверждения\n\n*${code}*\n\nНе сообщайте этот код никому.`;

  const headers = { 'Content-Type': 'application/json' };
  if (WAHA_API_KEY) headers['X-Api-Key'] = WAHA_API_KEY;

  const res = await fetch(`${WAHA_API_URL}/api/sendText`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      session: WAHA_SESSION,
      chatId,
      text,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`WAHA ошибка ${res.status}: ${body}`);
  }

  const data = await res.json().catch(() => ({}));
  console.log(`📱 WhatsApp OTP sent to ${phone} via WAHA`, data.id || '');
  return { success: true, provider: 'waha', messageId: data.id };
}

// ────────────────────────────────────────
// Provider: Console (для разработки)
// ────────────────────────────────────────
async function sendViaConsole(phone, code) {
  console.log(`📱 OTP for ${phone}: ${code}`);
  return { success: true, provider: 'console' };
}

// ────────────────────────────────────────
// Main export
// ────────────────────────────────────────
const providers = {
  waha: sendViaWaha,
  console: sendViaConsole,
};

export async function sendOtp(phone, code) {
  const send = providers[PROVIDER];
  if (!send) {
    console.warn(`⚠️ Неизвестный SMS провайдер: ${PROVIDER}, используем console`);
    return sendViaConsole(phone, code);
  }

  try {
    return await send(phone, code);
  } catch (err) {
    console.error(`❌ WhatsApp отправка не удалась:`, err.message);
    // Fallback: логируем код в консоль чтобы не потерять
    console.log(`📱 FALLBACK OTP for ${phone}: ${code}`);
    // Не бросаем ошибку — пользователь всё равно получит "код отправлен"
    // а код виден в логах для дебага
    return { success: true, provider: 'console-fallback' };
  }
}

export default { sendOtp };
