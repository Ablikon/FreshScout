/**
 * Orders Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { 
  createOrderHandler, 
  getOrdersHandler, 
  getOrderHandler,
  checkDeliveryHandler,
  addressAutocompleteHandler
} from '../controllers/orders.controller.js';

const router = Router();

// Public endpoints (no auth required)
router.get('/address-autocomplete', addressAutocompleteHandler);
router.post('/check-delivery', checkDeliveryHandler);

// All other order routes require authentication
router.use(authMiddleware);

// Create order
router.post('/', createOrderHandler);

// Get user's orders
router.get('/', getOrdersHandler);

// Get single order
router.get('/:id', getOrderHandler);

export default router;
