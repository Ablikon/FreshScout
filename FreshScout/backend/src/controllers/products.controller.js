import Product from '../models/Product.js';
import { getCategoryTree, getStoreColor } from '../config/categories.js';

// ── Cyrillic ↔ Latin transliteration for brand search ──
const CYR_TO_LAT = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh',
  'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
  'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
  'ч':'ch','ш':'sh','щ':'sch','ы':'y','э':'e','ю':'yu','я':'ya',
};
const LAT_TO_CYR = {
  'a':'а','b':'б','c':'к','d':'д','e':'е','f':'ф','g':'г','h':'х',
  'i':'и','j':'дж','k':'к','l':'л','m':'м','n':'н','o':'о','p':'п',
  'q':'к','r':'р','s':'с','t':'т','u':'у','v':'в','w':'в','x':'кс',
  'y':'и','z':'з',
};

function transliterate(term) {
  const t = term.toLowerCase();
  const isCyrillic = /[а-яё]/.test(t);
  if (isCyrillic) {
    return t.split('').map(c => CYR_TO_LAT[c] || c).join('');
  }
  return t.split('').map(c => LAT_TO_CYR[c] || c).join('');
}

/**
 * GET /api/products
 * Query params: city, category, subcategory, store, search, sort, page, limit, minPrice, maxPrice, brand
 */
export async function getProducts(req, res) {
  try {
    const {
      city = 'almaty',
      category,
      subcategory,
      store,
      search,
      sort = 'popular',
      page = 1,
      limit = 40,
      minPrice,
      maxPrice,
      brand,
    } = req.query;

    const filter = { city };

    if (category) filter.categoryParent = category;
    if (subcategory) filter.categoryChild = subcategory;
    if (store) filter.store = store;
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.cost = {};
      if (minPrice) filter.cost.$gte = Number(minPrice);
      if (maxPrice) filter.cost.$lte = Number(maxPrice);
    }

    let useRelevanceSort = false;
    let searchTermsForScoring = [];

    if (search) {
      const searchTerms = search.trim().toLowerCase().split(/\s+/);
      searchTermsForScoring = searchTerms;
      filter.$and = searchTerms.map(term => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const translit = transliterate(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match either original or transliterated version
        const regexOrig = `(^|[^а-яёa-z0-9])${escaped}`;
        const regexTranslit = `(^|[^а-яёa-z0-9])${translit}`;
        return {
          $or: [
            { titleLower: { $regex: regexOrig, $options: 'i' } },
            { titleLower: { $regex: regexTranslit, $options: 'i' } },
          ]
        };
      });
      // Always use relevance sorting when searching
      useRelevanceSort = true;
    }

    // Sort options
    let sortObj = {};
    switch (sort) {
      case 'price_asc': sortObj = { cost: 1 }; break;
      case 'price_desc': sortObj = { cost: -1 }; break;
      case 'discount': sortObj = { discount: -1, cost: 1 }; break;
      case 'name': sortObj = { titleLower: 1 }; break;
      default: sortObj = { discount: -1, cost: 1 }; // popular = best deals first
    }

    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Math.min(Number(limit), 100);

    let products, total;

    if (useRelevanceSort) {
      // Fetch a generous pool of candidates for relevance scoring.
      // Don't pre-sort by price — otherwise cheap irrelevant products
      // crowd out relevant expensive ones (e.g. "вино" showing kids snacks
      // instead of actual wine).
      const fetchLimit = Math.min(Math.max((skip + limitNum) * 5, 200), 800);
      const [candidates, countTotal] = await Promise.all([
        Product.find(filter).limit(fetchLimit).lean(),
        Product.countDocuments(filter),
      ]);

      // ── Relevance scoring ──
      // Higher score = more relevant
      const scored = candidates.map(p => {
        let score = 0;
        const title = p.titleLower || '';
        const titleWords = title.split(/\s+/);
        const brandLower = (p.brand || '').toLowerCase();
        const catLower = ((p.originalCategory || '') + ' ' + (p.categoryChild || '')).toLowerCase();
        // Build a product-type string from the first 3 title words
        // (in grocery titles, first words describe the product, last words are flavor/size)
        const productTypeWords = titleWords.slice(0, 3).join(' ');

        for (const term of searchTermsForScoring) {
          const translit = transliterate(term);
          for (const t of [term, translit]) {
            // ── Position scoring ──
            const idx = title.indexOf(t);
            if (idx === 0) {
              score += 20; // Title starts with the search term
            } else if (idx >= 0 && idx <= 15) {
              score += 14; // Term in first ~15 chars (likely the product name)
            } else if (idx >= 0) {
              score += 3;  // Term later in title (likely flavor/ingredient)
            }

            // ── Word match scoring ──
            // Where the word appears matters: first 2 words = product name
            const exactWordIdx = titleWords.findIndex(w => w === t);
            const partialWordIdx = titleWords.findIndex(w => w !== t && w.includes(t));

            if (exactWordIdx >= 0 && exactWordIdx <= 1) {
              score += 20; // Search term IS the product (first 2 words, exact)
            } else if (exactWordIdx >= 0) {
              // Exact word match later — penalize based on distance
              const dist = Math.min(exactWordIdx - 2, 5);
              score += Math.max(10 - dist * 2, 2);
            } else if (partialWordIdx >= 0 && partialWordIdx <= 1) {
              score += 5;  // Substring in first 2 words (e.g. "вино" in "винокур")
            } else if (partialWordIdx >= 0) {
              score += 2;  // Substring later in title
            }

            // ── Brand match ──
            if (brandLower && brandLower.includes(t)) {
              score += 15; // Search matches the brand field
            }

            // ── Category match ──
            // If the search term appears as a standalone word in the product's category
            const catWords = catLower.split(/[\s>\/,]+/).filter(Boolean);
            if (catWords.some(w => w === t)) {
              score += 10;
            }
          }
        }

        // Shorter titles = more specific products
        if (titleWords.length <= 3) score += 5;
        else if (titleWords.length <= 6) score += 2;

        // Discount bonus (minor)
        if (p.discount > 0) score += 1;

        return { ...p, _relevanceScore: score };
      });

      scored.sort((a, b) => b._relevanceScore - a._relevanceScore || a.cost - b.cost);

      products = scored.slice(skip, skip + limitNum);
      total = countTotal;
    } else {
      const [prods, countTotal] = await Promise.all([
        Product.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
        Product.countDocuments(filter),
      ]);
      products = prods;
      total = countTotal;
    }

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * Extract volume in milliliters from a product title or measure string.
 * Returns null if no volume found.
 */
function extractVolumeML(text) {
  if (!text) return null;
  const s = text.toLowerCase();

  // "1.5 л", "0.5л", "1 л", "0,5 л"
  let m = s.match(/(\d+[.,]\d+)\s*л(?:итр)?/);
  if (m) return Math.round(parseFloat(m[1].replace(',', '.')) * 1000);

  m = s.match(/(\d+)\s*л(?:итр)?(?:\b|$)/);
  if (m && parseInt(m[1]) <= 20) return parseInt(m[1]) * 1000;

  // "500 мл", "250мл", "330 мл"
  m = s.match(/(\d+)\s*мл/);
  if (m) return parseInt(m[1]);

  return null;
}

/**
 * Detect product variant flags from title.
 * Returns an object with boolean flags.
 */
function detectVariant(title) {
  const t = title.toLowerCase();
  return {
    isZero: /zero|без\s*сахар|sugar\s*free/i.test(t),
    isDiet: /diet|диет|лайт|light/i.test(t),
  };
}

/**
 * Extract the core product name (brand + product type) stripped of volume/variant noise.
 * Used for smarter matching.
 */
function extractCoreName(title) {
  let t = title.toLowerCase();
  // Remove volume info
  t = t.replace(/\d+[.,]?\d*\s*(л|мл|литр|г|кг|шт)\.?/gi, '');
  // Remove variant keywords (keep for separate check)
  t = t.replace(/(zero\s*sugar|zero|без\s*сахара?|sugar\s*free|classic|классическ\w*)/gi, '');
  // Remove filler words
  t = t.replace(/(напиток|газированный|газированная|безалкогольный|ж\/б|стекло|пэт|pet|ст\/б|кола|cola)/gi, '');
  // Clean up
  t = t.replace(/[,.\-–()«»"&;]/g, ' ').replace(/\s+/g, ' ').trim();
  return t;
}

/**
 * GET /api/products/:id
 */
export async function getProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    // ── Smart matching: same product, same volume, same variant ──
    const productVolume = extractVolumeML(product.title) || extractVolumeML(product.measure);
    const productVariant = detectVariant(product.title);
    const coreName = extractCoreName(product.title);

    // Build search: use brand words from core name
    const coreWords = coreName.split(/\s+/).filter(w => w.length >= 2).slice(0, 2);
    if (coreWords.length === 0) {
      return res.json({ product, alternatives: [] });
    }

    const regex = coreWords.map(w => `(?=.*${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).join('');

    // Query: match brand words + same category for precision
    const query = {
      _id: { $ne: product._id },
      city: product.city,
      titleLower: { $regex: regex, $options: 'i' },
    };
    if (product.categoryParent) {
      query.categoryParent = product.categoryParent;
    }

    // Fetch broader set, then filter precisely
    const candidates = await Product.find(query)
      .sort({ cost: 1 })
      .limit(50)
      .lean();

    // Filter: same volume (±tolerance) and same variant
    const alternatives = candidates.filter(alt => {
      const altVolume = extractVolumeML(alt.title) || extractVolumeML(alt.measure);
      const altVariant = detectVariant(alt.title);

      // Volume must match (within 10% tolerance or both unknown)
      if (productVolume && altVolume) {
        const tolerance = productVolume * 0.15;
        if (Math.abs(productVolume - altVolume) > tolerance) return false;
      } else if (productVolume || altVolume) {
        // One has volume, the other doesn't — skip
        return false;
      }

      // Variant must match (Zero vs regular)
      if (productVariant.isZero !== altVariant.isZero) return false;
      if (productVariant.isDiet !== altVariant.isDiet) return false;

      return true;
    }).slice(0, 10);

    res.json({ product, alternatives });
  } catch (error) {
    console.error('getProduct error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * GET /api/products/compare
 * Body: { items: [{ title, productId }] }
 * For each item, finds the cheapest option across all stores
 */
export async function compareProducts(req, res) {
  try {
    const { title, city = 'almaty' } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'title обязателен' });
    }

    const searchTerms = title.trim().toLowerCase().split(/\s+/).slice(0, 4);
    const regex = searchTerms.map(w => `(?=.*${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).join('');

    const matches = await Product.find({
      city,
      titleLower: { $regex: regex, $options: 'i' },
    })
      .sort({ cost: 1 })
      .limit(20)
      .lean();

    // Group by store, take cheapest per store
    const byStore = {};
    for (const p of matches) {
      if (!byStore[p.store] || p.cost < byStore[p.store].cost) {
        byStore[p.store] = p;
      }
    }

    res.json({
      query: title,
      results: Object.values(byStore).sort((a, b) => a.cost - b.cost),
    });
  } catch (error) {
    console.error('compareProducts error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * GET /api/categories
 */
export async function getCategories(req, res) {
  try {
    const { city = 'almaty' } = req.query;
    const tree = getCategoryTree();

    // Get counts for each category
    const counts = await Product.aggregate([
      { $match: { city } },
      { $group: { _id: { parent: '$categoryParent', child: '$categoryChild' }, count: { $sum: 1 } } },
    ]);

    const countMap = {};
    for (const c of counts) {
      const key = `${c._id.parent}__${c._id.child}`;
      countMap[key] = c.count;
      if (!countMap[c._id.parent]) countMap[c._id.parent] = 0;
      countMap[c._id.parent] += c.count;
    }

    const enriched = tree.map(cat => ({
      ...cat,
      count: countMap[cat.name] || 0,
      children: cat.children.map(child => ({
        ...child,
        count: countMap[`${cat.name}__${child.name}`] || 0,
      })).filter(child => child.count > 0),
    })).filter(cat => cat.count > 0);

    res.json({ categories: enriched });
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * GET /api/stores
 */
export async function getStores(req, res) {
  try {
    const { city = 'almaty' } = req.query;

    const stores = await Product.aggregate([
      { $match: { city } },
      {
        $group: {
          _id: '$store',
          storeName: { $first: '$storeName' },
          productCount: { $sum: 1 },
          avgPrice: { $avg: '$cost' },
        }
      },
      { $sort: { productCount: -1 } },
    ]);

    res.json({
      stores: stores.map(s => ({
        slug: s._id,
        name: s.storeName,
        productCount: s.productCount,
        avgPrice: Math.round(s.avgPrice),
        color: getStoreColor(s._id),
      })),
    });
  } catch (error) {
    console.error('getStores error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * POST /api/cart/optimize
 * Body: { items: [{ productId, title, quantity }], city }
 * Returns optimized cart with cheapest options
 */
export async function optimizeCart(req, res) {
  try {
    const { items, city = 'almaty' } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    const optimized = [];
    let totalOriginal = 0;
    let totalOptimized = 0;

    for (const item of items) {
      // Find cheapest option for this product
      const searchTerms = (item.title || '').trim().toLowerCase().split(/\s+/).slice(0, 3);
      const regex = searchTerms.map(w => `(?=.*${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).join('');

      const cheapest = await Product.findOne({
        city,
        titleLower: { $regex: regex, $options: 'i' },
      }).sort({ cost: 1 }).lean();

      // Also get the original product
      const original = await Product.findById(item.productId).lean();

      if (cheapest) {
        optimized.push({
          original: original || { title: item.title, cost: cheapest.cost },
          cheapest,
          quantity: item.quantity || 1,
          saved: original ? Math.max(0, original.cost - cheapest.cost) : 0,
        });
        totalOriginal += (original?.cost || cheapest.cost) * (item.quantity || 1);
        totalOptimized += cheapest.cost * (item.quantity || 1);
      }
    }

    // Group by store
    const storeBreakdown = {};
    for (const item of optimized) {
      const store = item.cheapest.store;
      if (!storeBreakdown[store]) {
        storeBreakdown[store] = {
          store,
          storeName: item.cheapest.storeName,
          items: [],
          subtotal: 0,
        };
      }
      storeBreakdown[store].items.push(item);
      storeBreakdown[store].subtotal += item.cheapest.cost * item.quantity;
    }

    res.json({
      optimized,
      storeBreakdown: Object.values(storeBreakdown),
      totalOriginal,
      totalOptimized,
      totalSaved: totalOriginal - totalOptimized,
    });
  } catch (error) {
    console.error('optimizeCart error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * GET /api/search/smart?q=...&city=almaty
 * AI-powered search
 */
export async function smartSearch(req, res) {
  try {
    const { q, city = 'almaty' } = req.query;
    if (!q) return res.status(400).json({ error: 'Параметр q обязателен' });

    // Import dynamically to avoid issues if OpenAI is not configured
    const { extractSearchTerms } = await import('../services/ai.service.js');
    const terms = await extractSearchTerms(q);

    const results = {};
    for (const term of terms) {
      const searchWords = term.toLowerCase().split(/\s+/);
      const regex = searchWords.map(w => `(?=.*${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).join('');

      const products = await Product.find({
        city,
        titleLower: { $regex: regex, $options: 'i' },
      })
        .sort({ cost: 1 })
        .limit(5)
        .lean();

      if (products.length > 0) {
        results[term] = products;
      }
    }

    res.json({
      query: q,
      terms,
      results,
      totalFound: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
    });
  } catch (error) {
    console.error('smartSearch error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}
