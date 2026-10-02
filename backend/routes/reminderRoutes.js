import express from 'express';
import { getReminders, completeReminder } from '../controllers/reminderController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getReminders);
router.post('/:id/complete', completeReminder);

export default router;
