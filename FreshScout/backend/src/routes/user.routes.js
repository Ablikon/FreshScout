import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getProfile, updateProfile, getOrders, createOrder } from '../controllers/user.controller.js';

const router = Router();

router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, updateProfile);
router.get('/orders', authMiddleware, getOrders);
router.post('/orders', authMiddleware, createOrder);

export default router;
