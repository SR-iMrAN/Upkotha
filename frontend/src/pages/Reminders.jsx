import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import VoiceGuide from '../components/VoiceGuide';
import ConfirmationModal from '../components/ConfirmationModal';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { showToast, showAlert } from '../utils/alert';
import { SYNTHETIC_REMINDERS } from '../data/syntheticData';
import api from '../services/api';
import {
  BellRing,
  Calendar,
  Clock,
  CheckCircle,
  Zap,
  Wifi,
  Heart,
  Sparkles,
  ArrowRight,
  Volume2,
  VolumeX,
  CreditCard,
  AlertTriangle,
  Flame,
  ShieldCheck,
} from 'lucide-react';

export default function Reminders() {
  const { user, toggleStrictMode, updateBalance } = useAuth();
  const { speak, stopSpeaking, isSpeaking } = useVoice();

  const [reminders, setReminders] = useState(SYNTHETIC_REMINDERS);
  const [audioSummary, setAudioSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1-Click Bill Payment Modal
  const [billToPay, setBillToPay] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const loadLiveReminders = async () => {
    try {
      setIsLoading(true);
      const res = await api.getReminders();
      if (res.reminders && res.reminders.length > 0) {
        setReminders(res.reminders);
      }
      if (res.audioSummaryBangla) {
        setAudioSummary(res.audioSummaryBangla);
      }
    } catch (err) {
      // Fall back to synthetic data
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLiveReminders();
  }, []);

  const handleOpenPayModal = (item) => {
    setBillToPay(item);
    setIsPayModalOpen(true);
  };

  const handleConfirmPayBill = async (pin) => {
    if (!billToPay) return;

    try {
      setIsSubmitting(true);
      const res = await api.completeReminder(billToPay.id, { payNow: true, pin });

      setIsPayModalOpen(false);
      showToast.success(res.message);

      // Voice readout
      speak(`আপনার ${billToPay.title} বাবদ ৳${new Intl.NumberFormat('bn-BD').format(billToPay.typicalAmount)} টাকা সফলভাবে পরিশোধ করা হয়েছে।`);

      // Update balances in AuthContext
      if (res.newBalance) {
        updateBalance(res.newBalance.available, res.newBalance.locked);
      }

      setBillToPay(null);
      loadLiveReminders();
    } catch (err) {
      showAlert({
        title: 'বিল পরিশোধ করা যায়নি',
        text: err.message,
        icon: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsDone = async (id, title) => {
    try {
      await api.completeReminder(id, { payNow: false });
      showToast.success(`${title} পরিশোধিত হিসেবে চিহ্নিত করা হয়েছে`);
      loadLiveReminders();
    } catch (err) {
      showToast.error('হালনাগাদ করা যায়নি');
    }
  };

  const handleSpeakSummary = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(audioSummary || 'আপনার আসন্ন বিদ্যুৎ বিল ৫ অক্টোবর এবং ইন্টারনেট বিল ১০ অক্টোবর নির্ধারিত রয়েছে।');
    }
  };

  const formatBDT = (val) => new Intl.NumberFormat('bn-BD').format(val || 0);

  const pendingReminders = reminders.filter((r) => r.status !== 'COMPLETED');
  const completedReminders = reminders.filter((r) => r.status === 'COMPLETED');
  const criticalCount = pendingReminders.filter((r) => r.daysUntil <= 2).length;

  return (
    <Layout
      title="স্মার্ট বিল রিমাইন্ডার ও নিয়মিত প্রতিশ্রুতি (Reminders)"
      isStrictMode={user?.isStrictMode}
      onToggleStrictMode={toggleStrictMode}
      userName={user?.name}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Contextual Voice Guide */}
        <VoiceGuide
          pageContext="reminders"
          message="আপনার DESCO বিদ্যুৎ বিল সাধারণত ৫ তারিখে এবং Link3 ইন্টারনেট বিল ১০ তারিখে আসে। বিল বাকি আছে কি না জানতে জিজ্ঞেস করুন।"
        />

        {/* ─── AI PATTERN DETECTION BANNER ─────────────────────── */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-blue-200">
                  স্বয়ংক্রিয় রিকারিং প্যাটার্ন পর্যবেক্ষণ (AI Predictive Cadence)
                </h3>
                {criticalCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                    জরুরি
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-xl">
                উপকথা আপনার বিগত ৩ মাসের লেনদেন প্যাটার্ন বিশ্লেষণ করে নিয়মিত বিলগুলো শনাক্ত করেছে।
                নির্ধারিত সময়ের আগেই আপনাকে স্মরণ করিয়ে দেওয়া হয় যাতে কোনো সংযোগ বিচ্ছিন্ন না হয়।
              </p>
            </div>
          </div>

          {/* Voice Summary Audio Trigger Button */}
          <button
            type="button"
            onClick={handleSpeakSummary}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-2 shrink-0 ${
              isSpeaking
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeaking ? 'থামান' : 'বিলের সারাংশ শুনুন'}</span>
          </button>
        </div>

        {/* ─── PENDING BILLS LIST ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BellRing className="w-4 h-4 text-blue-600" />
              আসন্ন নিয়মিত বিল ও প্রতিশ্রুতিসমূহ ({pendingReminders.length})
            </h3>
            <span className="text-xs text-blue-800 font-semibold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              মোট প্রদেয়: ৳ {formatBDT(pendingReminders.reduce((s, r) => s + (r.typicalAmount || 0), 0))}
            </span>
          </div>

          {pendingReminders.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              বর্তমানে কোনো বকেয়া বিল নেই! আপনার সকল নিয়মিত বিল পরিশোধিত রয়েছে।
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReminders.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    item.daysUntil <= 2
                      ? 'bg-rose-50/60 border-rose-200 ring-1 ring-rose-300'
                      : item.daysUntil <= 7
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {/* Left: Icon + Info */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl shrink-0 shadow-xs ${
                        item.daysUntil <= 2
                          ? 'bg-rose-100 border-rose-300 text-rose-700'
                          : item.daysUntil <= 7
                          ? 'bg-amber-100 border-amber-300 text-amber-700'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {item.icon || '⚡'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.daysUntil <= 2
                              ? 'bg-rose-600 text-white border-rose-700'
                              : item.daysUntil <= 7
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          {item.daysUntil <= 2
                            ? `${item.daysUntil} দিন বাকি (জরুরি)`
                            : `${item.daysUntil} দিন বাকি`}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        প্রদেয় তারিখ: {item.expectedDate}
                      </p>

                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>প্যাটার্ন: {item.detectedPattern}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <div className="text-left sm:text-right">
                      <span className="text-base font-extrabold text-slate-900 block">
                        ৳ {formatBDT(item.typicalAmount)}
                      </span>
                      <span className="text-[10px] text-slate-400">আনুমানিক পরিমাণ</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkAsDone(item.id, item.title)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold transition"
                        title="অন্য উপায়ে পরিশোধ করে থাকলে সম্পন্ন হিসেবে চিহ্নিত করুন"
                      >
                        চিহ্নিত করুন
                      </button>

                      <Button
                        variant="primary"
                        size="sm"
                        icon={CreditCard}
                        onClick={() => handleOpenPayModal(item)}
                      >
                        পরিশোধ করুন
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── COMPLETED BILLS ARCHIVE ─────────────────────────── */}
        {completedReminders.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              সম্প্রতি পরিশোধিত নিয়মিত বিলসমূহ ({completedReminders.length})
            </h3>

            <div className="space-y-2">
              {completedReminders.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{item.icon || '✓'}</span>
                    <div>
                      <span className="font-bold text-slate-800">{item.title}</span>
                      <span className="block text-[10px] text-emerald-700 font-semibold">
                        পরিশোধ সম্পন্ন • লেনদেন লেজারে অন্তর্ভুক্ত
                      </span>
                    </div>
                  </div>

                  <span className="font-bold text-slate-800">
                    ৳ {formatBDT(item.typicalAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1-Click Pay Confirmation Modal */}
        {billToPay && (
          <ConfirmationModal
            isOpen={isPayModalOpen}
            onClose={() => {
              setIsPayModalOpen(false);
              setBillToPay(null);
            }}
            onConfirm={handleConfirmPayBill}
            title="বিল পরিশোধ নিশ্চিতকরণ"
            recipient={billToPay.title}
            amount={billToPay.typicalAmount}
            fee={0}
            availableBalance={user?.availableBalance || 0}
            isStrictMode={user?.isStrictMode}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </Layout>
  );
}
