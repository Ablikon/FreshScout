import Product from '../models/Product.js';
import { classifyProduct, getStoreName, getStoreSlug } from '../config/categories.js';

const DATA_API_URL = process.env.DATA_API_URL;
const DATA_API_TOKEN = process.env.DATA_API_TOKEN;

const SOURCES = [
  'airba_fresh_almaty_mapped',
  'airba_fresh_astana_mapped',
  'arbuz_kz_almaty_mapped',
  'arbuz_kz_astana_mapped',
  'magnum_almaty_mapped',
  'magnum_astana_mapped',
  'wolt_market_almaty_mapped',
  'wolt_market_astana_mapped',
  'yandex_lavka_almaty_mapped',
  'yandex_lavka_astana_mapped',
];

function extractCity(sourceId) {
  if (sourceId.includes('almaty')) return 'almaty';
  if (sourceId.includes('astana')) return 'astana';
  return 'almaty';
}

function normalizeProduct(raw, sourceId) {
  const store = getStoreSlug(sourceId);
  const storeName = getStoreName(sourceId);
  const city = extractCity(sourceId);
  const category = classifyProduct(raw, sourceId);

  const cost = Number(raw.cost) || 0;
  const prevCost = Number(raw.prev_cost) || 0;
  const discount = prevCost > cost && prevCost > 0
    ? Math.round(((prevCost - cost) / prevCost) * 100)
    : 0;

  // Clean title from HTML-like tags
  const title = (raw.title || '').replace(/<[^>]*>/g, '').trim();

  return {
    sourceId,
    productId: raw.id || raw.product_id || '',
    title,
    titleLower: title.toLowerCase(),
    cost,
    prevCost,
    description: (raw.description || '').replace(/<[^>]*>/g, '').trim(),
    url: raw.url || '',
    imageUrl: raw.url_picture || '',
    brand: raw.brand || '',
    measure: raw.measure || '',
    originalCategory: raw.category_full_path || '',
    store,
    storeName,
    city,
    categoryParent: category.parent,
    categoryChild: category.child,
    discount,
    scrapedAt: raw.time_scrap ? new Date(raw.time_scrap) : new Date(),
    syncedAt: new Date(),
  };
}

async function fetchSource(sourceId) {
  const url = `${DATA_API_URL}/api/csv-data/${sourceId}`;
  console.log(`  📥 Fetching ${sourceId}...`);

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${DATA_API_TOKEN}` },
    signal: AbortSignal.timeout(120000), // 2 min timeout
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${sourceId}`);
  }

  const json = await response.json();
  return json.data || [];
}

export async function syncAllProducts() {
  console.log('🔄 Starting product sync...');
  const startTime = Date.now();
  let totalSynced = 0;

  for (const sourceId of SOURCES) {
    try {
      const rawProducts = await fetchSource(sourceId);
      console.log(`  📦 Got ${rawProducts.length} products from ${sourceId}`);

      if (rawProducts.length === 0) continue;

      // ── Data quality filter ──
      // Kazakhstan tenge has NO fractional unit — any decimal price is
      // from a merchant sending prices in wrong units (÷100).
      // Additionally, Wolt / Airba have many integer prices that are also
      // wrong (e.g. 125₸ for a 12,500₸ product), so we raise their minimum.
      const hasQuirkyPricing = sourceId.startsWith('wolt') || sourceId.startsWith('airba');
      const minPrice = hasQuirkyPricing ? 200 : 50;

      const cleaned = rawProducts.filter(p => {
        if (!p.title || !p.cost) return false;
        const cost = Number(p.cost);
        if (cost < minPrice) return false;
        // Reject ANY decimal price — tenge is the smallest unit
        if (cost !== Math.floor(cost)) return false;
        return true;
      });

      // Deduplicate by normalized title: keep highest price per title
      // (merchants with correct pricing report realistic prices)
      const dedupMap = new Map();
      for (const p of cleaned) {
        const key = (p.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const existing = dedupMap.get(key);
        if (!existing || Number(p.cost) > Number(existing.cost)) {
          dedupMap.set(key, p);
        }
      }

      const normalized = [...dedupMap.values()]
        .map(p => normalizeProduct(p, sourceId));

      // Bulk upsert: delete old data for this source, insert new
      await Product.deleteMany({ sourceId });
      
      // Insert in batches of 1000
      const batchSize = 1000;
      for (let i = 0; i < normalized.length; i += batchSize) {
        const batch = normalized.slice(i, i + batchSize);
        await Product.insertMany(batch, { ordered: false });
      }

      totalSynced += normalized.length;
      console.log(`  ✅ Synced ${normalized.length} products from ${sourceId}`);
    } catch (error) {
      console.error(`  ❌ Error syncing ${sourceId}:`, error.message);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Sync complete: ${totalSynced} products in ${elapsed}s`);
  return totalSynced;
}

export default { syncAllProducts };
