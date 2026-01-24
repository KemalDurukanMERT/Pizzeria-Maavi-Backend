import express from 'express';
import { getAllCustomers, toggleUserStatus } from '../../controllers/admin/userController.js';
import { authenticateAdmin, requireRole } from '../../middleware/adminAuth.js';

const router = express.Router();

router.use(authenticateAdmin);

router.get('/', getAllCustomers);
router.patch('/:id/status', requireRole('OWNER', 'MANAGER'), toggleUserStatus);

export default router;
