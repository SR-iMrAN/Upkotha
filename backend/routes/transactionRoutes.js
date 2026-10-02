import express from 'express';
import {
  getTransactions,
  getTransactionById,
  validateTransaction,
  executeSendMoney,
  executeCashOut,
  explainTransaction,
} from '../controllers/transactionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.post('/validate', validateTransaction);
router.post('/send', executeSendMoney);
router.post('/cashout', executeCashOut);
router.post('/:id/explain', explainTransaction);

export default router;
