import express from 'express';
import { getAdminMetrics, getVoiceAuditStream } from '../controllers/adminController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/metrics', getAdminMetrics);
router.get('/audit', getVoiceAuditStream);

export default router;
