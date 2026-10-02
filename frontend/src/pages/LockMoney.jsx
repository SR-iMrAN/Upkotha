import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';
import VoiceGuide from '../components/VoiceGuide';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { showToast, showAlert, showConfirm } from '../utils/alert';
import api from '../services/api';
import {
  Lock,
  Unlock,
  ShieldCheck,
  PlusCircle,
  Wallet,
  Sparkles,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

const COMMON_PURPOSES = [
  { key: 'emergency', label: 'জরুরি সঞ্চয়', icon: '🏥', desc: 'চিকিৎসা বা জরুরি প্রয়োজন' },
  { key: 'rent', label: 'বাড়িভাড়া', icon: '🏠', desc: 'মাসিক বাসাভাড়া সুরক্ষিত রাখা' },
  { key: 'bills', label: 'বিল ও ফি', icon: '⚡', desc: 'বিদ্যুৎ, ইন্টারনেট বা পরীক্ষার ফি' },
  { key: 'savings', label: 'সাধারণ সঞ্চয়', icon: '💰', desc: 'ভবিষ্যতের জন্য জমানো' },
];

const QUICK_AMOUNTS = [1000, 2000, 3000, 5000, 10000];

export default function LockMoney() {
  const { user, toggleStrictMode, updateBalance } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [locks, setLocks] = useState([]);
  const [selectedPurpose, setSelectedPurpose] = useState(COMMON_PURPOSES[0]);
  const [amount, setAmount] = useState('2000');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch active locks
  const loadLocks = async () => {
    try {
      setIsLoading(true);
      const res = await api.getLocks();
      setLocks(res.locks || []);
    } catch (err) {
      console.warn('Failed to load locks from API, using fallback data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocks();
  }, []);

  // Handle voice command prefill
  useEffect(() => {
    const prefill = location.state?.prefill;
    if (prefill) {
      if (prefill.amount) {
        setAmount(String(prefill.amount));
      }
      if (prefill.purpose) {
        const matched = COMMON_PURPOSES.find(p =>
          p.label.includes(prefill.purpose) ||
          prefill.purpose.toLowerCase().includes(p.key) ||
          prefill.purpose.includes('জরুরি') && p.key === 'emergency' ||
          prefill.purpose.includes('ভাড়া') && p.key === 'rent'
        );
        if (matched) setSelectedPurpose(matched);
      }
      showToast.info('ভয়েস কমান্ড থেকে মানি লকের তথ্য পূরণ করা হয়েছে');
    }
  }, [location.state]);

  const handleOpenLockConfirm = (e) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      showToast.error('সঠিক টাকার পরিমাণ দিন');
      return;
    }

    if (numAmount > user?.availableBalance) {
      showAlert({
        title: 'ব্যালেন্স অপর্যাপ্ত',
        text: `আপনার বর্তমান উপলব্ধ ব্যালেন্স ৳${new Intl.NumberFormat('bn-BD').format(user?.availableBalance)}। লক করার জন্য এর বেশি টাকা নেই।`,
        icon: 'warning',
      });
      return;
    }

    setIsModalOpen(true);
  };

  const handleConfirmLock = async (pin) => {
    const numAmount = Number(amount);

    if (pin !== '1234') {
      showToast.error('ভুল পিন কোড দেওয়া হয়েছে');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createLock({
        purpose: selectedPurpose.label,
        amount: numAmount,
        reason: reason || `${selectedPurpose.label} বাবদ টাকা সুরক্ষিত রাখা`,
      });

      setIsModalOpen(false);
      showToast.success(res.message);

      // Update balances in AuthContext
      if (res.newBalance) {
        updateBalance(res.newBalance.available, res.newBalance.locked);
      }

      setReason('');
      setAmount('2000');
      loadLocks();
    } catch (err) {
      showAlert({
        title: 'মানি লক ব্যর্থ হয়েছে',
        text: err.message,
        icon: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlock = async (lock) => {
    const confirmed = await showConfirm(
      `${lock.purpose} বাবদ ৳${new Intl.NumberFormat('bn-BD').format(lock.amount)} টাকা কি আনলক করতে চান? এটি আপনার ব্যবহারের ব্যালেন্সে ফিরে যাবে।`,
      'হ্যাঁ, আনলক করুন'
    );

    if (!confirmed) return;

    try {
      const res = await api.unlockMoney(lock.id);
      showToast.success(res.message);

      if (res.newBalance) {
        updateBalance(res.newBalance.available, res.newBalance.locked);
      }

      loadLocks();
    } catch (err) {
      showAlert({
        title: 'আনলক করা যায়নি',
        text: err.message,
        icon: 'error',
      });
    }
  };

  const formatBDT = (val) => new Intl.NumberFormat('bn-BD').format(val || 0);

  return (
    <Layout
      title="স্মার্ট মানি লক (Smart Money Lock)"
      isStrictMode={user?.isStrictMode}
      onToggleStrictMode={toggleStrictMode}
      userName={user?.name}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Contextual Voice Guide */}
        <VoiceGuide
          pageContext="lock_money"
          message="ভবিষ্যতের জন্য আলাদা রাখতে চান এমন টাকার পরিমাণ বলুন। যেমন: ৫০০০ টাকা emergency-এর জন্য lock করো।"
        />

        {/* Balance Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">মোট মোট ব্যালেন্স (Total)</span>
            <span className="text-xl font-bold text-slate-900">৳ {formatBDT((user?.availableBalance || 0) + (user?.lockedBalance || 0))}</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs">
            <span className="text-xs text-emerald-700 block mb-1">ব্যবহারযোগ্য ব্যালেন্স (Available)</span>
            <span className="text-xl font-bold text-emerald-900">৳ {formatBDT(user?.availableBalance)}</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">সেন্ড মানি ও ক্যাশ আউটের জন্য উন্মুক্ত</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
            <span className="text-xs text-amber-700 block mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              লক করা সঞ্চয় (Protected)
            </span>
            <span className="text-xl font-bold text-amber-900">৳ {formatBDT(user?.lockedBalance)}</span>
            <span className="text-[10px] text-amber-700 block mt-0.5">জরুরি খরচ ব্যতীত নিরাপদ</span>
          </div>
        </div>

        {/* ─── CREATE NEW LOCK FORM ────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <PlusCircle className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">নতুন মানি লক তৈরি করুন</h3>
          </div>

          {/* Purpose Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              লক করার উদ্দেশ্য বেছে নিন:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {COMMON_PURPOSES.map((purpose) => (
                <button
                  key={purpose.key}
                  type="button"
                  onClick={() => setSelectedPurpose(purpose)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedPurpose.key === purpose.key
                      ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-2xl mb-1">{purpose.icon}</div>
                  <span className="text-xs font-bold text-slate-800">{purpose.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{purpose.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleOpenLockConfirm} className="space-y-4">
            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  লক করার পরিমাণ (৳)
                </label>
                <span className="text-[11px] text-slate-400">সর্বোচ্চ ৳{formatBDT(user?.availableBalance)}</span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                  ৳
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="2000"
                  min="100"
                  max={user?.availableBalance || 50000}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              {/* Quick Amount Pills */}
              <div className="flex flex-wrap gap-2 mt-2">
                {QUICK_AMOUNTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(q.toString())}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                      amount === q.toString()
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ৳{q}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Reason / Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                বিবরণ (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="যেমন: আগামী মাসের চিকিৎসার খরচ"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              icon={Lock}
            >
              টাকা লক করুন
            </Button>
          </form>
        </div>

        {/* ─── ACTIVE LOCKS LIST ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              সক্রিয় সুরক্ষিত বাকেটসমূহ ({locks.length})
            </h3>
            <span className="text-xs text-amber-700 font-bold">
              মোট লক: ৳ {formatBDT(user?.lockedBalance)}
            </span>
          </div>

          {locks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              বর্তমানে কোনো সুরক্ষিত বাকেট নেই। উপরের ফর্ম ব্যবহার করে মানি লক তৈরি করুন।
            </div>
          ) : (
            <div className="space-y-3">
              {locks.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-amber-300 flex items-center justify-center text-xl shrink-0 shadow-xs">
                      {item.icon || '🔒'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{item.purpose}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-300">
                          লক করা
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{item.reason}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        লক করা হয়েছে: {item.lockedOnDisplay || 'সম্প্রতি'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/50">
                    <span className="text-base font-extrabold text-amber-900">
                      ৳ {formatBDT(item.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUnlock(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition"
                      title="টাকা ব্যবহারযোগ্য ব্যালেন্সে ফেরত নিন"
                    >
                      <Unlock className="w-3.5 h-3.5 text-slate-500" />
                      <span>আনলক করুন</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PIN Confirmation Modal */}
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmLock}
          title="মানি লক নিশ্চিতকরণ"
          recipient={`${selectedPurpose.label} বাকেট`}
          amount={Number(amount)}
          fee={0}
          availableBalance={user?.availableBalance || 0}
          isStrictMode={user?.isStrictMode}
          isLoading={isSubmitting}
        />
      </div>
    </Layout>
  );
}
