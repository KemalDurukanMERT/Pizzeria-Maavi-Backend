import express from 'express';
import {
    getAllOrders,
    updateOrderStatus,
    getOrderStats,
} from '../../controllers/admin/orderController.js';
import { authenticateAdmin, requireRole } from '../../middleware/adminAuth.js';
import { validate, schemas } from '../../middleware/validation.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Get all orders
router.get('/', getAllOrders);

// Get order statistics
router.get('/stats', getOrderStats);

// Update order status
router.patch('/:id/status', validate(schemas.updateOrderStatus), updateOrderStatus);

export default router;
