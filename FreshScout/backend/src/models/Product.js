import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // Original fields from API
  sourceId: { type: String, index: true },          // e.g. "arbuz_kz_almaty_mapped"
  productId: { type: String, required: true },       // original product_id
  title: { type: String, required: true, index: true },
  titleLower: { type: String, index: true },         // lowercase for search
  cost: { type: Number, required: true, index: true },
  prevCost: { type: Number, default: 0 },
  description: { type: String, default: '' },
  url: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  brand: { type: String, default: '', index: true },
  measure: { type: String, default: '' },
  originalCategory: { type: String, default: '' },

  // Unified fields
  store: { type: String, required: true, index: true },       // "arbuz", "magnum", etc
  storeName: { type: String, required: true },                 // "Arbuz", "Magnum", etc
  city: { type: String, required: true, index: true },         // "almaty" | "astana"
  categoryParent: { type: String, index: true },               // unified parent
  categoryChild: { type: String, index: true },                // unified child

  // Computed
  discount: { type: Number, default: 0 },           // percentage discount
  pricePerUnit: { type: String, default: '' },       // normalized price display

  // Timestamps
  scrapedAt: { type: Date },
  syncedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Compound indexes for common queries
productSchema.index({ city: 1, categoryParent: 1, cost: 1 });
productSchema.index({ city: 1, store: 1 });
productSchema.index({ titleLower: 'text' });
productSchema.index({ city: 1, categoryParent: 1, categoryChild: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
