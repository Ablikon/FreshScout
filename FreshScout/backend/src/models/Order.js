import mongoose from 'mongoose';

const subOrderSchema = new mongoose.Schema({
  store: { type: String, required: true },
  storeName: { type: String, required: true },
  items: [{
    productId: String,
    title: String,
    cost: Number,
    quantity: Number,
    imageUrl: String,
    measure: String,
    url: String,
  }],
  subtotal: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'pending_manual', 'processing', 'picking', 'delivering', 'delivered', 'failed', 'cancelled'],
    default: 'pending',
  },
  externalOrderId: { type: String, default: '' },
  storeError: { type: String, default: '' },
  // For manual checkout (deep links)
  venueUrl: { type: String, default: '' },
  deepLinks: { type: Array, default: [] },
  message: { type: String, default: '' },
}, { _id: true, timestamps: true });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Delivery
  address: { type: String, required: true },
  apartment: { type: String, default: '' },
  entrance: { type: String, default: '' },
  floor: { type: String, default: '' },
  comment: { type: String, default: '' },
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true },

  // Payment
  paymentMethod: { type: String, enum: ['cash', 'card'], default: 'cash' },

  // Orders per store
  subOrders: [subOrderSchema],
  total: { type: Number, required: true },
  savings: { type: Number, default: 0 },
  city: { type: String, required: true },

  status: {
    type: String,
    enum: ['pending', 'processing', 'partially_done', 'delivered', 'cancelled'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
