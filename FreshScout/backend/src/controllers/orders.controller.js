import Order from "../models/Order.js";

export async function getOrders(req, res) {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
}

export async function createOrder(req, res) {
  const order = await Order.create(req.body);
  res.status(201).json(order);
}
