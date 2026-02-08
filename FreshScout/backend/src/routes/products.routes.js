import { Router } from 'express';
import {
  getProducts,
  getProduct,
  compareProducts,
  getCategories,
  getStores,
  optimizeCart,
  smartSearch,
} from '../controllers/products.controller.js';

const router = Router();

router.get('/products', getProducts);
router.get('/products/compare', compareProducts);
router.get('/products/:id', getProduct);
router.get('/categories', getCategories);
router.get('/stores', getStores);
router.post('/cart/optimize', optimizeCart);
router.get('/search/smart', smartSearch);

export default router;
