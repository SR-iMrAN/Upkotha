import express from 'express';
import { verifySpeaker } from '../controllers/voiceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.post('/verify', verifySpeaker);

export default router;
