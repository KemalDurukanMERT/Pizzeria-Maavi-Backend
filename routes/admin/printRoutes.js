import express from 'express';
import { getPreview, getPrinters, setPrinter, testPrint } from '../../controllers/admin/printController.js';
import { authenticateAdmin, requireRole } from '../../middleware/adminAuth.js';

const router = express.Router();

router.post('/test', testPrint);

router.use(authenticateAdmin);

router.get('/list', getPrinters);
router.get('/preview', getPreview);
router.post('/set', requireRole('OWNER', 'MANAGER'), setPrinter);

export default router;
