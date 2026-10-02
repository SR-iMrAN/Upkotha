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
  if (!data) return null;
  const categories = Object.entries(data);
  const total = categories.reduce((sum, [, v]) => sum + v, 0);
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
      {categories.map(([cat, amount], i) => (
        <div key={cat} className="flex items-center gap-3">
          <span className="text-xs text-slate-600 w-28 shrink-0 truncate">{cat}</span>
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${colors[i % colors.length]}`}
              style={{ width: `${Math.round((amount / total) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-700 w-20 text-right shrink-0">
            ৳ {new Intl.NumberFormat('bn-BD').format(amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user, toggleStrictMode, updateBalance } = useAuth();
  const { speak, stopSpeaking, isSpeaking } = useVoice();
  const navigate = useNavigate();

  const [insights, setInsights] = useState(SYNTHETIC_INSIGHTS);
  const [reminders, setReminders] = useState(SYNTHETIC_REMINDERS);
  const [dismissedInsights, setDismissedInsights] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await api.getInsights();
        if (res.insights && res.insights.length > 0) {
          setInsights(res.insights);
        }
      } catch (err) {
        // Fallback to synthetic insights
      }

      try {
        const remRes = await api.getReminders();
        if (remRes.reminders && remRes.reminders.length > 0) {
          setReminders(remRes.reminders);
        }
      } catch (err) {
        // Fallback
      }
    }
    loadDashboardData();
  }, []);

  // Recent 5 transactions
  const recentTxns = SYNTHETIC_TRANSACTIONS.slice(0, 5);
  // This month's spending breakdown
  const thisMonthSpending = SPENDING_BY_CATEGORY['October'];
  const lastMonthSpending = SPENDING_BY_CATEGORY['September'];

  const thisMonthTotal = Object.values(thisMonthSpending).reduce((a, b) => a + b, 0);
  const lastMonthTotal = Object.values(lastMonthSpending).reduce((a, b) => a + b, 0);
  const spendingChange = (((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1);
  const spendingUp = thisMonthTotal > lastMonthTotal;

  const visibleInsights = insights.filter(i => !dismissedInsights.includes(i.id));
  const urgentReminders = reminders.filter(r => r.daysUntil <= 7);

  const handleMarkReminderDone = (id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    showToast.success('রিমাইন্ডারটি সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে');
  };

  const handleExplainTransaction = (txn) => {
    showExplainModal({
      title: txn.title,
      explanation: `আপনার <strong>${txn.dateDisplay}</strong> তারিখে <strong>${txn.recipient}</strong> বাবদ মোট <strong>৳${txn.amount}</strong> টাকার লেনদেন সফলভাবে সম্পন্ন হয়েছে। শ্রেণি: ${txn.category}। ${txn.fee ? `সার্ভিস চার্জ: ৳${txn.fee}।` : 'কোনো সার্ভিস চার্জ নেওয়া হয়নি।'}`,
      transactionId: txn.id,
    });
  };

  const handleInsightAction = (insight) => {
    showToast.info(`${insight.title} — পেজে নেওয়া হচ্ছে`);
    navigate(insight.actionRoute);
  };

  return (
    <Layout
      title="ড্যাশবোর্ড"
      isStrictMode={user?.isStrictMode}
      onToggleStrictMode={toggleStrictMode}
      userName={user?.name}
    >
      <div className="space-y-6 pb-8">

        {/* ─── Voice Guide Contextual Component ──────────────────────── */}
        <VoiceGuide
          pageContext="dashboard"
          message={`আপনার available balance ${new Intl.NumberFormat('bn-BD').format(user?.availableBalance || 13500)} টাকা। চাইলে আজকের transaction অথবা reminder দেখতে পারেন।`}
        />

        {/* ─── Balance Card ───────────────────────────────────────── */}
        <BalanceCard
          available={user?.availableBalance || 13500}
          locked={user?.lockedBalance || 5000}
          userName={user?.name}
          accountNumber={user?.phone}
        />

        {/* ─── Strict Mode Active Banner ───────────────────────────  */}
        {user?.isStrictMode && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center gap-3 text-sm">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">স্ট্রিক্ট মোড সক্রিয়:</span>
              <span className="ml-2 font-normal">প্রতিটি লেনদেনে অতিরিক্ত নিশ্চিতকরণ প্রযোজ্য। অস্বাভাবিক পরিমাণে AI সতর্কবার্তা দেওয়া হবে।</span>
            </div>
          </div>
        )}

        {/* ─── Quick Actions Grid ──────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            দ্রুত অ্যাকশন
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <QuickActionCard icon={Send}          label="সেন্ড মানি"   to="/send-money"  color="emerald" />
            <QuickActionCard icon={ArrowDownToLine} label="ক্যাশ আউট"  to="/cash-out"   color="emerald" />
            <QuickActionCard icon={Lock}          label="মানি লক"     to="/lock-money" color="amber"   />
            <QuickActionCard icon={History}       label="লেনদেন ইতিহাস" to="/transactions" color="slate" />
            <QuickActionCard icon={BellRing}      label="বিল রিমাইন্ডার" to="/reminders" color="blue"  />
            <QuickActionCard icon={Mic}           label="ভয়েস রুম"   to="/voice"      color="slate"   />
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
                উপকথার বিশ্লেষণ
              </h2>
              <span className="text-[10px] text-slate-400">(কৃত্রিম বুদ্ধিমত্তার পর্যবেক্ষণ)</span>
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
                আসন্ন বিল ও দায়িত্ব
              </h2>
              <Link to="/reminders" className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-0.5">
                সব দেখুন <ArrowRight className="w-3 h-3" />
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
                সাম্প্রতিক লেনদেন
              </h2>
              <Link to="/transactions" className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-0.5">
                সব দেখুন <ArrowRight className="w-3 h-3" />
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
                  এই মাসের খরচ
                </h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${spendingUp ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {spendingUp ? '+' : ''}{spendingChange}% গতমাস থেকে
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mb-1">
                ৳ {new Intl.NumberFormat('bn-BD').format(thisMonthTotal)}
              </div>
              <p className="text-[11px] text-slate-400 mb-4">
                গতমাস: ৳ {new Intl.NumberFormat('bn-BD').format(lastMonthTotal)}
              </p>
              <SpendingSummary data={thisMonthSpending} />
              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link to="/transactions" className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-0.5">
                  বিস্তারিত বিশ্লেষণ <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Money Lock Summary */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  সুরক্ষিত সঞ্চয়
                </h3>
                <Link to="/lock-money" className="text-xs text-emerald-700 font-semibold hover:underline">
                  পরিচালনা
                </Link>
              </div>
              <div className="text-2xl font-extrabold text-amber-700 mb-1">
                ৳ {new Intl.NumberFormat('bn-BD').format(user?.lockedBalance || 5000)}
              </div>
              <p className="text-[11px] text-slate-400 mb-3">মোট ২টি সুরক্ষিত বাকেট</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1">🏥 জরুরি সঞ্চয়</span>
                  <span className="font-semibold">৳ ৩,০০০</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1">🏠 বাড়িভাড়া</span>
                  <span className="font-semibold">৳ ২,০০০</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link to="/lock-money">
                  <Button variant="subtle" size="sm" fullWidth icon={Lock}>
                    নতুন লক যোগ করুন
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
