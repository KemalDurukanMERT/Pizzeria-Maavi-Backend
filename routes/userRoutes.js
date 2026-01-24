import express from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
