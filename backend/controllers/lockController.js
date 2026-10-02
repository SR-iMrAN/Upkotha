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
  const { purpose, amount, reason } = req.body;
  const user = req.user;
  const numAmount = Number(amount);

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

  const newLock = {
    id: `lock_${Date.now().toString().slice(-6)}`,
    userId: user.id,
    purpose: purpose || 'জরুরি সঞ্চয়',
    purposeKey: 'custom',
    amount: numAmount,
    currency: 'BDT',
    status: 'LOCKED',
    lockedOn: new Date().toISOString(),
    lockedOnDisplay: 'আজ, এইমাত্র',
    reason: reason || 'ভবিষ্যত সুরক্ষার জন্য আলাদা করা টাকা',
    icon: '🔒',
  };

  db.insert('locks', newLock);

  res.json({
    success: true,
    message: `৳${numAmount} টাকা সফলভাবে লক করা হয়েছে (${newLock.purpose})।`,
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
  const user = req.user;
  const lock = db.getById('locks', id);

  if (!lock || lock.userId !== user.id || lock.status !== 'LOCKED') {
    return res.status(404).json({
      success: false,
      error: 'LOCK_NOT_FOUND',
      message: 'নির্দিষ্ট লকটি পাওয়া যায়নি অথবা ইতিমধ্যে আনলক করা হয়েছে।',
    });
  }

  // Release funds back to available
  const newAvailable = user.availableBalance + lock.amount;
  const newLocked = Math.max(0, user.lockedBalance - lock.amount);
  db.updateUserBalances(user.id, { availableBalance: newAvailable, lockedBalance: newLocked });

  db.update('locks', id, { status: 'UNLOCKED', unlockedAt: new Date().toISOString() });

  res.json({
    success: true,
    message: `${lock.purpose} বাবদ লক করা ৳${lock.amount} টাকা সফলভাবে আনলক করা হয়েছে।`,
    newBalance: {
      available: newAvailable,
      locked: newLocked,
      total: newAvailable + newLocked,
    },
  });
};
