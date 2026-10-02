import express from 'express';
import { extractIntent, getInsights } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.post('/intent', extractIntent);
router.post('/insights', getInsights);

export default router;
