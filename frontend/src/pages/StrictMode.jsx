import React, { useState } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import VoiceGuide from '../components/VoiceGuide';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { showToast } from '../utils/alert';
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  Volume2,
  Lock,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Zap,
  ArrowRight,
  Sliders,
} from 'lucide-react';

export default function StrictMode() {
  const { user, toggleStrictMode } = useAuth();
  const { speak } = useVoice();
  const [isSimulating, setIsSimulating] = useState(false);

  const handleToggle = () => {
    toggleStrictMode();
    if (!user?.isStrictMode) {
      speak('স্ট্রিক্ট মোড সক্রিয় করা হয়েছে। এখন থেকে সকল লেনদেনে বাড়তি সতর্কতা ও বড় ফন্ট প্রযোজ্য হবে।');
    } else {
      speak('স্ট্রিক্ট মোড বন্ধ করা হয়েছে।');
    }
  };

  const handleTestSimulation = () => {
    setIsSimulating(true);
  };

  const formatBDT = (val) => new Intl.NumberFormat('bn-BD').format(val || 0);

  return (
    <Layout
      title="স্ট্রিক্ট মোড ও নিরাপত্তা শিল্ড (Strict Mode)"
      isStrictMode={user?.isStrictMode}
      onToggleStrictMode={toggleStrictMode}
      userName={user?.name}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Contextual Voice Guide */}
        <VoiceGuide
          pageContext="strict_mode"
          message="স্ট্রিক্ট মোড চালু থাকলে প্রতিটি লেনদেনে দ্বৈত নিশ্চিতকরণ এবং বড় ফন্ট প্রযোজ্য হবে।"
        />

        {/* ─── MAIN TOGGLE HERO CARD ──────────────────────────── */}
        <div
          className={`p-6 sm:p-8 rounded-2xl border transition-all shadow-sm ${
            user?.isStrictMode
              ? 'bg-emerald-950 text-white border-emerald-700 ring-2 ring-emerald-500/50'
              : 'bg-white text-slate-900 border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  user?.isStrictMode ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {user?.isStrictMode ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    স্ট্রিক্ট মোড সুরক্ষা শিল্ড
                  </h2>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      user?.isStrictMode
                        ? 'bg-emerald-800 text-emerald-200 border border-emerald-600'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {user?.isStrictMode ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                  </span>
                </div>
                <p
                  className={`text-xs sm:text-sm mt-1.5 leading-relaxed max-w-xl ${
                    user?.isStrictMode ? 'text-emerald-200' : 'text-slate-600'
                  }`}
                >
                  প্রবীণ নাগরিক, দৃষ্টিপ্রতিবন্ধী ও নতুন ব্যবহারকারীদের জন্য তৈরি। লেনদেনের ভুল প্রতিরোধে অতিরিক্ত
                  চেকবক্স, স্পষ্ট বড় ফন্ট এবং স্বয়ংক্রিয় অডিও সতর্কতা নিশ্চিত করে।
                </p>
              </div>
            </div>

            {/* Toggle Button */}
            <div className="sm:self-center">
              <button
                type="button"
                onClick={handleToggle}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
                  user?.isStrictMode
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                {user?.isStrictMode ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>স্ট্রিক্ট মোড বন্ধ করুন</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>স্ট্রিক্ট মোড চালু করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ─── 4 SAFETY PILLARS GRID ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">১. দ্বৈত নিশ্চিতকরণ গার্ড (Double Confirmation)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              বড় অঙ্কের লেনদেন (৳৫,০০০ বা তার বেশি) অথবা নতুন নম্বরে টাকা পাঠানোর সময় বাধ্যতামূলক যাচাই চেকবক্স প্রদর্শিত হয়।
              চেকবক্সে সম্মতি না দেওয়া পর্যন্ত পিন বাটন লক থাকে।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <Eye className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">২. উচ্চ বৈসাদৃশ্য ও বৃহৎ ফন্ট (High-Contrast UI)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              দৃষ্টিপ্রতিবন্ধী বা প্রবীণ নাগরিকদের পড়ার সুবিধার্থে টাকার পরিমাণ ও প্রাপকের নাম বড় বোল্ড ফন্টে এবং
              উচ্চ বৈসাদৃশ্যের ডার্ক বর্ডারে প্রদর্শিত হয়।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Volume2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">৩. স্বয়ংক্রিয় অডিও সতর্কতা (Voice Safety Announcements)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              যেকোনো লেনদেন নিশ্চিতকরণের সময় সিস্টেম স্বয়ংক্রিয়ভাবে বাংলায় ঘোষণা করে টাকার পরিমাণ ও প্রাপকের নাম,
              যাতে কোনো ভুল হওয়ার সুযোগ না থাকে।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">৪. স্মার্ট মানি লক আইসোলেশন (Zero Vault Leakage)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              স্ট্রিক্ট মোডে জরুরি সঞ্চয়ে থাকা কোনো টাকা স্পর্শ করা অসম্ভব। মোট ব্যালেন্স যথেষ্ট হলেও লক করা টাকা বাদ দিয়ে
              যদি ব্যবহারযোগ্য টাকা কম হয়, লেনদেন কঠোরভাবে প্রত্যাখ্যাত হবে।
            </p>
          </div>
        </div>

        {/* ─── LIVE INTERACTIVE SAFETY SIMULATOR ───────────────── */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              নিরাপত্তা শিল্ড টেস্ট সিমুলেটর (Live Interactive Test)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            কোনো টাকা খরচ না করেই স্ট্রিক্ট মোডের দ্বৈত নিশ্চিতকরণ ও বড় অঙ্কের সতর্কতা অভিজ্ঞতা পরীক্ষা করুন:
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                টেস্ট লেনদেন: অপরিচিত নম্বরে ৳৬,০০০ সেন্ড মানি
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                এটি একটি ডেমো সিমুলেশন — আপনার আসল ব্যালেন্সে কোনো প্রভাব পড়বে না
              </span>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={handleTestSimulation}
            >
              সিমুলেশন পরীক্ষা করুন
            </Button>
          </div>
        </div>

        {/* Simulation Modal */}
        <ConfirmationModal
          isOpen={isSimulating}
          onClose={() => setIsSimulating(false)}
          onConfirm={(pin) => {
            setIsSimulating(false);
            showToast.success('সিমুলেশন সফল! স্ট্রিক্ট মোডের দ্বৈত নিশ্চিতকরণ যাচাই হয়েছে।');
          }}
          title="বড় অঙ্কের লেনদেন সিমুলেশন"
          recipient="অপরিচিত নম্বর (০১৯৮৮-১১২২৩৩)"
          amount={6000}
          fee={0}
          availableBalance={user?.availableBalance || 13500}
          isStrictMode={true}
          anomalySignal={{
            level: 'WARNING',
            title: 'উচ্চ মূল্যের লেনদেনের সতর্কতা (High Value Alert)',
            messageBangla: 'সতর্কতা: ৳৬,০০০ টাকা আপনার সাধারণ লেনদেনের চেয়ে বেশি। প্রাপক অপরিচিত। নিশ্চিত করতে তথ্য মিলিয়ে নিন।',
            requiresDoubleConfirmation: true,
          }}
        />
      </div>
    </Layout>
  );
}
