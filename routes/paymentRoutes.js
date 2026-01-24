import express from 'express';
import { initiatePayment, handleWebhook, getPaymentStatus } from '../controllers/paymentController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Initiate payment
router.post('/initiate', optionalAuth, initiatePayment);

// Payment provider webhooks (no auth - verified by signature)
router.post('/webhook/:provider', express.raw({ type: 'application/json' }), handleWebhook);

// Get payment status
router.get('/:orderId', optionalAuth, getPaymentStatus);

export default router;
