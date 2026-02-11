/**
 * Magnum Store Adapter (via Kaspi or Magnum Delivery)
 *
 * Magnum products link to kaspi.kz/shop/p/{slug}-{productId}
 * Magnum also has its own app/delivery service
 *
 * Options:
 * A) Magnum Delivery app API (if available)
 * B) Kaspi Shop API (closed, requires reverse engineering)
 * C) Headless browser (Puppeteer/Playwright) as fallback
 *
 * Product IDs are numeric Kaspi IDs (e.g. 113401799)
 *
 * CREDENTIALS: Set via env vars MAGNUM_PHONE, MAGNUM_PASSWORD
 */

export async function placeMagnumOrder({ items, address, apartment, entrance, floor, comment, contactPhone, city }) {
  // TODO: implement when credentials are provided
  throw new Error('Magnum adapter not yet configured — waiting for credentials');
}
