import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import upload from '../middleware/upload.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Upload image (Admin only)
router.post('/', authenticateAdmin, upload.single('image'), uploadImage);

export default router;
