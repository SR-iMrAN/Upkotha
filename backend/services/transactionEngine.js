import db from '../dataStore.js';
import { evaluateTransactionRisk } from './riskEngine.js';

// In-memory staged transactions cache with 5-minute TTL
const stagedTickets = new Map();

// Configuration limits
export const TRANSACTION_LIMITS = {
  MIN_AMOUNT: 10,
  MAX_SINGLE_AMOUNT: 25000,
  CASH_OUT_FEE_RATE: 0.01, // 1%
  ANOMALY_THRESHOLD: 5000, // Transfers >= 5000 BDT trigger behavioral caution
};

/**
 * Validates and stages a transaction without modifying any ledger balances.
 * AI never touches this logic; this is strictly deterministic business logic.
 */
export const stageTransaction = ({
  userId = 'usr_imran_001',
  type = 'send_money',
  recipient,
  agent,
  amount,
  isStrictMode = false,
  voiceBiometric,
}) => {
  const user = db.getUser(userId);
  if (!user) {
    throw { statusCode: 404, message: 'ব্যবহারকারীর তথ্য পাওয়া যায়নি।' };
  }

  const numAmount = Number(amount);

  // 1. Amount validation
  if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
    throw {
      statusCode: 400,
      code: 'INVALID_AMOUNT',
      customMessage: 'অনুগ্রহ করে সঠিক টাকার পরিমাণ উল্লেখ করুন (কমপক্ষে ১০ টাকা)।',
    };
  }

  if (numAmount < TRANSACTION_LIMITS.MIN_AMOUNT) {
    throw {
      statusCode: 400,
      code: 'AMOUNT_BELOW_MINIMUM',
      customMessage: `সর্বনিম্ন লেনদেনের পরিমাণ ৳${TRANSACTION_LIMITS.MIN_AMOUNT} টাকা।`,
    };
  }

  if (numAmount > TRANSACTION_LIMITS.MAX_SINGLE_AMOUNT) {
    throw {
      statusCode: 400,
      code: 'AMOUNT_EXCEEDS_MAXIMUM',
      customMessage: `একক লেনদেনের সর্বোচ্চ সীমা ৳${TRANSACTION_LIMITS.MAX_SINGLE_AMOUNT} টাকা।`,
    };
  }

  // Calculate fees
  const fee = type === 'cash_out' ? Math.round(numAmount * TRANSACTION_LIMITS.CASH_OUT_FEE_RATE) : 0;
  const totalDeduction = numAmount + fee;

  // 2. Strict Locked Money & Balance Isolation Validation
  if (totalDeduction > user.availableBalance) {
    if (totalDeduction <= user.totalBalance) {
      // User has enough total money, but part of it is locked
      throw {
        statusCode: 400,
        code: 'LOCKED_MONEY_CONFLICT',
        customMessage: `আপনার মোট ব্যালেন্স ৳${user.totalBalance} হলেও ৳${user.lockedBalance} জরুরি সঞ্চয়ে লক করা রয়েছে। উপলব্ধ ব্যালেন্স: ৳${user.availableBalance}। লক করা টাকা ছাড়া লেনদেন সম্ভব নয়।`,
      };
    } else {
      throw {
        statusCode: 400,
        code: 'INSUFFICIENT_BALANCE',
        customMessage: `আপনার ব্যবহারের জন্য পর্যাপ্ত ব্যালেন্স নেই। বর্তমান উপলব্ধ ব্যালেন্স: ৳${user.availableBalance}।`,
      };
    }
  }

  // 3. Recipient / Agent Resolution
  let targetDisplayName = recipient || 'অজ্ঞাত প্রাপক';
  let targetPhone = '';
  let targetCode = '';
  let matchedContact = null;

  if (type === 'send_money') {
    if (!recipient) {
      throw {
        statusCode: 400,
        code: 'MISSING_RECIPIENT',
        customMessage: 'যাকে টাকা পাঠাতে চান তার নাম অথবা মোবাইল নম্বর দিন।',
      };
    }

    matchedContact = db.findContact(user.id, recipient);
    if (matchedContact) {
      targetDisplayName = matchedContact.name;
      targetPhone = matchedContact.phone;
    } else {
      // Validate raw 11 digit MSISDN
      const cleanPhone = recipient.replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 10) {
        targetDisplayName = recipient;
        targetPhone = recipient;
      } else {
        targetDisplayName = recipient;
        targetPhone = 'প্রদত্ত নম্বর';
      }
    }
  } else if (type === 'cash_out') {
    const matchedAgent = db.findAgent(agent || recipient);
    if (matchedAgent) {
      targetDisplayName = matchedAgent.name;
      targetPhone = matchedAgent.phone;
      targetCode = matchedAgent.agentCode;
    } else {
      targetDisplayName = agent || recipient || 'এজেন্ট পয়েন্ট';
      targetPhone = 'এজেন্ট নম্বর';
    }
  }

  // 4. ML Behavioral Anomaly and Multi-Factor Security Intelligence Layer
  const isStrictActive = Boolean(isStrictMode || user.isStrictMode);
  const recipientIsNew = type === 'send_money' ? !matchedContact : false;
  
  // Historical stats from user transactions
  const userTxns = db.getAll('transactions').filter(t => t.userId === user.id && t.type === 'send_money');
  const userAvg = userTxns.length > 0 
    ? userTxns.reduce((sum, t) => sum + (t.amount || 0), 0) / userTxns.length 
    : 450;

  const riskAssessment = evaluateTransactionRisk({
    transaction: {
      amount: numAmount,
      recipient: targetDisplayName,
      recipientIsNew,
      recipientFrequency: matchedContact ? 8 : 0,
      hour: new Date().getHours(),
      day: new Date().getDay(),
      dailyCount: 2,
      dailyTotal: numAmount,
    },
    voice: {
      speakerType: voiceBiometric?.isVerified === false ? 'imposter' : 'owner',
      isSpoofSimulated: voiceBiometric?.antiSpoofStatus === 'SYNTHETIC_SPOOF_DETECTED',
      audioFeatures: voiceBiometric?.audioFeatures || null,
    },
    userProfile: {
      averageAmount: userAvg,
      stdAmount: 160,
      isStrictMode: isStrictActive,
    },
  });

  // Construct backward-compatible anomalySignal for existing UI components
  let anomalySignal = null;
  if (riskAssessment.riskLevel === 'HIGH') {
    anomalySignal = {
      level: 'WARNING',
      title: 'উচ্চ ঝুঁকি নিরাপত্তা সংকেত (High Risk Alert)',
      messageBangla: riskAssessment.signals[0]?.detail || `সতর্কতা: ৳${new Intl.NumberFormat('bn-BD').format(numAmount)} টাকার লেনদেনটিতে অস্বাভাবিক ঝুঁকি শনাক্ত হয়েছে।`,
      requiresDoubleConfirmation: true,
      requiresBiometricChallenge: true,
    };
  } else if (riskAssessment.riskLevel === 'MEDIUM') {
    anomalySignal = {
      level: 'CAUTION',
      title: 'মাঝারি ঝুঁকি সতর্কতা (Moderate Caution)',
      messageBangla: riskAssessment.signals[0]?.detail || `সতর্কতা: '${targetDisplayName}'-এর লেনদেনটি সম্পন্ন করতে তথ্য পুনরায় যাচাই করুন।`,
      requiresDoubleConfirmation: true,
      requiresBiometricChallenge: false,
    };
  } else if (isStrictActive) {
    anomalySignal = {
      level: 'INFO',
      title: 'স্ট্রিক্ট মোড সুরক্ষা সক্রিয়',
      messageBangla: 'স্ট্রিক্ট মোড সুরক্ষা সক্রিয় রয়েছে। প্রতিটি পদক্ষেপে আপনার অনুমোদন ও ৪ ডিজিটের পিন আবশ্যক।',
      requiresDoubleConfirmation: false,
      requiresBiometricChallenge: false,
    };
  }

  // 5. Generate Staged Ticket with 5-minute TTL
  const stageId = `stg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = Date.now() + 5 * 60 * 1000;

  const stagedData = {
    stageId,
    userId: user.id,
    type,
    recipient: targetDisplayName,
    recipientPhone: targetPhone,
    recipientCode: targetCode,
    amount: numAmount,
    fee,
    totalDeduction,
    currentAvailable: user.availableBalance,
    postBalance: user.availableBalance - totalDeduction,
    anomalySignal,
    riskAssessment,
    voiceBiometric: voiceBiometric || {
      isVerified: riskAssessment.breakdown.speakerVerification.matched,
      confidence: riskAssessment.breakdown.speakerVerification.similarityPercent,
      speaker: user.voiceProfile?.primarySpeaker || user.name || 'ইমরান হোসেন',
      antiSpoofStatus: riskAssessment.breakdown.spoofDetection.signalType,
      spoofPercent: riskAssessment.breakdown.spoofDetection.spoofPercent,
    },
    expiresAt,
    requiresPin: true,
  };

  stagedTickets.set(stageId, stagedData);

  // Auto clean up after expiry
  setTimeout(() => {
    stagedTickets.delete(stageId);
  }, 5 * 60 * 1000);

  return stagedData;
};

/**
 * Executes the simulated transaction after secure human PIN verification.
 * AI CANNOT execute this; only valid user PIN verification triggers this ledger update.
 */
export const commitTransaction = ({
  stageId,
  pin,
  userId = 'usr_imran_001',
  directPayload,
}) => {
  const user = db.getUser(userId);
  if (!user) {
    throw { statusCode: 404, message: 'ব্যবহারকারী পাওয়া যায়নি।' };
  }

  // 1. PIN Verification
  if (!pin || pin.toString() !== user.pin.toString()) {
    throw {
      statusCode: 401,
      code: 'INVALID_PIN',
      customMessage: 'ভুল পিন কোড দেওয়া হয়েছে। অনুগ্রহ করে সঠিক ৪ ডিজিটের পিন দিন (ডেমো পিন: 1234)।',
    };
  }

  // 2. Retrieve Staged Data or create atomic fallback
  let txnData = stagedTickets.get(stageId);

  if (!txnData && directPayload) {
    // Stage on the fly if user directly submits confirmed data
    txnData = stageTransaction({
      userId,
      type: directPayload.type,
      recipient: directPayload.recipient,
      agent: directPayload.agent,
      amount: directPayload.amount,
      isStrictMode: user.isStrictMode,
    });
  }

  if (!txnData) {
    throw {
      statusCode: 400,
      code: 'EXPIRED_SESSION',
      customMessage: 'লেনদেনের সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার শুরু করুন।',
    };
  }

  // Re-verify balance at commit time
  if (txnData.totalDeduction > user.availableBalance) {
    throw {
      statusCode: 400,
      code: 'INSUFFICIENT_BALANCE',
      customMessage: 'ব্যবহারযোগ্য ব্যালেন্স পর্যাপ্ত নেই।',
    };
  }

  // 3. Atomic Balance Deduction
  const updatedAvailable = user.availableBalance - txnData.totalDeduction;
  db.updateUserBalances(user.id, { availableBalance: updatedAvailable });

  // 4. Record in Synthetic Ledger
  const now = new Date();
  const txnId = `TXN-${now.getFullYear()}-${Date.now().toString().slice(-6)}`;
  const dateDisplay = 'আজ, এইমাত্র';

  let title = `${txnData.recipient} (Send Money)`;
  let category = 'ব্যক্তিগত';
  let categoryKey = 'personal';
  let explanationBangla = `আপনার এইমাত্র ${txnData.recipient}-কে ৳${txnData.amount} টাকা সফলভাবে পাঠানো হয়েছে। কোনো অতিরিক্ত ফি নেওয়া হয়নি।`;

  if (txnData.type === 'cash_out') {
    title = `${txnData.recipient} (Cash Out)`;
    category = 'ক্যাশ আউট';
    categoryKey = 'cash_out';
    explanationBangla = `আপনার এইমাত্র ${txnData.recipient} থেকে ৳${txnData.amount} টাকার ক্যাশ আউট সম্পন্ন হয়েছে। সার্ভিস চার্জ: ৳${txnData.fee}।`;
  }

  const transactionRecord = {
    id: txnId,
    userId: user.id,
    title,
    recipient: txnData.recipient,
    recipientPhone: txnData.recipientPhone,
    recipientCode: txnData.recipientCode || '',
    type: txnData.type,
    amount: txnData.amount,
    fee: txnData.fee,
    currency: 'BDT',
    date: now.toISOString(),
    dateDisplay,
    category,
    categoryKey,
    status: 'COMPLETED',
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    explanationBangla,
  };

  db.insert('transactions', transactionRecord);

  // Consume staged ticket
  if (stageId) stagedTickets.delete(stageId);

  // 5. Generate Complete Simulated Receipt
  return {
    success: true,
    message: txnData.type === 'cash_out'
      ? `${txnData.recipient} থেকে ৳${txnData.amount} টাকা ক্যাশ আউট সফল হয়েছে!`
      : `${txnData.recipient}-কে ৳${txnData.amount} টাকা সফলভাবে পাঠানো হয়েছে!`,
    receipt: {
      transactionId: txnId,
      timestamp: now.toISOString(),
      dateDisplay,
      type: txnData.type,
      recipient: txnData.recipient,
      recipientPhone: txnData.recipientPhone,
      amount: txnData.amount,
      fee: txnData.fee,
      totalDeduction: txnData.totalDeduction,
      newAvailableBalance: updatedAvailable,
      lockedBalance: user.lockedBalance,
      newTotalBalance: updatedAvailable + user.lockedBalance,
      status: 'COMPLETED',
      isSimulated: true,
      explanationBangla,
    },
    transaction: transactionRecord,
    newBalance: {
      available: updatedAvailable,
      locked: user.lockedBalance,
      total: updatedAvailable + user.lockedBalance,
    },
  };
};
