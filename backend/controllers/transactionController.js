import db from '../dataStore.js';
import { stageTransaction, commitTransaction } from '../services/transactionEngine.js';

export const getTransactions = (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, limit } = req.query;

    let txns = db.getAll('transactions').filter(t => t.userId === userId);

    if (type) {
      txns = txns.filter(t => t.type === type);
    }

    if (limit) {
      txns = txns.slice(0, parseInt(limit, 10));
    }

    res.json({
      success: true,
      count: txns.length,
      transactions: txns,
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
    const { type = 'send_money', recipient, agent, amount } = req.body;
    const user = req.user;

    const staged = stageTransaction({
      userId: user.id,
      type,
      recipient,
      agent,
      amount,
      isStrictMode: user.isStrictMode,
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

export const explainTransaction = (req, res, next) => {
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

    const explanation = txn.explanationBangla ||
      `আপনার ${txn.dateDisplay} তারিখে ${txn.title} বাবদ ৳${txn.amount} টাকা সফলভাবে লেনদেন হয়েছে।`;

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
