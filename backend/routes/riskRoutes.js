import express from 'express';
import { analyzeRisk } from '../controllers/riskController.js';

const router = express.Router();

// Allow public or authenticated risk assessment evaluation (useful for judge demo scenarios and tests)
router.post('/analyze', analyzeRisk);

export default router;
