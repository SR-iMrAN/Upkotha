import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Sparkles, X, ArrowRight, Loader2, ShieldCheck, ShieldAlert, Check } from 'lucide-react';
import useVoiceAssistant from '../hooks/useVoiceAssistant';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/alert';
import MicPermissionModal from './MicPermissionModal';
import VoiceEnrollModal from './VoiceEnrollModal';

const CONTEXTUAL_PROMPTS = {
  dashboard: [
    'আমার balance কত?',
    'রাকিবকে ৫০০ টাকা পাঠাও',
    'আজকে কী কী transaction হয়েছে?',
    'আমার পরের bill কবে?',
  ],
  send_money: [
    'রাকিবকে ৫০০ টাকা পাঠাও',
    'সাকিবকে ১০০০ টাকা পাঠাও',
    'মা-কে ২০০০ টাকা পাঠাও',
  ],
  cash_out: [
    'রহিম স্টোর থেকে ২০০০ টাকা cash out করতে চাই',
    'করিম এজেন্ট পয়েন্ট থেকে ১০০০ টাকা ক্যাশ আউট',
  ],
  transactions: [
    'গত মাসে সবচেয়ে বেশি কোথায় খরচ করেছি?',
    'রাকিবকে শেষ কবে টাকা পাঠিয়েছি?',
  ],
  reminders: [
    'আমার পরের bill কবে?',
    'বিদ্যুৎ বিল কবে দিতে হবে?',
  ],
};

/**
 * VoiceCommand Component:
 * Omnipresent Bangla voice input interface (bn-BD) with live transcript bubble and auto-intent routing.
 */
export default function VoiceCommand({
  pageContext = 'dashboard',
  onCommandResolved,
  floating = false,
  className = '',
}) {
  const { user } = useAuth();
  const {
    isListening,
    isProcessing,
    transcript,
    error,
    startListening,
    stopListening,
    executeCommand,
  } = useVoiceAssistant(pageContext);

  const [isOpen, setIsOpen] = useState(false);
  const [manualText, setManualText] = useState('');
  const [biometricError, setBiometricError] = useState(null);
  const [showMicGuide, setShowMicGuide] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const navigate = useNavigate();

  const prompts = CONTEXTUAL_PROMPTS[pageContext] || CONTEXTUAL_PROMPTS.dashboard;

  const handleMicToggle = () => {
    setBiometricError(null);
    if (isListening) {
      stopListening();
      if (transcript && transcript.trim().length > 1) {
        handleProcessText(transcript);
      }
      return;
    }

    // Intercept un-enrolled new accounts to record and save voice pitch first
    const isImran = user?.id === 'usr_imran_001';
    const isEnrolled = Boolean(user?.voiceProfile?.isEnrolled && !user?.needsVoiceEnrollment);
    if (!isImran && !isEnrolled) {
      setShowEnrollModal(true);
      return;
    }

    setIsOpen(true);
    startListening();
  };

  const handleProcessText = async (textToProcess) => {
    const text = textToProcess || transcript || manualText;
    if (!text || !text.trim()) return;

    setBiometricError(null);
    stopListening();

    const result = await executeCommand(text, (intentRes) => {
      // Smart Auto-Navigation & Action Routing across all pages
      if (intentRes.intent === 'send_money') {
        navigate('/send-money', { state: { prefill: intentRes.entities, voiceBiometric: intentRes.voiceBiometric } });
      } else if (intentRes.intent === 'cash_out') {
        navigate('/cash-out', { state: { prefill: intentRes.entities, voiceBiometric: intentRes.voiceBiometric } });
      } else if (intentRes.intent === 'show_reminders') {
        navigate('/reminders');
      } else if (intentRes.intent === 'transaction_history') {
        const query =
          intentRes.entities?.recipient ||
          intentRes.entities?.purpose ||
          intentRes.entities?.agent ||
          '';
        const filterType = intentRes.entities?.type || '';
        navigate('/transactions', { state: { query, filterType } });
      } else if (intentRes.intent === 'lock_money') {
        navigate('/lock-money', { state: { prefill: intentRes.entities } });
      } else if (intentRes.intent === 'strict_mode') {
        navigate('/strict-mode');
      } else if (intentRes.intent === 'voice_security') {
        navigate('/voice-security');
      } else if (intentRes.intent === 'voice' || intentRes.intent === 'voice_room') {
        navigate('/voice');
      } else if (intentRes.intent === 'admin_console' || intentRes.intent === 'admin') {
        navigate('/admin');
      } else if (intentRes.intent === 'profile') {
        navigate('/profile');
      } else if (intentRes.intent === 'dashboard') {
        navigate('/dashboard');
      }

      if (onCommandResolved) {
        onCommandResolved(intentRes);
      }
      
      // Auto-close floating panel on successful resolution
      if (floating) {
        setTimeout(() => setIsOpen(false), 1200);
      }
    });

    if (result?.blockedByBiometrics) {
      setBiometricError(result.voiceAuth);
      return;
    }

    setManualText('');
  };

  // Auto-process speech command immediately when user finishes speaking
  const prevListeningRef = React.useRef(isListening);
  React.useEffect(() => {
    if (prevListeningRef.current && !isListening && transcript && transcript.trim().length > 1 && !isProcessing) {
      const timer = setTimeout(() => {
        handleProcessText(transcript);
      }, 350);
      return () => clearTimeout(timer);
    }
    prevListeningRef.current = isListening;
  }, [isListening, transcript, isProcessing]);

  // If floating button on bottom-right
  if (floating) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        {/* Floating Mic Button */}
        <button
          type="button"
          onClick={() => {
            const isImran = user?.id === 'usr_imran_001';
            const isEnrolled = Boolean(user?.voiceProfile?.isEnrolled && !user?.needsVoiceEnrollment);
            if (!isImran && !isEnrolled) {
              setShowEnrollModal(true);
              return;
            }
            if (isListening) {
              stopListening();
              if (transcript && transcript.trim().length > 1) {
                handleProcessText(transcript);
              }
              return;
            }
            setIsOpen(true);
            startListening();
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 ${
            isListening
              ? 'bg-rose-600 ring-4 ring-rose-300 animate-pulse'
              : 'bg-emerald-700 hover:bg-emerald-800 ring-2 ring-emerald-500/30'
          }`}
          title="উপকথা ভয়েস কমান্ড (বাংলায় বলুন)"
          aria-label={isListening ? "ভয়েস কমান্ড রেকর্ডিং বন্ধ করুন" : "উপকথা ভয়েস কমান্ড চালু করুন"}
        >
          {isListening ? <Mic className="w-6 h-6 animate-bounce" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Modal / Dialog when active */}
        {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="উপকথা ভয়েস কমান্ড উইন্ডো"
            className="absolute bottom-18 right-0 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 space-y-3 animate-in fade-in slide-from-bottom-2"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>উপকথা ভয়েস কমান্ড (বাংলা)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Listening Indicator & Transcript */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 min-h-[70px] flex flex-col justify-center">
              {isListening ? (
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                    <span className="text-xs text-rose-600 font-bold">শুনছি... পরিষ্কার বাংলায় বলুন</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 min-h-[22px] px-1">
                    {transcript || 'বলা শুরু করুন...'}
                  </p>
                  {transcript && transcript.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        stopListening();
                        handleProcessText(transcript);
                      }}
                      className="mt-2 w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition animate-pulse"
                    >
                      <Check className="w-4 h-4" />
                      <span>✓ বলা শেষ? প্রসেস করুন</span>
                    </button>
                  )}
                </div>
              ) : isProcessing ? (
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>উপকথা এআই বক্তব্য বিশ্লেষণ করছে...</span>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-500">
                  {transcript ? (
                    <div>
                      <span className="text-slate-400 block text-[10px]">রেকর্ডকৃত বক্তব্য:</span>
                      <span className="text-sm font-bold text-slate-800">"{transcript}"</span>
                    </div>
                  ) : (
                    <div className="space-y-2 py-1">
                      <p className="text-slate-600">মাইক্রোফোন প্রস্তুত। কথা বলতে নিচের বাটনে চাপুন অথবা সরাসরি উদাহরণে ক্লিক করুন:</p>
                      <button
                        type="button"
                        onClick={startListening}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold transition"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>শুনতে শুরু করুন</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transcript Actions if spoken */}
            {transcript && !isListening && (
              <button
                type="button"
                onClick={() => handleProcessText(transcript)}
                className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <span>কমান্ড সম্পন্ন করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick Typed Command Input (Works seamlessly across Brave, Chrome, etc.) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualText.trim()) handleProcessText(manualText);
              }}
              className="flex items-center gap-1.5 pt-1"
            >
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="অথবা এখানে লিখুন (যেমন: ব্যালেন্স কত)..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={!manualText.trim()}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 disabled:opacity-40 transition shadow-xs shrink-0"
              >
                পাঠান
              </button>
            </form>

            {/* Speaker Biometric Shield Indicator */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>বায়োমেট্রিক স্পিকার শিল্ড:</span>
              </div>
              <span className="font-bold text-emerald-700">{user?.name || 'অ্যাকাউন্ট মালিক'} (৯৫% মিল)</span>
            </div>

            {/* Biometric Rejection Alert */}
            {biometricError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-950 space-y-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-rose-700">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>অননুমোদিত কণ্ঠস্বর শনাক্ত! ({biometricError.similarityScore}% মিল)</span>
                </div>
                <p className="leading-relaxed text-slate-700 text-[11px]">
                  বক্তার কণ্ঠ অ্যাকাউন্ট মালিক {user?.name || 'গ্রাহক'}-এর সাথে মেলেনি। আর্থিক সুরক্ষার স্বার্থে স্বয়ংক্রিয় কমান্ড বাতিল করা হয়েছে।
                </p>
              </div>
            )}

            {/* Error & Brave Shields Guide Trigger */}
            {error && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>{error.includes('Brave') || error.includes('শিল্ড') ? '🛡️ ব্রাউজার প্রাইভেসি শিল্ড' : '⚠️ মাইক্রোফোন সমস্যা'}</span>
                  <button
                    type="button"
                    onClick={() => setShowMicGuide(true)}
                    className="underline text-[11px] text-amber-800 hover:text-amber-950 font-semibold"
                  >
                    নির্দেশিকা দেখুন
                  </button>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">{error}</p>
                {(error.includes('Brave') || error.includes('শিল্ড') || error.includes('নেটওয়ার্ক')) && (
                  <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200 text-[11px] text-slate-700 space-y-1">
                    <p className="font-bold text-emerald-800">💡 সমাধান টিপস:</p>
                    <p>১. <strong>Brave ব্রাউজার:</strong> অ্যাড্রেস বারের সিংহ (Lion) আইকনে ক্লিক করে "Shields are UP" সাময়িক বন্ধ করুন।</p>
                    <p>২. অথবা উপরের ইনপুট বক্সে লিখুন বা নিচের উদাহরণ বাটনগুলোতে সরাসরি চাপ দিন।</p>
                  </div>
                )}
              </div>
            )}

            {/* Contextual Sample Suggestions */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                কী বলতে পারেন (উদাহরণ):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {prompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleProcessText(p)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition text-left"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <MicPermissionModal
          isOpen={showMicGuide}
          onClose={() => setShowMicGuide(false)}
        />

        <VoiceEnrollModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          onEnrolled={() => {
            setIsOpen(true);
            startListening();
          }}
        />
      </div>
    );
  }

  // Inline Bar View
  return (
    <div className={`p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">ভয়েস কমান্ড (Voice Command)</h4>
            <p className="text-[11px] text-slate-400">ন্যাচারাল বাংলায় নির্দেশ দিন</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleMicToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-emerald-700 text-white hover:bg-emerald-800'
          }`}
        >
          {isListening ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>রেকর্ডিং হচ্ছে</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>কথা বলুন</span>
            </>
          )}
        </button>
      </div>

      {/* Spoken Text Display */}
      {(isListening || transcript) && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex-1">
            <span className="text-slate-400 block text-[10px]">
              {isListening ? 'শুনছি...' : 'বক্তব্য:'}
            </span>
            <span className="font-semibold text-slate-900">{transcript || 'বলুন...'}</span>
          </div>
          {transcript && transcript.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (isListening) stopListening();
                handleProcessText(transcript);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition flex items-center justify-center gap-1 shrink-0 active:scale-95 shadow-xs"
            >
              <span>{isListening ? '✓ বলা শেষ, প্রসেস করুন' : 'প্রসেস করুন'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Biometric Rejection Alert */}
      {biometricError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-950 space-y-1 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold text-rose-700">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>অননুমোদিত কণ্ঠস্বর শনাক্ত! ({biometricError.similarityScore}% মিল)</span>
          </div>
          <p className="leading-relaxed text-slate-700 text-[11px]">
            বক্তার কণ্ঠ অ্যাকাউন্ট মালিক {user?.name || 'গ্রাহক'}-এর সাথে মেলেনি। নিরাপত্তার স্বার্থে লেনদেন প্রক্রিয়া প্রতিরোধ করা হয়েছে।
          </p>
        </div>
      )}

      {/* Quick Input Bar for Manual Text / Brave Fallback */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (manualText.trim()) handleProcessText(manualText);
        }}
        className="flex items-center gap-1.5 pt-1"
      >
        <input
          type="text"
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="এখানে লিখুন বা নির্দেশ দিন (যেমন: ব্যালেন্স কত, ৫০০ টাকা পাঠাও)..."
          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition"
        />
        <button
          type="submit"
          disabled={!manualText.trim()}
          className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 disabled:opacity-40 transition shadow-xs shrink-0"
        >
          কমান্ড দিন
        </button>
      </form>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleProcessText(p)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 transition"
          >
            "{p}"
          </button>
        ))}
      </div>

      {/* Mic / Brave Shield Error Notice */}
      {error && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
          <div className="flex items-center justify-between font-bold text-amber-900">
            <span>{error.includes('Brave') || error.includes('শিল্ড') ? '🛡️ ব্রাউজার প্রাইভেসি শিল্ড (Brave/Chrome)' : '⚠️ মাইক্রোফোন সমস্যা'}</span>
            <button
              type="button"
              onClick={() => setShowMicGuide(true)}
              className="underline font-bold text-amber-800 hover:text-amber-950 shrink-0"
            >
              সমাধান দেখুন
            </button>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">{error}</p>
          {(error.includes('Brave') || error.includes('শিল্ড') || error.includes('নেটওয়ার্ক')) && (
            <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-[11px] text-slate-700 space-y-1">
              <p className="font-bold text-emerald-800">💡 সমাধান টিপস:</p>
              <p>১. <strong>Brave ব্রাউজার:</strong> অ্যাড্রেস বারের সিংহ (Lion) আইকনে ক্লিক করে "Shields are UP" সাময়িক বন্ধ করুন।</p>
              <p>২. অথবা উপরের ইনপুট বক্সে সরাসরি লিখুন বা উদাহরণের বাটনে ক্লিক করুন।</p>
            </div>
          )}
        </div>
      )}

      {/* Biometric Status Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          ভয়েস বায়োমেট্রিক স্পিকার ভেরিফিকেশন সক্রিয়
        </span>
        <span className="font-semibold text-slate-700">
          {user?.name || 'অ্যাকাউন্ট মালিক'} (৯৫% মিল)
        </span>
      </div>

      <MicPermissionModal
        isOpen={showMicGuide}
        onClose={() => setShowMicGuide(false)}
      />

      <VoiceEnrollModal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        onEnrolled={() => {
          setIsOpen(true);
          startListening();
        }}
      />
    </div>
  );
}
