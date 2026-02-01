import express from 'express';
import { getPendingJobs, claimJob, updateJobStatus, getJobDetails } from '../controllers/printJobController.js';
import config from '../config/config.js';

const router = express.Router();

// Simple API Key Middleware for the Agent
const authenticateAgent = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const PRINTER_SECRET = process.env.PRINTER_SECRET_KEY || config.jwt.secret;

    if (apiKey === PRINTER_SECRET) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid Agent Key' });
};

router.use(authenticateAgent);

router.get('/jobs/pending', getPendingJobs);
router.get('/jobs/:id', getJobDetails);
router.post('/jobs/:id/claim', claimJob);
router.post('/jobs/:id/status', updateJobStatus);

export default router;
