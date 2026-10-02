import db from '../dataStore.js';

export const getTransactions = (req, res) => {
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
};

export const getTransactionById = (req, res) => {
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
};

export const validateTransaction = (req, res) => {
  const { type = 'send_money', recipient, agent, amount } = req.body;
  const user = req.user;
  const parsedAmount = Number(amount);

  if (!parsedAmount || parsedAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_AMOUNT',
      message: 'সঠিক টাকার পরিমাণ উল্লেখ করুন।',
    });
  }

  // 1. Balance validation against Available Balance (Locked money protected)
  if (parsedAmount > user.availableBalance) {
    return res.status(400).json({
      success: false,
      error: 'INSUFFICIENT_BALANCE',
      message: `আপনার ব্যবহারের জন্য পর্যাপ্ত ব্যালেন্স নেই। বর্তমান উপলব্ধ ব্যালেন্স: ৳${user.availableBalance} (লক করা ৳${user.lockedBalance} অক্ষত রয়েছে)`,
    });
  }

  // 2. Resolve recipient or agent
  let targetName = recipient;
  let targetPhone = '';

  if (type === 'send_money') {
    const matchedContact = db.findContact(user.id, recipient);
    if (matchedContact) {
      targetName = matchedContact.name;
      targetPhone = matchedContact.phone;
    }
  } else if (type === 'cash_out') {
    const matchedAgent = db.findAgent(agent || recipient);
    if (matchedAgent) {
      targetName = matchedAgent.name;
      targetPhone = matchedAgent.phone;
    }
  }

  // 3. Behavioral safety signal / anomaly detection
  const isHigherThanNormal = parsedAmount >= 5000;
  let anomalySignal = null;

  if (isHigherThanNormal || user.isStrictMode) {
    anomalySignal = {
      severity: isHigherThanNormal ? 'warning' : 'info',
      messageBangla: isHigherThanNormal
        ? `সতর্কতা: ৳${parsedAmount} আপনার স্বাভাবিক খরচের চেয়ে বেশি। অনুগ্রহ করে প্রাপকের তথ্য নিশ্চিত করুন।`
        : 'স্ট্রিক্ট মোড সক্রিয় রয়েছে। লেনদেন নিশ্চিত করতে পিন প্রদান করুন।',
    };
  }

  const fee = type === 'cash_out' ? Math.round(parsedAmount * 0.01) : 0;
  const stageId = `stg_${Date.now()}`;

  res.json({
    success: true,
    staged: true,
    stageId,
    type,
    recipient: targetName,
    recipientPhone: targetPhone,
    amount: parsedAmount,
    fee,
    totalDeduction: parsedAmount + fee,
    postBalance: user.availableBalance - (parsedAmount + fee),
    anomalySignal,
    requiresPin: true,
  });
};

export const executeSendMoney = (req, res) => {
  const { recipient, amount, pin } = req.body;
  const user = req.user;
  const numAmount = Number(amount);

  if (pin !== user.pin) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_PIN',
      message: 'ভুল পিন কোড দেওয়া হয়েছে। সঠিক পিন দিন।',
    });
  }

  if (numAmount > user.availableBalance) {
    return res.status(400).json({
      success: false,
      error: 'INSUFFICIENT_BALANCE',
      message: 'ব্যবহারযোগ্য ব্যালেন্স পর্যাপ্ত নেই।',
    });
  }

  // Deduct from available balance
  const newAvailable = user.availableBalance - numAmount;
  db.updateUserBalances(user.id, { availableBalance: newAvailable });

  const newTxn = {
    id: `TXN-${Date.now().toString().slice(-6)}`,
    userId: user.id,
    title: `${recipient} (Send Money)`,
    recipient,
    type: 'send_money',
    amount: numAmount,
    fee: 0,
    currency: 'BDT',
    date: new Date().toISOString(),
    dateDisplay: 'আজ, এইমাত্র',
    category: 'ব্যক্তিগত',
    categoryKey: 'personal',
    status: 'COMPLETED',
    month: '2026-10',
    explanationBangla: `আপনার এইমাত্র ${recipient}-কে ৳${numAmount} টাকা পাঠানোর লেনদেন সফল হয়েছে। কোনো ফি কাটা হয়নি।`,
  };

  db.insert('transactions', newTxn);

  res.json({
    success: true,
    message: `${recipient}-কে ৳${numAmount} টাকা সফলভাবে পাঠানো হয়েছে।`,
    transaction: newTxn,
    newBalance: {
      available: newAvailable,
      locked: user.lockedBalance,
      total: newAvailable + user.lockedBalance,
    },
  });
};

export const executeCashOut = (req, res) => {
  const { agent, amount, pin } = req.body;
  const user = req.user;
  const numAmount = Number(amount);
  const fee = Math.round(numAmount * 0.01);
  const totalDeduct = numAmount + fee;

  if (pin !== user.pin) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_PIN',
      message: 'ভুল পিন কোড দেওয়া হয়েছে।',
    });
  }

  if (totalDeduct > user.availableBalance) {
    return res.status(400).json({
      success: false,
      error: 'INSUFFICIENT_BALANCE',
      message: 'ক্যাশ আউটের জন্য পর্যাপ্ত ব্যালেন্স নেই।',
    });
  }

  const newAvailable = user.availableBalance - totalDeduct;
  db.updateUserBalances(user.id, { availableBalance: newAvailable });

  const newTxn = {
    id: `TXN-${Date.now().toString().slice(-6)}`,
    userId: user.id,
    title: `${agent} (Cash Out)`,
    recipient: agent,
    type: 'cash_out',
    amount: numAmount,
    fee,
    currency: 'BDT',
    date: new Date().toISOString(),
    dateDisplay: 'আজ, এইমাত্র',
    category: 'ক্যাশ আউট',
    categoryKey: 'cash_out',
    status: 'COMPLETED',
    month: '2026-10',
    explanationBangla: `${agent} এজেন্ট পয়েন্ট থেকে ৳${numAmount} টাকা ক্যাশ আউট সফল হয়েছে। ফি: ৳${fee}।`,
  };

  db.insert('transactions', newTxn);

  res.json({
    success: true,
    message: `${agent} থেকে ৳${numAmount} টাকা ক্যাশ আউট সম্পন্ন হয়েছে।`,
    transaction: newTxn,
    newBalance: {
      available: newAvailable,
      locked: user.lockedBalance,
      total: newAvailable + user.lockedBalance,
    },
  });
};

export const explainTransaction = (req, res) => {
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
};
