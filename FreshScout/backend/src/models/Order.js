import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: String,
    title: String,
    store: String,
    storeName: String,
    cost: Number,
    quantity: Number,
    imageUrl: String,
  }],
  storeBreakdown: [{
    store: String,
    storeName: String,
    itemCount: Number,
    subtotal: Number,
  }],
  total: { type: Number, required: true },
  savings: { type: Number, default: 0 },
  city: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'delivered', 'cancelled'],
    default: 'pending' 
  },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
