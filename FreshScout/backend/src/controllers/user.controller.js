import Order from '../models/Order.js';
import User from '../models/User.js';
import { placeStoreOrders } from '../services/storeProxy.service.js';

/**
 * GET /api/me
 */
export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    res.json({
      id: user._id,
      phone: user.phone,
      name: user.name,
      city: user.city,
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * PUT /api/me
 */
export async function updateProfile(req, res) {
  try {
    const { name, city } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (city !== undefined) update.city = city;

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).lean();
    res.json({
      id: user._id,
      phone: user.phone,
      name: user.name,
      city: user.city,
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * GET /api/orders
 */
export async function getOrders(req, res) {
  try {
    const orders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

/**
 * POST /api/orders
 */
export async function createOrder(req, res) {
  try {
    const {
      items, total, savings, city,
      address, apartment, entrance, floor, comment,
      contactName, contactPhone, paymentMethod,
    } = req.body;

    if (!address || !contactName || !contactPhone) {
      return res.status(400).json({ error: 'Заполните адрес и контактные данные' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    // Group items by store → subOrders
    const byStore = {};
    for (const item of items) {
      const st = item.store;
      if (!byStore[st]) {
        byStore[st] = { store: st, storeName: item.storeName, items: [], subtotal: 0 };
      }
      byStore[st].items.push({
        productId: item.productId || item._id,
        title: item.title,
        cost: item.cost,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        measure: item.measure,
        url: item.url,
      });
      byStore[st].subtotal += item.cost * item.quantity;
    }

    const subOrders = Object.values(byStore).map(g => ({
      ...g,
      status: 'pending',
    }));

    const order = await Order.create({
      userId: req.userId,
      address,
      apartment: apartment || '',
      entrance: entrance || '',
      floor: floor || '',
      comment: comment || '',
      contactName,
      contactPhone,
      paymentMethod: paymentMethod || 'cash',
      subOrders,
      total,
      savings: savings || 0,
      city: city || 'almaty',
      status: 'pending',
    });

    // Trigger store proxy ordering in background (don't await — return order immediately)
    placeStoreOrders(order).catch(err => {
      console.error('Store proxy error:', err);
    });

    res.status(201).json({ order });
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ error: 'Ошибка создания заказа' });
  }
}
