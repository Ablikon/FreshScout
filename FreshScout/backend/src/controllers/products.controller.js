import Product from '../models/Product.js';
import { getCategoryTree, getStoreColor } from '../config/categories.js';

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

    if (search) {
      const searchTerms = search.trim().toLowerCase().split(/\s+/);
      filter.$and = searchTerms.map(term => {
        // Escape regex special chars
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Use word-boundary-like matching: term must be at start of word
        // For Cyrillic, we use (^|[^а-яёa-z0-9]) as word boundary
        return {
          titleLower: { $regex: `(^|[^а-яёa-z0-9])${escaped}`, $options: 'i' }
        };
      });
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

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

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
 * GET /api/products/:id
 */
export async function getProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    // Find similar products from other stores (same category, similar title)
    const titleWords = product.titleLower.split(/\s+/).slice(0, 3);
    const regex = titleWords.map(w => `(?=.*${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).join('');

    const alternatives = await Product.find({
      _id: { $ne: product._id },
      city: product.city,
      titleLower: { $regex: regex, $options: 'i' },
    })
      .sort({ cost: 1 })
      .limit(10)
      .lean();

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
