import express from 'express';
import { register, login, refresh, me } from '../controllers/authController.js';
import { validate, schemas } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, validate(schemas.register), register);
router.post('/login', authLimiter, validate(schemas.login), login);
router.post('/refresh', refresh);

// Protected routes
router.get('/me', authenticate, me);

export default router;
