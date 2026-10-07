import express from 'express';

import {
  recordImpactEvent,
  getImpactMetrics,
} from '../controllers/impactController.js';

import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

// Record one customer-impact event
router.post('/event', recordImpactEvent);

// Read aggregated customer-impact metrics
router.get('/metrics', getImpactMetrics);

export default router;