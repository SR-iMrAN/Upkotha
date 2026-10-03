import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Send,
  ArrowDownToLine,
  Lock,
  History,
  BellRing,
  ShieldCheck,
  Mic,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Volume2,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import Layout from '../components/Layout';
import BalanceCard from '../components/BalanceCard';
import TransactionCard from '../components/TransactionCard';
import AIInsightCard from '../components/AIInsightCard';
import ReminderCard from '../components/ReminderCard';
import VoiceGuide from '../components/VoiceGuide';
import VoiceCommand from '../components/VoiceCommand';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { useLanguage } from '../context/LanguageContext';
import { showToast, showExplainModal } from '../utils/alert';
import api from '../services/api';
import {
  SYNTHETIC_TRANSACTIONS,
  SYNTHETIC_REMINDERS,
  SYNTHETIC_INSIGHTS,
  SPENDING_BY_CATEGORY,
} from '../data/syntheticData';

// Mini Quick Action Card
function QuickActionCard({ icon: Icon, label, to, color = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100',
    amber: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
    blue: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
    slate: 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100',
  };

  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border font-medium text-xs transition-all shadow-xs hover:shadow-sm active:scale-[0.97] ${colors[color]}`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-center leading-tight">{label}</span>
    </Link>
  );
}

// Spending Summary Mini Chart (categorical)
function SpendingSummary({ data }) {
  if (!data || Object.keys(data).length === 0) return null;
  const categories = Object.entries(data);
  const total = categories.reduce((sum, [, v]) => sum + (v || 0), 0);
  const colors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-purple-500',
    'bg-teal-500',
  ];

  return (
    <div className="space-y-2.5">
      {categories.map(([cat, amount], i) => {
        const pct = total > 0 ? Math.round(((amount || 0) / total) * 100) : 0;
        return (
          <div key={cat} className="flex items-center gap-3">
            <span className="text-xs text-slate-600 w-28 shrink-0 truncate">{cat}</span>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${colors[i % colors.length]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-700 w-20 text-right shrink-0">
              ৳ {new Intl.NumberFormat('bn-BD').format(amount || 0)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { user, toggleStrictMode, updateBalance } = useAuth();
  const { speak, stopSpeaking, isSpeaking } = useVoice();
  const { isEnglish } = useLanguage();
  const navigate = useNavigate();

  const isImran = user?.id === 'usr_imran_001';

  // Dynamic user-isolated transactions
  const [userTxns, setUserTxns] = useState(() => {
    if (isImran) return SYNTHETIC_TRANSACTIONS;
    try {
      const saved = localStorage.getItem(`upkotha_transactions_${user?.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [insights, setInsights] = useState(isImran ? SYNTHETIC_INSIGHTS : []);
  const [reminders, setReminders] = useState(() => {
    if (isImran) return SYNTHETIC_REMINDERS;
    try {
      const saved = localStorage.getItem(`upkotha_reminders_${user?.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [dismissedInsights, setDismissedInsights] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      if (isImran) {
        try {
          const res = await api.getInsights();
          if (res.insights && res.insights.length > 0) {
            setInsights(res.insights);
          }
        } catch (err) {}

        try {
          const remRes = await api.getReminders();
          if (remRes.reminders && remRes.reminders.length > 0) {
            setReminders(remRes.reminders);
          }
        } catch (err) {}
      }
    }
    loadDashboardData();
  }, [isImran]);

  // Recent 5 transactions
  const safeTxns = Array.isArray(userTxns) ? userTxns : [];
  const recentTxns = safeTxns.slice(0, 5);

  // Spending calculations
  const thisMonthSpending = isImran ? (SPENDING_BY_CATEGORY['October'] || {}) : { 'অন্যান্য': safeTxns.filter(t => t && t.type !== 'received').reduce((a, b) => a + (b.amount || 0), 0) };
  const lastMonthSpending = isImran ? (SPENDING_BY_CATEGORY['September'] || {}) : { 'অন্যান্য': 0 };

  const thisMonthTotal = Object.values(thisMonthSpending).reduce((a, b) => a + (b || 0), 0);
  const lastMonthTotal = Object.values(lastMonthSpending).reduce((a, b) => a + (b || 0), 0);
  const spendingChange = lastMonthTotal > 0 ? (((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1) : '0';
  const spendingUp = thisMonthTotal > lastMonthTotal;

  const visibleInsights = (Array.isArray(insights) ? insights : []).filter(i => i && !dismissedInsights.includes(i.id));
  const urgentReminders = (Array.isArray(reminders) ? reminders : []).filter(r => r && (r.daysUntil || 10) <= 7);

  const handleAddMoney = async ({ amount, channel }) => {
    const currentAvail = user?.availableBalance || 0;
    const newAvailable = currentAvail + amount;
    updateBalance(newAvailable, user?.lockedBalance || 0);

    const newTxn = {
      id: `TXN-ADD-${Date.now().toString().slice(-6)}`,
      type: 'received',
      categoryKey: 'deposit',
      category: 'জমা',
      title: `অ্যাড মানি (${channel})`,
      recipient: user?.name || 'নিজ ওয়ালেট',
      amount,
      fee: 0,
      dateDisplay: 'আজ, এইমাত্র',
      status: 'COMPLETED',
      explanationBangla: `আপনার অ্যাকাউন্টে ৳${amount} টাকা সফলভাবে যোগ করা হয়েছে।`,
    };

    const updated = [newTxn, ...userTxns];
    setUserTxns(updated);
    if (!isImran && user?.id) {
      localStorage.setItem(`upkotha_transactions_${user?.id}`, JSON.stringify(updated));
    }
  };

  const handleMarkReminderDone = (id) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    if (!isImran && user?.id) {
      localStorage.setItem(`upkotha_reminders_${user?.id}`, JSON.stringify(updated));
    }
    showToast.success('রিমাইন্ডারটি সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে');
  };

  const handleExplainTransaction = (txn) => {
    showExplainModal({
      title: txn.title,
      explanation: `আপনার <strong>${txn.dateDisplay}</strong> তারিখে <strong>${txn.recipient}</strong> বাবদ মোট <strong>৳${txn.amount}</strong> টাকার লেনদেন সফলভাবে সম্পন্ন হয়েছে। শ্রেণি: ${txn.category || 'লেনদেন'}। ${txn.fee ? `সার্ভিস চার্জ: ৳${txn.fee}।` : 'কোনো সার্ভিস চার্জ নেওয়া হয়নি।'}`,
      transactionId: txn.id,
    });
  };

  const handleInsightAction = (insight) => {
    showToast.info(`${insight.title} — পেজে নেওয়া হচ্ছে`);
    navigate(insight.actionRoute);
  };

  return (
    <Layout
      title={isEnglish ? "Dashboard" : "ড্যাশবোর্ড"}
      isStrictMode={user?.isStrictMode}
      onToggleStrictMode={toggleStrictMode}
      userName={user?.name}
    >
      <div className="space-y-6 pb-8">

        {/* ─── Voice Guide Contextual Component ──────────────────────── */}
        <VoiceGuide
          pageContext="dashboard"
          message={`আপনার উপলব্ধ ব্যালেন্স ${new Intl.NumberFormat('bn-BD').format(user?.availableBalance || 15000)} টাকা। চাইলে আজকের লেনদেন অথবা রিমাইন্ডার দেখতে পারেন।`}
        />

        {/* ─── Voice Biometrics Setup Prompt for Newly Registered Users ─ */}
        {!isImran && (!user?.voiceProfile?.isEnrolled || user?.needsVoiceEnrollment) && (
          <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-300">
                <Mic className="w-5 h-5 text-emerald-700 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  {isEnglish ? 'Register Your Voice Biometrics' : 'আপনার কণ্ঠস্বর বায়োমেট্রিক নিবন্ধন করুন'}
                </h4>
                <p className="text-xs text-slate-700 mt-0.5 font-normal">
                  {isEnglish
                    ? 'For security, record your voice pitch (F0) so only your voice is authorized to execute transactions.'
                    : 'নিরাপত্তার স্বার্থে আপনার কণ্ঠের পিচ (F0) সেভ করুন, যাতে শুধু আপনার কণ্ঠেই ভয়েস লেনদেন অনুমোদিত হয়।'}
                </p>
              </div>
            </div>
            <Link
              to="/voice-security"
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shrink-0 shadow-xs transition"
            >
              {isEnglish ? 'Register Voice' : 'কণ্ঠস্বর রেজিস্টার করুন'}
            </Link>
          </div>
        )}

        {/* ─── Balance Card ───────────────────────────────────────── */}
        <BalanceCard
          available={user?.availableBalance ?? (isImran ? 13500 : 15000)}
          locked={user?.lockedBalance ?? (isImran ? 5000 : 0)}
          userName={user?.name}
          accountNumber={user?.phone}
          onAddMoney={handleAddMoney}
        />

        {/* ─── Strict Mode Active Banner ───────────────────────────  */}
        {user?.isStrictMode && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center gap-3 text-sm">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">{isEnglish ? 'Strict Mode Active:' : 'স্ট্রিক্ট মোড সক্রিয়:'}</span>
              <span className="ml-2 font-normal">
                {isEnglish
                  ? 'Enhanced human verification required for all transactions. AI alert will trigger on abnormal amounts.'
                  : 'প্রতিটি লেনদেনে অতিরিক্ত নিশ্চিতকরণ প্রযোজ্য। অস্বাভাবিক পরিমাণে AI সতর্কবার্তা দেওয়া হবে।'}
              </span>
            </div>
          </div>
        )}

        {/* ─── Quick Actions Grid ──────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            {isEnglish ? 'Quick Actions' : 'দ্রুত অ্যাকশন'}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <QuickActionCard icon={Send}            label={isEnglish ? "Send Money" : "সেন্ড মানি"}     to="/send-money"    color="emerald" />
            <QuickActionCard icon={ArrowDownToLine} label={isEnglish ? "Cash Out" : "ক্যাশ আউট"}      to="/cash-out"      color="emerald" />
            <QuickActionCard icon={Lock}            label={isEnglish ? "Lock Money" : "মানি লক"}       to="/lock-money"    color="amber"   />
            <QuickActionCard icon={History}         label={isEnglish ? "Transactions" : "লেনদেন ইতিহাস"} to="/transactions"  color="slate"   />
            <QuickActionCard icon={BellRing}        label={isEnglish ? "Reminders" : "বিল রিমাইন্ডার"}  to="/reminders"     color="blue"    />
            <QuickActionCard icon={Mic}             label={isEnglish ? "Voice Room" : "ভয়েস রুম"}     to="/voice"         color="slate"   />
          </div>
        </section>

        {/* ─── Inline Voice Command Bar ────────────────────────────── */}
        <VoiceCommand pageContext="dashboard" />

        {/* ─── AI Insights ─────────────────────────────────────────── */}
        {visibleInsights.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {isEnglish ? 'Upkotha Insights' : 'উপকথার বিশ্লেষণ'}
              </h2>
              <span className="text-[10px] text-slate-400">
                {isEnglish ? '(AI Financial Monitoring)' : '(কৃত্রিম বুদ্ধিমত্তার পর্যবেক্ষণ)'}
              </span>
            </div>
            <div className="space-y-3">
              {visibleInsights.map(insight => (
                <AIInsightCard
                  key={insight.id}
                  type={insight.type}
                  title={insight.title}
                  message={insight.message}
                  groundedFact={insight.groundedFact}
                  actionLabel={insight.actionLabel}
                  onAction={() => handleInsightAction(insight)}
                  onDismiss={() => setDismissedInsights(prev => [...prev, insight.id])}
                  onSpeak={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else {
                      speak(`${insight.title}। ${insight.message}`);
                    }
                  }}
                  isSpeaking={isSpeaking}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── Upcoming Bills / Reminders ─────────────────────────── */}
        {urgentReminders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-blue-600" />
                {isEnglish ? 'Upcoming Bills & Reminders' : 'আসন্ন বিল ও দায়িত্ব'}
              </h2>
              <Link to="/reminders" className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-0.5">
                {isEnglish ? 'View All' : 'সব দেখুন'} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {urgentReminders.map(rem => (
                <ReminderCard
                  key={rem.id}
                  reminder={rem}
                  onMarkDone={handleMarkReminderDone}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── Main Content Grid (2 columns on desktop) ───────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Recent Transactions (3 cols) */}
          <section className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                {isEnglish ? 'Recent Transactions' : 'সাম্প্রতিক লেনদেন'}
              </h2>
              <Link to="/transactions" className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-0.5">
                {isEnglish ? 'View All' : 'সব দেখুন'} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentTxns.map(txn => (
                <TransactionCard
                  key={txn.id}
                  transaction={txn}
                  onExplain={handleExplainTransaction}
                />
              ))}
            </div>
          </section>

          {/* Sidebar: Spending Summary (2 cols) */}
          <aside className="lg:col-span-2 space-y-4">

            {/* This Month Spending Summary */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  {spendingUp
                    ? <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                    : <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />}
                  {isEnglish ? 'This Month Expenses' : 'এই মাসের খরচ'}
                </h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${spendingUp ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {spendingUp ? '+' : ''}{spendingChange}% {isEnglish ? 'from last month' : 'গতমাস থেকে'}
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mb-1">
                ৳ {new Intl.NumberFormat('bn-BD').format(thisMonthTotal)}
              </div>
              <p className="text-[11px] text-slate-400 mb-4">
                {isEnglish ? 'Last month: ৳ ' : 'গতমাস: ৳ '}{new Intl.NumberFormat('bn-BD').format(lastMonthTotal)}
              </p>
              <SpendingSummary data={thisMonthSpending} />
              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link to="/transactions" className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-0.5">
                  {isEnglish ? 'Detailed Breakdown' : 'বিস্তারিত বিশ্লেষণ'} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Money Lock Summary */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  {isEnglish ? 'Locked Savings' : 'সুরক্ষিত সঞ্চয়'}
                </h3>
                <Link to="/lock-money" className="text-xs text-emerald-700 font-semibold hover:underline">
                  {isEnglish ? 'Manage' : 'পরিচালনা'}
                </Link>
              </div>
              <div className="text-2xl font-extrabold text-amber-700 mb-1">
                ৳ {new Intl.NumberFormat('bn-BD').format(user?.lockedBalance || 5000)}
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                {isEnglish ? '2 Protected buckets' : 'মোট ২টি সুরক্ষিত বাকেট'}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    {isEnglish ? 'Emergency Savings' : 'জরুরি সঞ্চয়'}
                  </span>
                  <span className="font-semibold">৳ ৩,০০০</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                    {isEnglish ? 'House Rent' : 'বাড়িভাড়া'}
                  </span>
                  <span className="font-semibold">৳ ২,০০০</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link to="/lock-money">
                  <Button variant="subtle" size="sm" fullWidth icon={Lock}>
                    {isEnglish ? 'Add New Lock' : 'নতুন লক যোগ করুন'}
                  </Button>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
