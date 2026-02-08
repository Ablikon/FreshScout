import Order from '../models/Order.js';
import User from '../models/User.js';

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
    const { items, storeBreakdown, total, savings, city } = req.body;
    const order = await Order.create({
      userId: req.userId,
      items,
      storeBreakdown,
      total,
      savings,
      city,
    });
    res.status(201).json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}
