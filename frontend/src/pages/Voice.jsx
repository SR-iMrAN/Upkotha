import React, { useState } from 'react';
import Layout from '../components/Layout';
import VoiceGuide from '../components/VoiceGuide';
import VoiceCommand from '../components/VoiceCommand';
import Button from '../components/Button';
import useVoiceAssistant from '../hooks/useVoiceAssistant';
import { useAuth } from '../context/AuthContext';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ShieldAlert,
  Play,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Code2,
} from 'lucide-react';

const TEST_COMMANDS = [
  { text: 'রাকিবকে ৫০০ টাকা পাঠাও', intent: 'send_money', label: 'সেন্ড মানি' },
  { text: 'আমার balance কত?', intent: 'check_balance', label: 'ব্যালেন্স যাচাই' },
  { text: 'রহিম স্টোর থেকে ২০০০ টাকা cash out করতে চাই', intent: 'cash_out', label: 'ক্যাশ আউট' },
  { text: 'আজকে কী কী transaction হয়েছে?', intent: 'transaction_history', label: 'লেনদেন তালিকা' },
  { text: '৫০০০ টাকা emergency-এর জন্য lock করো', intent: 'lock_money', label: 'মানি লক' },
  { text: 'আমার পরের bill কবে?', intent: 'show_reminders', label: 'বিল রিমাইন্ডার' },
  { text: 'গত মাসে সবচেয়ে বেশি কোথায় খরচ করেছি?', intent: 'transaction_history', label: 'খরচ বিশ্লেষণ' },
];

export default function Voice() {
  const { user, toggleStrictMode } = useAuth();
  const {
    isListening,
    isProcessing,
    isSpeaking,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    executeCommand,
  } = useVoiceAssistant('voice_studio');

  const [intentResult, setIntentResult] = useState(null);
  const [activeTab, setActiveTab] = useState('test');

  const handleTestCommand = async (commandText) => {
    stopListening();
    const res = await executeCommand(commandText, (result) => {
      setIntentResult(result);
    });
    if (res) setIntentResult(res);
  };

  return (
    <Layout
      title="ভয়েস টেস্ট ও ডায়াগনস্টিক ল্যাব (Voice Studio)"
      isStrictMode={user?.isStrictMode}
      onToggleStrictMode={toggleStrictMode}
      userName={user?.name}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Contextual Voice Guide */}
        <VoiceGuide
          pageContext="voice_studio"
          message="স্বাগতম উপকথা ভয়েস স্টুডিওতে। আপনি যেকোনো আর্থিক নির্দেশ বাংলায় বলে পরীক্ষা করতে পারেন।"
        />

        {/* Live Diagnostics Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isSupported ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                {isSupported ? 'Web Speech API সক্রিয় (bn-BD)' : 'স্পিচ এপিআই সমর্থিত নয়'}
              </h4>
              <p className="text-[11px] text-slate-500">
                ভাষা: বাংলা (বাংলাদেশ) • টেক্সট-টু-স্পিচ: সক্রিয়
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
              bn-BD
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              Ready
            </span>
          </div>
        </div>

        {/* ─── LIVE VOICE INTERACTION PANEL ──────────────────────── */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white shadow-lg border border-emerald-800/40 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-lg mx-auto space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              ভয়েস টু ইন্টেন্ট ল্যাব
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              বাংলায় বলুন, উপকথা বুঝবে
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              মাইক্রোফোনে চাপ দিয়ে স্বাভাবিক ভাষায় বলুন। উদাহরণ: "রাকিবকে ৫০০ টাকা পাঠাও" অথবা "আমার balance কত?"
            </p>

            {/* Central Big Mic Button */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => {
                  if (isListening) stopListening();
                  else startListening();
                }}
                className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white transition-all duration-300 active:scale-95 ${
                  isListening
                    ? 'bg-rose-600 ring-8 ring-rose-400/30 shadow-2xl animate-pulse scale-105'
                    : 'bg-emerald-600 hover:bg-emerald-500 ring-4 ring-emerald-400/20 shadow-xl'
                }`}
                title="মাইক্রোফোন চালু/বন্ধ করুন"
              >
                {isListening ? (
                  <Mic className="w-10 h-10 animate-bounce" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>

              <div className="mt-3">
                <span className={`text-xs font-semibold ${isListening ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                  {isListening ? 'শুনছি... এখন কথা বলুন' : 'কথা বলতে মাইক্রোফোনে ক্লিক করুন'}
                </span>
              </div>
            </div>

            {/* Live Transcript Stream */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/10 min-h-[60px] flex items-center justify-center text-center">
              {transcript ? (
                <div>
                  <span className="text-[10px] text-emerald-300 uppercase tracking-wider block mb-0.5">
                    শনাক্তকৃত বক্তব্য:
                  </span>
                  <p className="text-base sm:text-lg font-bold text-white">
                    "{transcript}"
                  </p>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  (কোনো বক্তব্য এখনও শনাক্ত হয়নি)
                </span>
              )}
            </div>

            {/* Process Button if transcript exists */}
            {transcript && !isListening && (
              <Button
                variant="primary"
                fullWidth
                size="md"
                isLoading={isProcessing}
                onClick={() => handleTestCommand(transcript)}
                className="bg-emerald-600 hover:bg-emerald-500 border-none shadow-md"
              >
                এই বক্তব্য বিশ্লেষণ করুন
              </Button>
            )}
          </div>
        </div>

        {/* ─── SAMPLE VOICE COMMAND CHIPS ───────────────────────── */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              নমুনা ভয়েস কমান্ড (সরাসরি ক্লিক করে পরীক্ষা করুন):
            </h3>
            <span className="text-xs text-slate-400">৭টি নমুনা</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TEST_COMMANDS.map((cmd) => (
              <button
                key={cmd.text}
                type="button"
                onClick={() => handleTestCommand(cmd.text)}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition flex items-center justify-between group"
              >
                <div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 group-hover:bg-emerald-200 text-slate-700 group-hover:text-emerald-900 transition">
                    {cmd.label}
                  </span>
                  <p className="text-xs font-semibold text-slate-800 mt-1">
                    "{cmd.text}"
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>

        {/* ─── AI INTENT EXTRACTION RESULT ───────────────────────── */}
        {intentResult && (
          <div className="p-6 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  এআই স্ট্রাকচার্ড ইন্টেন্ট ও এন্টিটি এক্সট্র্যাকশন
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                কনফিডেন্স: {Math.round(intentResult.confidence * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">শনাক্তকৃত ইন্টেন্ট (Intent):</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{intentResult.intent}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">কনফার্মেশন প্রয়োজন:</span>
                <span className="font-bold text-slate-800">
                  {intentResult.requiresConfirmation ? 'হ্যাঁ (পিন বা অনুমোদন প্রয়োজন)' : 'না'}
                </span>
              </div>
            </div>

            {/* Extracted Entities */}
            {intentResult.entities && Object.keys(intentResult.entities).length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1">
                  শনাক্তকৃত এন্টিটি (Extracted Entities):
                </span>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 text-xs font-mono overflow-x-auto">
                  {JSON.stringify(intentResult.entities, null, 2)}
                </pre>
              </div>
            )}

            {/* Spoken Bangla Reply */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-emerald-800 block">উপকথার বাচনিক উত্তর:</span>
                <p className="text-xs sm:text-sm font-medium text-emerald-950">
                  "{intentResult.replyTextBangla}"
                </p>
              </div>
              <button
                type="button"
                onClick={() => speak(intentResult.replyTextBangla)}
                className="p-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shrink-0 ml-3"
                title="উত্তরটি শুনুন"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        )}

        {/* ─── RESPONSIBLE AI & PRIVACY CHARTER ─────────────────── */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>উপকথা দায়িত্বশীল এআই এবং প্রাইভেসি প্রতিশ্রুতি:</span>
          </div>
          <p className="text-amber-800 leading-relaxed font-normal">
            ১. ভয়েসের মাধ্যমে কখনো পিন (PIN), ওটিপি (OTP) বা পাসওয়ার্ড সংগ্রহ করা হয় না। <br />
            ২. কোনো অডিও রেকর্ডিং সার্ভারে জমা রাখা হয় না। ব্রাউজার স্পিচ এপিআই শুধুমাত্র টেক্সট আকারে রূপান্তর করে। <br />
            ৩. কোনো লেনদেন কেবলমাত্র কথার ভিত্তিতে কার্যকর হয় না — পিন দেওয়া বাধ্যতামূলক।
          </p>
        </div>
      </div>
    </Layout>
  );
}
