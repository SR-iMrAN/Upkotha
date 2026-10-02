import db from '../dataStore.js';

export const getDashboard = (req, res) => {
  const userId = req.user.id;
  const user = db.getUser(userId);

  const recentTransactions = db.getRecentTransactions(userId, 5);
  const reminders = db.getReminders(userId);
  const activeLocks = db.getActiveLocks(userId);

  // Calculate monthly stats from transactions
  const now = new Date('2026-10-02');
  const thisMonthKey = '2026-10';
  const lastMonthKey = '2026-09';

  const allTxns = db.getAll('transactions').filter(t => t.userId === userId);
  const thisMonthTxns = allTxns.filter(t => t.month === thisMonthKey);
  const lastMonthTxns = allTxns.filter(t => t.month === lastMonthKey);

  const thisMonthSpent = thisMonthTxns
    .filter(t => t.type !== 'received')
    .reduce((sum, t) => sum + t.amount + (t.fee || 0), 0);

  const lastMonthSpent = lastMonthTxns
    .filter(t => t.type !== 'received')
    .reduce((sum, t) => sum + t.amount + (t.fee || 0), 0);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        isStrictMode: user.isStrictMode,
      },
      balance: {
        available: user.availableBalance,
        locked: user.lockedBalance,
        total: user.totalBalance,
        currency: user.currency,
      },
      spending: {
        thisMonth: thisMonthSpent,
        lastMonth: lastMonthSpent,
        trend: thisMonthSpent > lastMonthSpent ? 'UP' : 'DOWN',
      },
      locks: activeLocks,
      reminders: reminders.filter(r => r.daysUntil <= 10),
      recentTransactions,
      voiceGuideMessage: `আপনার available balance ৳ ${new Intl.NumberFormat('bn-BD').format(user.availableBalance)}। চাইলে আজকের transaction অথবা reminder দেখতে পারেন।`,
    },
  });
};
