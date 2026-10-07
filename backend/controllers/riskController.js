import { evaluateTransactionRisk } from '../services/riskEngine.js';
import db from '../dataStore.js';

/**
 * Controller for Central Risk Analysis Endpoint
 * POST /api/risk/analyze
 */
export const analyzeRisk = (req, res, next) => {
  try {
    const userId = req.user?.id || 'usr_imran_001';
    const user = db.getUser(userId) || {};

    const {
      amount = 500,
      recipient = 'রাকিব',
      recipientIsNew = false,
      hour,
      day,
      speakerType = 'owner',
      isSpoofSimulated = false,
      audioFeatures = null,
      isStrictMode = false,
      transaction = {},
      voice = {},
    } = req.body;

    // Normal baseline stats from user
    const userTxns = db.getAll('transactions').filter((t) => t.userId === userId && t.type === 'send_money');
    const userAvg = userTxns.length > 0
      ? userTxns.reduce((sum, t) => sum + (t.amount || 0), 0) / userTxns.length
      : 450;

    const evaluation = evaluateTransactionRisk({
      transaction: {
        amount: transaction.amount !== undefined ? transaction.amount : amount,
        recipient: transaction.recipient !== undefined ? transaction.recipient : recipient,
        recipientIsNew: transaction.recipientIsNew !== undefined ? transaction.recipientIsNew : recipientIsNew,
        hour: transaction.hour !== undefined ? transaction.hour : hour,
        day: transaction.day !== undefined ? transaction.day : day,
      },
      voice: {
        speakerType: voice.speakerType || speakerType,
        isSpoofSimulated: voice.isSpoofSimulated !== undefined ? voice.isSpoofSimulated : isSpoofSimulated,
        audioFeatures: voice.audioFeatures || audioFeatures,
      },
      userProfile: {
        averageAmount: userAvg,
        stdAmount: 160,
        isStrictMode: Boolean(isStrictMode || user.isStrictMode),
      },
    });

    res.json({
      success: true,
      data: evaluation,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  analyzeRisk,
};
