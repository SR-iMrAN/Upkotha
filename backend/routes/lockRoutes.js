import express from 'express';
import { getLocks, createLock, unlockMoney } from '../controllers/lockController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getLocks);
router.post('/', createLock);
router.post('/:id/unlock', unlockMoney);

export default router;
