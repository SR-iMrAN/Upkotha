import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, X, Lock, AlertCircle, Volume2, ShieldCheck } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';
import Button from './Button';

/**
 * ConfirmationModal: High-security authorization modal with Strict Mode & Double Confirmation.
 * Enforces PIN collection and human authorization before simulated transaction execution.
 */
export default function ConfirmationModal({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'লেনদেন নিশ্চিতকরণ',
  recipient = 'রাকিব (০১৭xxxxxxxx)',
  amount = 500,
  fee = 0,
  availableBalance = 13500,
  isStrictMode = false,
  anomalyWarning = null,
  anomalySignal = null,
  voiceBiometric = null,
  isLoading = false,
}) {
  const { speak } = useVoice();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  // Determine if double confirmation is required
  const isHighValue = amount >= 5000;
  const requiresDoubleConfirmation =
    anomalySignal?.requiresDoubleConfirmation ||
    (isStrictMode && isHighValue) ||
    Boolean(anomalyWarning);

  const activeWarning =
    anomalySignal?.messageBangla ||
    anomalyWarning ||
    (isStrictMode && isHighValue
      ? `সতর্কতা: ৳${new Intl.NumberFormat('bn-BD').format(amount)} টাকা একটি বড় অঙ্কের লেনদেন। নিশ্চিত করতে তথ্য মিলিয়ে নিন।`
      : null);

  // Announce audio warning on open if high-value or anomaly
  useEffect(() => {
    if (isOpen && (isHighValue || isStrictMode || anomalySignal)) {
      const speechText =
        isHighValue
          ? `সতর্কতা: এটি একটি বড় অঙ্কের লেনদেন, ৳${new Intl.NumberFormat('bn-BD').format(amount)} টাকা। অনুগ্রহ করে প্রাপকের তথ্য ভালোভাবে দেখে নিন।`
          : isStrictMode
          ? 'স্ট্রিক্ট মোড সক্রিয়। প্রাপক ও টাকার পরিমাণ সতর্কতার সাথে যাচাই করুন।'
          : null;

      if (speechText) {
        speak(speechText);
      }
    } else {
      setIsAcknowledged(false);
      setPin('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const totalDeduction = amount + fee;
  const remainingBalance = availableBalance - totalDeduction;

  const handleConfirm = () => {
    if (requiresDoubleConfirmation && !isAcknowledged) {
      setError('লেনদেন সম্পন্ন করতে নিচের চেকবক্সটিতে টিক দিন');
      return;
    }

    if (!pin || pin.length < 4) {
      setError('অনুগ্রহ করে সঠিক ৪ ডিজিটের পিন (PIN) দিন');
      return;
    }
    setError('');
    onConfirm(pin);
  };

  const formatBDT = (val) => new Intl.NumberFormat('bn-BD').format(val || 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
    >
      <div
        className={`bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative transition-all ${
          isStrictMode
            ? 'border-2 border-slate-900 ring-2 ring-emerald-600/30'
            : 'border border-slate-200'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          aria-label="মডাল বন্ধ করুন"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-500"
          title="বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isStrictMode ? 'bg-emerald-700 text-white shadow-xs' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                id="confirmation-modal-title"
                className={`font-bold text-slate-900 ${isStrictMode ? 'text-lg' : 'text-base'}`}
              >
                {title}
              </h3>
              {isStrictMode && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  স্ট্রিক্ট মোড
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">লেনদেনটি সম্পন্ন করতে আপনার তথ্য যাচাই করুন</p>
          </div>
        </div>

        {/* Strict Mode / Anomaly Alert Banner */}
        {activeWarning && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
              isHighValue || anomalySignal?.level === 'WARNING'
                ? 'bg-rose-50 border-2 border-rose-300 text-rose-950'
                : 'bg-amber-50 border border-amber-300 text-amber-900'
            }`}
          >
            <ShieldAlert
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                isHighValue || anomalySignal?.level === 'WARNING' ? 'text-rose-600' : 'text-amber-600'
              }`}
            />
            <div>
              <p className="font-bold">
                {anomalySignal?.title || (isHighValue ? 'উচ্চ মূল্যের লেনদেন সতর্কতা' : 'স্ট্রিক্ট মোড সতর্কতা')}
              </p>
              <p className="mt-0.5 leading-relaxed font-normal">{activeWarning}</p>
            </div>
          </div>
        )}

        {/* Transaction Summary Card */}
        <div
          className={`mt-4 rounded-xl p-4 space-y-2.5 ${
            isStrictMode
              ? 'bg-slate-100 border border-slate-300 text-slate-800 text-sm'
              : 'bg-slate-50 border border-slate-200 text-xs text-slate-600'
          }`}
        >
          <div className="flex justify-between items-center">
            <span>প্রাপক / সুবিধাভোগী:</span>
            <span className={`font-bold text-slate-900 ${isStrictMode ? 'text-base' : 'text-sm'}`}>
              {recipient}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>লেনদেনের পরিমাণ:</span>
            <span className={`font-extrabold text-slate-900 ${isStrictMode ? 'text-2xl font-mono' : 'text-base'}`}>
              ৳ {formatBDT(amount)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>সার্ভিস চার্জ:</span>
            <span className="font-medium text-emerald-700">
              {fee === 0 ? 'বিনামূল্যে (৳ ০)' : `৳ ${formatBDT(fee)}`}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-900 font-bold">
            <span>মোট কর্তন:</span>
            <span className={`font-black text-emerald-800 ${isStrictMode ? 'text-lg font-mono' : 'text-base'}`}>
              ৳ {formatBDT(totalDeduction)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span>লেনদেন পরবর্তী ব্যালেন্স:</span>
            <span className="font-medium text-slate-700">৳ {formatBDT(remainingBalance)}</span>
          </div>
        </div>

        {/* Double Confirmation Checkbox (for high-value or strict mode) */}
        {requiresDoubleConfirmation && (
          <div className="mt-4">
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-300 cursor-pointer hover:bg-amber-100/50 transition">
              <input
                type="checkbox"
                checked={isAcknowledged}
                onChange={(e) => {
                  setIsAcknowledged(e.target.checked);
                  setError('');
                }}
                className="checkbox checkbox-warning checkbox-sm mt-0.5 rounded"
              />
              <span className="text-xs text-amber-950 font-semibold leading-relaxed">
                আমি প্রাপকের নাম ও ৳{formatBDT(amount)} টাকার পরিমাণ সচেতনভাবে যাচাই করেছি এবং লেনদেনে সম্মতি দিচ্ছি।
              </span>
            </label>
          </div>
        )}

        {/* Voice Biometric Verification Badge */}
        {voiceBiometric && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ভয়েস বায়োমেট্রিক: {voiceBiometric.speaker || 'ইমরান হোসেন'}</span>
            </div>
            <span className="font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
              ✓ {voiceBiometric.confidence || 95}% মিল
            </span>
          </div>
        )}

        {/* Secure PIN Entry */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            নিরাপত্তা পিন (Demo PIN: 1234)
          </label>
          <input
            type="password"
            maxLength={4}
            value={pin}
            disabled={requiresDoubleConfirmation && !isAcknowledged}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            placeholder="••••"
            className={`w-full text-center tracking-widest font-mono py-2.5 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition ${
              isStrictMode ? 'text-2xl font-bold border-slate-400' : 'text-xl border-slate-300'
            } ${requiresDoubleConfirmation && !isAcknowledged ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
          />
          {error && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <Button variant="outline" fullWidth onClick={onClose} disabled={isLoading}>
            বাতিল করুন
          </Button>

          <Button
            variant="primary"
            fullWidth
            isLoading={isLoading}
            disabled={requiresDoubleConfirmation && !isAcknowledged}
            onClick={handleConfirm}
          >
            নিশ্চিত করুন
          </Button>
        </div>
      </div>
    </div>
  );
}
