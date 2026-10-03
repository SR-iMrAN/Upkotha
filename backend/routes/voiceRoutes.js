import express from 'express';
import {
  getVoiceProfile,
  verifySpeaker,
  enrollVoice,
  getVoiceLogs,
  handleOnboardGreeting,
} from '../controllers/voiceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public onboarding greeting helper (for registration step-by-step guidance)
router.post('/onboard-greeting', handleOnboardGreeting);

router.use(requireAuth);

router.get('/profile', getVoiceProfile);
router.post('/verify', verifySpeaker);
router.post('/enroll', enrollVoice);
router.get('/logs', getVoiceLogs);

export default router;
