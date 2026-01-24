import express from 'express';
import { login, verify } from '../../controllers/admin/authController.js';
import { validate, schemas } from '../../middleware/validation.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';

const router = express.Router();

// Admin login
router.post('/login', authLimiter, validate(schemas.login), login);

// Verify admin token
router.get('/verify', authenticateAdmin, verify);

export default router;
