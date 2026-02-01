import express from 'express';
import { handleOrderStatusWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// Public webhook endpoint (internally verified via secret)
router.post('/order-status', handleOrderStatusWebhook);

export default router;
