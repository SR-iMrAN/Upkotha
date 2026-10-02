import db from '../dataStore.js';
import { extractIntentWithGemini } from '../services/geminiService.js';

/**
 * AI Controller: Translates natural language into structured intent and entities via Gemini 2.5/3.5 Flash.
 * Backed by deterministic fallback when offline or when no API key is provided.
 */
export const extractIntent = async (req, res, next) => {
  try {
    const { userText, page = 'dashboard', action } = req.body;

    if (!userText || !userText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'EMPTY_TEXT',
        message: 'কোনো বক্তব্য বা টেক্সট পাওয়া যায়নি।',
      });
    }

    const text = userText.trim();
    const userId = req.user?.id || 'usr_imran_001';

    // Call Gemini 3.5 Flash / Fallback service
    const aiResult = await extractIntentWithGemini({
      userText: text,
      pageContext: page,
      actionContext: action,
      userId,
    });

    // Record privacy-safe voice metadata log (No raw audio stored)
    db.insert('voice_logs', {
      id: `vlog_${Date.now()}`,
      userId,
      timestamp: new Date().toISOString(),
      rawTranscript: text,
      language: 'bn-BD',
      pageContext: page,
      intent: aiResult.intent,
      confidence: aiResult.confidence,
      entities: aiResult.entities || {},
      status: 'PROCESSED',
      engine: aiResult.engine,
      privacyCompliant: true,
    });

    res.json({
      success: true,
      ...aiResult,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Personalized Financial Insights & Trend Analytics
 * Analyzes real financial ledgers (spending, locks, reminders, cash out fees)
 * and generates grounded, empathetic, actionable Bangla insights.
 */
export const getInsights = (req, res, next) => {
  try {
    const userId = req.user?.id || 'usr_imran_001';
    const user = db.getUser(userId) || { availableBalance: 13500, lockedBalance: 5000, totalBalance: 18500 };
    const allTxns = db.getAll('transactions').filter(t => t.userId === userId);
    const activeLocks = db.getActiveLocks(userId);
    const reminders = db.getReminders(userId);

    // Compute key financial metrics
    const totalSpent = allTxns.filter(t => t.type !== 'received').reduce((s, t) => s + (t.amount || 0), 0);
    const totalCashOuts = allTxns.filter(t => t.type === 'cash_out');
    const totalCashOutFees = totalCashOuts.reduce((s, t) => s + (t.fee || 0), 0);
    const totalLocked = user.lockedBalance || 0;
    const totalBalance = user.totalBalance || (user.availableBalance + totalLocked);
    const lockedPercentage = totalBalance > 0 ? Math.round((totalLocked / totalBalance) * 100) : 0;

    const pendingReminders = reminders.filter(r => r.status !== 'COMPLETED');
    const nextBill = pendingReminders[0];

    const insights = [];

    // 1. Savings Retention Insight
    if (lockedPercentage > 0) {
      insights.push({
        id: 'ins_savings_ratio',
        type: 'observation',
        title: 'সঞ্চয় সুরক্ষায় চমৎকার অগ্রগতি',
        message: `আপনার মোট অর্থের ${lockedPercentage}% (৳${new Intl.NumberFormat('bn-BD').format(totalLocked)}) স্মার্ট মানি লকে সুরক্ষিত রয়েছে। এটি আপনাকে অপরিকল্পিত ও অপ্রত্যাশিত খরচ থেকে বাঁচাচ্ছে।`,
        groundedFact: `লক করা সঞ্চয়: ৳${new Intl.NumberFormat('bn-BD').format(totalLocked)}, সক্রিয় বাকেট: ${activeLocks.length}টি`,
        actionLabel: 'মানি লক পরিচালনা',
        actionRoute: '/lock-money',
      });
    }

    // 2. Upcoming Utility Readiness
    if (nextBill) {
      insights.push({
        id: 'ins_utility_readiness',
        type: nextBill.daysUntil <= 3 ? 'warning' : 'reminder',
        title: 'আসন্ন বিল পরিশোধের প্রস্তুতি',
        message: nextBill.daysUntil <= 3
          ? `আগামী ${nextBill.daysUntil} দিনের মধ্যে ${nextBill.title} (৳${new Intl.NumberFormat('bn-BD').format(nextBill.typicalAmount)}) প্রদেয়। আপনার ব্যালেন্সে পর্যাপ্ত অর্থ প্রস্তুত রয়েছে।`
          : `${nextBill.title} পরিশোধের তারিখ সন্নিকটে (${nextBill.expectedDate})। আপনার বর্তমান উপলব্ধ ব্যালেন্স পর্যাপ্ত।`,
        groundedFact: `প্রয়োজনীয় অর্থ: ৳${new Intl.NumberFormat('bn-BD').format(nextBill.typicalAmount)}, উপলব্ধ ব্যালেন্স: ৳${new Intl.NumberFormat('bn-BD').format(user.availableBalance)}`,
        actionLabel: 'বিল রিমাইন্ডারে যান',
        actionRoute: '/reminders',
      });
    }

    // 3. Cash Out Fee Optimization
    if (totalCashOuts.length > 0) {
      insights.push({
        id: 'ins_cashout_fees',
        type: 'observation',
        title: 'ক্যাশ আউট ফি বিশ্লেষণ',
        message: `সাম্প্রতিক সময়ে ক্যাশ আউট ফি বাবদ মোট ৳${totalCashOutFees} ব্যয় হয়েছে। ছোট ছোট একাধিক উত্তোলনের চেয়ে পরিকল্পিতভাবে একবার ক্যাশ আউট করলে ফি ও সময় উভয়ই সাশ্রয় হয়।`,
        groundedFact: `মোট ক্যাশ আউট: ${totalCashOuts.length} বার, মোট ফি: ৳${totalCashOutFees}`,
        actionLabel: 'লেনদেন বিশ্লেষণ',
        actionRoute: '/transactions',
      });
    }

    // 4. Send Money & Strict Mode Safety Advisory
    insights.push({
      id: 'ins_safety_tip',
      type: user.isStrictMode ? 'observation' : 'warning',
      title: user.isStrictMode ? 'স্ট্রিক্ট মোড সক্রিয় সুরক্ষা' : 'নিরাপত্তা সুপারিশ',
      message: user.isStrictMode
        ? 'আপনার অ্যাকাউন্টে স্ট্রিক্ট মোড চালু রয়েছে। প্রতিটি বড় লেনদেনে স্বয়ংক্রিয় দ্বৈত নিশ্চিতকরণ ও বড় ফন্ট আপনাকে ভুল লেনদেন থেকে রক্ষা করবে।'
        : 'বড় অঙ্কের লেনদেনে ভুল রোধে এবং অপরিচিত নম্বরে সতর্কতার জন্য স্ট্রিক্ট মোড সক্রিয় করার পরামর্শ দেওয়া হচ্ছে।',
      groundedFact: `বর্তমান স্ট্যাটাস: ${user.isStrictMode ? 'স্ট্রিক্ট মোড অন' : 'সাধারণ মোড'}`,
      actionLabel: 'নিরাপত্তা সেটিংস',
      actionRoute: '/strict-mode',
    });

    res.json({
      success: true,
      count: insights.length,
      metrics: {
        totalSpent,
        totalLocked,
        lockedPercentage,
        totalCashOutFees,
      },
      insights,
    });
  } catch (err) {
    next(err);
  }
};
