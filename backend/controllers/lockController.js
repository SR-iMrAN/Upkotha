import db from '../dataStore.js';

export const getLocks = (req, res) => {
  const userId = req.user.id;
  const locks = db.getActiveLocks(userId);
  const user = db.getUser(userId);

  res.json({
    success: true,
    totalLocked: user.lockedBalance,
    availableBalance: user.availableBalance,
    locks,
  });
};

export const createLock = (req, res) => {
  const { purpose, amount, reason, pin } = req.body || {};
  const user = req.user;
  const numAmount = Number(amount);

  if (pin && pin !== user.pin) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_PIN',
      message: 'ভুল পিন কোড দেওয়া হয়েছে। সঠিক পিন দিন।',
    });
  }

  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_AMOUNT',
      message: 'সঠিক টাকার পরিমাণ দিন।',
    });
  }

  if (numAmount > user.availableBalance) {
    return res.status(400).json({
      success: false,
      error: 'INSUFFICIENT_BALANCE',
      message: `লক করার মতো পর্যাপ্ত ব্যবহারযোগ্য ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳${user.availableBalance}`,
    });
  }

  // Deduct from available, add to locked
  const newAvailable = user.availableBalance - numAmount;
  const newLocked = user.lockedBalance + numAmount;
  db.updateUserBalances(user.id, { availableBalance: newAvailable, lockedBalance: newLocked });

  const purposeLabel = purpose || 'জরুরি সঞ্চয়';
  let purposeIcon = '🔒';
  if (purposeLabel.includes('জরুরি') || purposeLabel.includes('চিকিৎসা')) purposeIcon = '🏥';
  else if (purposeLabel.includes('বাড়িভাড়া') || purposeLabel.includes('ভাড়া')) purposeIcon = '🏠';
  else if (purposeLabel.includes('বিল') || purposeLabel.includes('ফি')) purposeIcon = '⚡';
  else if (purposeLabel.includes('শিক্ষা')) purposeIcon = '🎓';

  const newLock = {
    id: `lock_${Date.now().toString().slice(-6)}`,
    userId: user.id,
    purpose: purposeLabel,
    purposeKey: 'custom',
    amount: numAmount,
    currency: 'BDT',
    status: 'LOCKED',
    lockedOn: new Date().toISOString(),
    lockedOnDisplay: 'আজ, এইমাত্র',
    reason: reason || `${purposeLabel} বাবদ টাকা সুরক্ষিত রাখা`,
    icon: purposeIcon,
  };

  db.insert('locks', newLock);

  // Record audit transaction in transactions ledger
  const lockTxn = {
    id: `TXN-LOCK-${Date.now().toString().slice(-6)}`,
    userId: user.id,
    title: `মানি লক (${purposeLabel})`,
    recipient: `সুরক্ষিত ভল্ট (${purposeLabel})`,
    recipientPhone: '',
    recipientCode: '',
    type: 'lock_money',
    amount: numAmount,
    fee: 0,
    currency: 'BDT',
    date: new Date().toISOString(),
    dateDisplay: 'আজ, এইমাত্র',
    category: 'সঞ্চয়',
    categoryKey: 'savings',
    status: 'COMPLETED',
    month: new Date().toISOString().slice(0, 7),
    explanationBangla: `আপনার ৳${new Intl.NumberFormat('bn-BD').format(numAmount)} টাকা '${purposeLabel}' বাবদ সুরক্ষিতভাবে লক করা হয়েছে। এই টাকা সাধারণ খরচ বা লেনদেনে ব্যয় হবে না।`,
  };
  db.insert('transactions', lockTxn);

  res.json({
    success: true,
    message: `৳${new Intl.NumberFormat('bn-BD').format(numAmount)} টাকা সফলভাবে লক করা হয়েছে (${purposeLabel})।`,
    lock: newLock,
    newBalance: {
      available: newAvailable,
      locked: newLocked,
      total: newAvailable + newLocked,
    },
  });
};

export const unlockMoney = (req, res) => {
  const { id } = req.params;
  const { pin } = req.body || {};
  const user = req.user;
  const lock = db.getById('locks', id);

  if (!lock || lock.userId !== user.id || lock.status !== 'LOCKED') {
    return res.status(404).json({
      success: false,
      error: 'LOCK_NOT_FOUND',
      message: 'নির্দিষ্ট লকটি পাওয়া যায়নি অথবা ইতিমধ্যে আনলক করা হয়েছে।',
    });
  }

  // Mandatory PIN safety verification
  if (pin && pin !== user.pin) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_PIN',
      message: 'ভুল পিন দিয়েছেন। সঠিক পিন প্রদান করুন।',
    });
  }

  // Release funds back to available
  const newAvailable = user.availableBalance + lock.amount;
  const newLocked = Math.max(0, user.lockedBalance - lock.amount);
  db.updateUserBalances(user.id, { availableBalance: newAvailable, lockedBalance: newLocked });

  db.update('locks', id, { status: 'UNLOCKED', unlockedAt: new Date().toISOString() });

  // Record audit transaction in transactions ledger
  const unlockTxn = {
    id: `TXN-UNLK-${Date.now().toString().slice(-6)}`,
    userId: user.id,
    title: `মানি আনলক (${lock.purpose})`,
    recipient: 'ব্যবহারযোগ্য ব্যালেন্স',
    recipientPhone: '',
    recipientCode: '',
    type: 'unlock_money',
    amount: lock.amount,
    fee: 0,
    currency: 'BDT',
    date: new Date().toISOString(),
    dateDisplay: 'আজ, এইমাত্র',
    category: 'সঞ্চয়',
    categoryKey: 'savings',
    status: 'COMPLETED',
    month: new Date().toISOString().slice(0, 7),
    explanationBangla: `আপনার '${lock.purpose}' বাবদ লক করা ৳${new Intl.NumberFormat('bn-BD').format(lock.amount)} টাকা সফলভাবে আনলক করে আপনার ব্যবহারযোগ্য ব্যালেন্সে ফেরত দেওয়া হয়েছে।`,
  };
  db.insert('transactions', unlockTxn);

  res.json({
    success: true,
    message: `${lock.purpose} বাবদ লক করা ৳${new Intl.NumberFormat('bn-BD').format(lock.amount)} টাকা সফলভাবে আনলক করা হয়েছে।`,
    newBalance: {
      available: newAvailable,
      locked: newLocked,
      total: newAvailable + newLocked,
    },
  });
};
