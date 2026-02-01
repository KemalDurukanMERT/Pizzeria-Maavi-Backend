import express from 'express';
import { createOrder, getOrder, getUserOrders } from '../controllers/orderController.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { orderLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Create order (authenticated or guest)
router.post('/', orderLimiter, optionalAuth, validate(schemas.createOrder), createOrder);

// Get user's order history (requires auth)
router.get('/my-orders', authenticate, getUserOrders);
router.get('/user/history', authenticate, getUserOrders);

// Get order by ID (optional auth for guest orders)
router.get('/:id', optionalAuth, getOrder);

export default router;
