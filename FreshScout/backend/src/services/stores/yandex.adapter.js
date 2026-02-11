/**
 * Yandex Lavka Store Adapter
 *
 * Yandex Lavka API (lavka.yandex.kz):
 * - Auth: Yandex OAuth (phone → OTP → session)
 * - Cart: POST /api/v1/cart — set cart items
 * - Order: POST /api/v1/orders/submit — place order
 *
 * Product IDs are long hex strings (e.g. 866d16d1936747efa4ed0372980099b4000300020000)
 * URL pattern: lavka.yandex.kz/good/{slug}
 *
 * CREDENTIALS: Set via env vars YANDEX_PHONE (OTP-based auth)
 */

export async function placeYandexOrder({ items, address, apartment, entrance, floor, comment, contactPhone, city }) {
  // TODO: implement when credentials are provided
  throw new Error('Yandex Lavka adapter not yet configured — waiting for credentials');
}
