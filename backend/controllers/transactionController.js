import db from '../dataStore.js';
import { stageTransaction, commitTransaction } from '../services/transactionEngine.js';
import { explainTransactionWithGemini } from '../services/geminiService.js';

export const getTransactions = (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, category, month, search, q, limit } = req.query;

    const allUserTxns = db.getAll('transactions').filter(t => t.userId === userId);
    let txns = [...allUserTxns];

    if (type && type !== 'all') {
      txns = txns.filter(t => t.type === type);
    }

    if (category && category !== 'all') {
      txns = txns.filter(t => t.categoryKey === category || t.category === category);
    }

    if (month && month !== 'all') {
      txns = txns.filter(t => t.month === month || (t.date && t.date.startsWith(month)));
    }

    const searchQuery = (search || q || '').trim().toLowerCase();
    if (searchQuery) {
      txns = txns.filter(t => {
        const title = (t.title || '').toLowerCase();
        const recipient = (t.recipient || '').toLowerCase();
        const recipientPhone = (t.recipientPhone || '').toLowerCase();
        const recipientCode = (t.recipientCode || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const dateDisplay = (t.dateDisplay || '').toLowerCase();
        const id = (t.id || '').toLowerCase();
        return (
          title.includes(searchQuery) ||
          recipient.includes(searchQuery) ||
          recipientPhone.includes(searchQuery) ||
          recipientCode.includes(searchQuery) ||
          cat.includes(searchQuery) ||
          dateDisplay.includes(searchQuery) ||
          id.includes(searchQuery)
        );
      });
    }

    // Spending Analytics Calculation
    const totalSpent = txns
      .filter(t => t.type !== 'received')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalFees = txns.reduce((sum, t) => sum + (t.fee || 0), 0);
    const totalInflow = txns
      .filter(t => t.type === 'received')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const spendingByCategory = {
      personal: txns
        .filter(t => t.categoryKey === 'personal' || t.type === 'send_money')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      utilities: txns
        .filter(t => t.categoryKey === 'utilities' || t.type === 'bill_pay')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      cash_out: txns
        .filter(t => t.categoryKey === 'cash_out' || t.type === 'cash_out')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
    };

    if (limit) {
      txns = txns.slice(0, parseInt(limit, 10));
    }

    res.json({
      success: true,
      count: txns.length,
      transactions: txns,
      analytics: {
        totalSpent,
        totalFees,
        totalInflow,
        spendingByCategory,
        availableBalance: req.user.availableBalance,
        lockedBalance: req.user.lockedBalance,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getTransactionById = (req, res, next) => {
  try {
    const { id } = req.params;
    const txn = db.getById('transactions', id);

    if (!txn) {
      return res.status(404).json({
        success: false,
        error: 'TRANSACTION_NOT_FOUND',
        message: 'নির্দিষ্ট লেনদেনটি পাওয়া যায়নি।',
      });
    }

    res.json({
      success: true,
      transaction: txn,
    });
  } catch (err) {
    next(err);
  }
};

export const validateTransaction = (req, res, next) => {
  try {
    const { type = 'send_money', recipient, agent, amount, voiceBiometric } = req.body;
    const user = req.user;

    const staged = stageTransaction({
      userId: user.id,
      type,
      recipient,
      agent,
      amount,
      isStrictMode: user.isStrictMode,
      voiceBiometric,
    });

    res.json({
      success: true,
      staged: true,
      ...staged,
    });
  } catch (err) {
    next(err);
  }
};

export const executeSendMoney = (req, res, next) => {
  try {
    const { stageId, recipient, amount, pin } = req.body;
    const user = req.user;

    const result = commitTransaction({
      stageId,
      pin,
      userId: user.id,
      directPayload: {
        type: 'send_money',
        recipient,
        amount,
      },
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const executeCashOut = (req, res, next) => {
  try {
    const { stageId, agent, amount, pin } = req.body;
    const user = req.user;

    const result = commitTransaction({
      stageId,
      pin,
      userId: user.id,
      directPayload: {
        type: 'cash_out',
        agent,
        amount,
      },
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const explainTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const txn = db.getById('transactions', id);

    if (!txn) {
      return res.status(404).json({
        success: false,
        error: 'TRANSACTION_NOT_FOUND',
        message: 'লেনদেনটি পাওয়া যায়নি।',
      });
    }

    const explanation = await explainTransactionWithGemini(txn);

    res.json({
      success: true,
      transactionId: txn.id,
      title: txn.title,
      explanation,
    });
  } catch (err) {
    next(err);
  }
};
