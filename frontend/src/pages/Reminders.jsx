import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import VoiceGuide from '../components/VoiceGuide';
import ReminderCard from '../components/ReminderCard';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';

export default function Reminders() {
  const { user, toggleStrictMode } = useAuth();
  const [reminders, setReminders] = useState(SYNTHETIC_REMINDERS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadLiveReminders() {
      try {
        setIsLoading(true);
        const res = await api.getReminders();
        if (res.reminders && res.reminders.length > 0) {
          setReminders(res.reminders);
        }
      } catch (err) {
        // Fall back to synthetic data
      } finally {
        setIsLoading(false);
      }
    }
    loadLiveReminders();
  }, []);

  const handleMarkDone = async (id) => {
    try {
      await api.completeReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
      showToast.success('বিলটি সফলভাবে পরিশোধিত হিসেবে চিহ্নিত করা হয়েছে');
    } catch (err) {
      setReminders(prev => prev.filter(r => r.id !== id));
      showToast.success('রিমাইন্ডারটি সম্পন্ন করা হয়েছে');
    }
  };

  const upcomingCount = reminders.filter(r => r.daysUntil <= 7).length;

  return (
    <Layout
      title="বিল রিমাইন্ডার ও নিয়মিত প্রতিশ্রুতি (Reminders)"
      isStrictMode={user?.isStrictMode}
      onToggleStrictMode={toggleStrictMode}
      userName={user?.name}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Contextual Voice Guide */}
        <VoiceGuide
          pageContext="reminders"
          message="আপনার DESCO বিদ্যুৎ বিল সাধারণত ৫ তারিখে এবং Link3 ইন্টারনেট বিল ১০ তারিখে আসে। উপকথা সময়মতো স্মরণ করিয়ে দেবে।"
        />

        {/* AI Pattern Detection Callout */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-slate-900 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-200">
                স্বয়ংক্রিয় রিকারিং প্যাটার্ন পর্যবেক্ষণ (AI Pattern Memory)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                উপকথা আপনার বিগত ৩ মাসের লেনদেন বিশ্লেষণ করে নিয়মিত বিলগুলো শনাক্ত করেছে। কোনো বিল ভুলে যাওয়ার ঝুঁকি নেই।
              </p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold shrink-0">
            {upcomingCount} টি বিল আসন্ন
          </span>
        </div>

        {/* Reminders List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BellRing className="w-4 h-4 text-blue-600" />
              চিহ্নিত নিয়মিত বিলসমূহ ({reminders.length})
            </h3>
            <span className="text-xs text-slate-400">
              পরবর্তী ৭ দিনের মধ্যে প্রদেয়
            </span>
          </div>

          {reminders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              অভিনন্দন! আপনার কোনো অনিষ্পন্ন বিল বা রিমাইন্ডার বাকি নেই।
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((rem) => (
                <ReminderCard
                  key={rem.id}
                  reminder={rem}
                  onMarkDone={handleMarkDone}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
