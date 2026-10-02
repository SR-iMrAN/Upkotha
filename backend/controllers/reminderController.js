import db from '../dataStore.js';

export const getReminders = (req, res) => {
  const userId = req.user.id;
  const rawReminders = db.getReminders(userId);
  const user = db.getUser(userId);

  // Enrich with dynamic urgency and days
  const enriched = rawReminders.map((r) => {
    let urgency = 'NORMAL';
    if (r.status !== 'COMPLETED') {
      if (r.daysUntil <= 2) urgency = 'CRITICAL';
      else if (r.daysUntil <= 7) urgency = 'UPCOMING';
    }

    return {
      ...r,
      urgency,
      canPay: r.status !== 'COMPLETED' && user.availableBalance >= (r.typicalAmount || 0),
    };
  });

  const pending = enriched.filter((r) => r.status !== 'COMPLETED');
  const totalUpcomingAmount = pending.reduce((sum, r) => sum + (r.typicalAmount || 0), 0);

  // Conversational Bangla Audio Summary
  let audioSummaryBangla = 'আপনার এই মুহূর্তে কোনো জরুরি বিল বাকি নেই।';
  if (pending.length > 0) {
    const criticals = pending.filter((r) => r.urgency === 'CRITICAL');
    if (criticals.length > 0) {
      audioSummaryBangla = `সতর্কতা: আপনার আগামী ${criticals[0].daysUntil} দিনের মধ্যে ${criticals[0].title} বাবদ ৳${new Intl.NumberFormat('bn-BD').format(criticals[0].typicalAmount)} টাকা পরিশোধের তারিখ রয়েছে।`;
    } else {
      audioSummaryBangla = `আপনার মোট ${pending.length}টি নিয়মিত বিলের পরিশোধের তারিখ সন্নিকটে, যার মোট পরিমাণ ৳${new Intl.NumberFormat('bn-BD').format(totalUpcomingAmount)}।`;
    }
  }

  res.json({
    success: true,
    count: enriched.length,
    pendingCount: pending.length,
    totalUpcomingAmount,
    availableBalance: user.availableBalance,
    audioSummaryBangla,
    reminders: enriched,
  });
};

export const completeReminder = (req, res) => {
  const { id } = req.params;
  const { pin, payNow } = req.body || {};
  const user = req.user;
  const reminder = db.getById('reminders', id);

  if (!reminder) {
    return res.status(404).json({
      success: false,
      error: 'REMINDER_NOT_FOUND',
      message: 'নির্দিষ্ট রিমাইন্ডারটি পাওয়া যায়নি।',
    });
  }

  if (reminder.status === 'COMPLETED') {
    return res.status(400).json({
      success: false,
      error: 'ALREADY_COMPLETED',
      message: 'এই বিলটি ইতিমধ্যে পরিশোধিত হয়েছে।',
    });
  }

  // If user chooses to pay now via MFS simulation
  let updatedBalance = null;
  const billAmount = reminder.typicalAmount || 0;

  if (payNow) {
    if (pin && pin !== user.pin) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_PIN',
        message: 'ভুল পিন কোড দেওয়া হয়েছে। সঠিক পিন প্রদান করুন।',
      });
    }

    if (billAmount > user.availableBalance) {
      return res.status(400).json({
        success: false,
        error: 'INSUFFICIENT_BALANCE',
        message: `বিল পরিশোধের জন্য পর্যাপ্ত ব্যালেন্স নেই। বর্তমান উপলব্ধ ব্যালেন্স: ৳${user.availableBalance}।`,
      });
    }

    // Deduct bill amount from available balance
    const newAvailable = user.availableBalance - billAmount;
    db.updateUserBalances(user.id, { availableBalance: newAvailable });
    updatedBalance = {
      available: newAvailable,
      locked: user.lockedBalance,
      total: newAvailable + user.lockedBalance,
    };

    // Record audit transaction in transactions ledger
    const billTxn = {
      id: `TXN-BILL-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      title: reminder.title,
      recipient: reminder.title,
      recipientPhone: reminder.meterNo || reminder.subscriberId || '',
      type: 'bill_pay',
      amount: billAmount,
      fee: 0,
      currency: 'BDT',
      date: new Date().toISOString(),
      dateDisplay: 'আজ, এইমাত্র',
      category: reminder.category || 'ইউটিলিটি',
      categoryKey: 'utilities',
      status: 'COMPLETED',
      month: new Date().toISOString().slice(0, 7),
      explanationBangla: `আপনার ${reminder.title} বাবদ ৳${new Intl.NumberFormat('bn-BD').format(billAmount)} টাকা সফলভাবে পরিশোধ করা হয়েছে। কোনো অতিরিক্ত বিলম্ব ফি লাগেনি।`,
    };
    db.insert('transactions', billTxn);
  }

  const updated = db.update('reminders', id, {
    status: 'COMPLETED',
    statusBangla: 'পরিশোধিত',
    completedAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: payNow
      ? `${reminder.title} বাবদ ৳${new Intl.NumberFormat('bn-BD').format(billAmount)} টাকা সফলভাবে পরিশোধ করা হয়েছে।`
      : `${reminder.title} পরিশোধিত হিসেবে চিহ্নিত করা হয়েছে।`,
    reminder: updated,
    newBalance: updatedBalance,
  });
};
