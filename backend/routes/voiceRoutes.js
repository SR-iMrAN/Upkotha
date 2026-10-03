import express from 'express';
import {
  getVoiceProfile,
  verifySpeaker,
  enrollVoice,
  getVoiceLogs,
} from '../controllers/voiceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/profile', getVoiceProfile);
router.post('/verify', verifySpeaker);
router.post('/enroll', enrollVoice);
router.get('/logs', getVoiceLogs);

export default router;
