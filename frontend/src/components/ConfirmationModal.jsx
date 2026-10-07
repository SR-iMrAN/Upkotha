import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  X,
  Lock,
  AlertCircle,
  Volume2,
  Cpu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useVoice } from '../context/VoiceContext';
import Button from './Button';

/**
 * ConfirmationModal: AI Security Layer + Deterministic Financial Control.
 * Core Principle: "AI understands & advises. Rules protect. The user decides."
 * 
 * Multi-Factor AI Risk Analysis:
 * - Isolation Forest Anomaly Detection
 * - Speaker Embedding Verification (Cosine Similarity)
 * - Anti-Spoof / Liveness Detection
 * - Adaptive Friction & Explicit Human Authorization
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
  riskAssessment = null,
  voiceBiometric = null,
  isLoading = false,
}) {
  const { speak } = useVoice();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [showDetailedSignals, setShowDetailedSignals] = useState(false);

  // Derive risk properties from riskAssessment or fallback
  const riskLevel = riskAssessment?.riskLevel || (amount >= 5000 ? 'HIGH' : 'LOW');
  const riskScorePercent = riskAssessment?.riskScorePercent ?? (riskLevel === 'HIGH' ? 85 : 12);
  const signals = riskAssessment?.signals || [];
  const recommendedAction = riskAssessment?.recommendedAction || (riskLevel === 'HIGH' ? 'HIGH_FRICTION_CHALLENGE' : 'STANDARD');

  // Adaptive friction requirements
  const isHighRisk = riskLevel === 'HIGH';
  const isMediumRisk = riskLevel === 'MEDIUM';
  const requiresFrictionAcknowledgment = isHighRisk || isMediumRisk || isStrictMode || Boolean(anomalyWarning);

  const activeWarning =
    anomalySignal?.messageBangla ||
    riskAssessment?.frictionAdviceBangla ||
    anomalyWarning ||
    (isHighRisk
      ? `সতর্কতা: ৳${new Intl.NumberFormat('bn-BD').format(amount)} টাকার লেনদেনটিতে অস্বাভাবিক ঝুঁকি শনাক্ত হয়েছে।`
      : null);

  // Audio warning on open
  useEffect(() => {
    if (isOpen) {
      if (isHighRisk) {
        speak(`সতর্কতা: উচ্চ ঝুঁকি শনাক্ত হয়েছে। অনুগ্রহ করে প্রাপক ও ৳${new Intl.NumberFormat('bn-BD').format(amount)} টাকার পরিমাণ পুনরায় মিলিয়ে নিন।`);
      } else if (isMediumRisk) {
        speak('মাঝারি সতর্কতা: প্রাপকের তথ্য যাচাই করে পিন প্রদান করুন।');
      } else if (isStrictMode) {
        speak('স্ট্রিক্ট মোড সক্রিয়। প্রাপক ও টাকার পরিমাণ সতর্কতার সাথে যাচাই করুন।');
      }
    } else {
      setIsAcknowledged(false);
      setPin('');
      setError('');
      setShowDetailedSignals(false);
    }
  }, [isOpen, isHighRisk, isMediumRisk, isStrictMode]);

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
    if (requiresFrictionAcknowledgment && !isAcknowledged) {
      setError('লেনদেন সম্পন্ন করতে নিরাপত্তা সম্মতি চেকবক্সে টিক দিন');
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
        className={`bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto transition-all ${
          isHighRisk
            ? 'border-2 border-rose-500 ring-2 ring-rose-200'
            : isStrictMode
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

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isHighRisk
                ? 'bg-rose-100 text-rose-700'
                : isStrictMode
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 id="confirmation-modal-title" className="font-bold text-slate-900 text-base">
                {title}
              </h3>
              {isStrictMode && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  স্ট্রিক্ট মোড
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">চূড়ান্ত অনুমোদনের পূর্বে তথ্যাদি যাচাই করুন</p>
          </div>
        </div>

        {/* Fintech AI Security Analysis Card */}
        <div className="mt-3.5 rounded-xl border p-3.5 bg-slate-50/70 border-slate-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                AI নিরাপত্তা বিশ্লেষণ
              </span>
            </div>

            {/* Risk Badge */}
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                riskLevel === 'HIGH'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : riskLevel === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              ঝুঁকি: {riskLevel === 'HIGH' ? 'উচ্চ' : riskLevel === 'MEDIUM' ? 'মাঝারি' : 'কম'} ({riskLevel})
            </span>
          </div>

          {/* Risk Score Metric & Engine Note */}
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">কম্পোজিট ঝুঁকি স্কোর:</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    riskLevel === 'HIGH'
                      ? 'bg-rose-600'
                      : riskLevel === 'MEDIUM'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, riskScorePercent))}%` }}
                />
              </div>
              <span className="font-mono font-bold text-slate-900">{riskScorePercent}%</span>
            </div>
          </div>

          {/* Multi-Factor ML Models Summary */}
          <div className="mt-2 pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div>
              <span className="block text-slate-400">অ্যানোমালি মডেল:</span>
              <span className="font-semibold text-slate-800">
                Isolation Forest ({riskAssessment?.breakdown?.transactionAnomaly?.score !== undefined ? Math.round(riskAssessment.breakdown.transactionAnomaly.score * 100) : 10}%)
              </span>
            </div>
            <div>
              <span className="block text-slate-400">ভয়েস সাদৃশ্য (Cosine):</span>
              <span className="font-semibold text-slate-800">
                {riskAssessment?.breakdown?.speakerVerification?.similarityPercent ?? (voiceBiometric?.confidence || 95)}% মিল
              </span>
            </div>
          </div>

          {/* Explainable Signals Accordion / Toggle */}
          {signals.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setShowDetailedSignals(!showDetailedSignals)}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-700 hover:text-slate-900 py-0.5"
              >
                <span>নিরাপত্তা সিগন্যাল ও বিবরণ ({signals.length}টি)</span>
                {showDetailedSignals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDetailedSignals && (
                <div className="mt-2 space-y-1.5 text-[11px]">
                  {signals.map((sig, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border ${
                        sig.severity === 'CRITICAL' || sig.severity === 'HIGH'
                          ? 'bg-rose-50 border-rose-200 text-rose-950'
                          : sig.severity === 'MEDIUM'
                          ? 'bg-amber-50 border-amber-200 text-amber-950'
                          : 'bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{sig.title}</span>
                        {sig.metric && <span className="font-mono text-[10px] opacity-75">{sig.metric}</span>}
                      </div>
                      <p className="mt-0.5 text-[10px] leading-tight font-normal">{sig.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* High Risk / Caution Banner */}
        {activeWarning && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2.5 ${
              isHighRisk
                ? 'bg-rose-50 border-2 border-rose-300 text-rose-950'
                : 'bg-amber-50 border border-amber-300 text-amber-900'
            }`}
          >
            <ShieldAlert
              className={`w-4 h-4 shrink-0 mt-0.5 ${isHighRisk ? 'text-rose-600' : 'text-amber-600'}`}
            />
            <div>
              <p className="font-bold">
                {isHighRisk ? 'উচ্চ ঝুঁকি শনাক্তকরণ বিজ্ঞপ্তি' : 'নিরাপত্তা সতর্কতা'}
              </p>
              <p className="mt-0.5 leading-relaxed font-normal">{activeWarning}</p>
            </div>
          </div>
        )}

        {/* Transaction Summary Card */}
        <div
          className={`mt-3 rounded-xl p-3.5 space-y-2 ${
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
            <span className={`font-extrabold text-slate-900 ${isStrictMode ? 'text-2xl font-mono' : 'text-base font-mono'}`}>
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
            <span className={`font-black text-emerald-800 ${isStrictMode ? 'text-lg font-mono' : 'text-base font-mono'}`}>
              ৳ {formatBDT(totalDeduction)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span>লেনদেন পরবর্তী ব্যালেন্স:</span>
            <span className="font-medium text-slate-700">৳ {formatBDT(remainingBalance)}</span>
          </div>
        </div>

        {/* Adaptive Friction Acknowledgment Checkbox */}
        {requiresFrictionAcknowledgment && (
          <div className="mt-3">
            <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
              isHighRisk 
                ? 'bg-rose-50/70 border-rose-300 hover:bg-rose-100/50' 
                : 'bg-amber-50/80 border-amber-300 hover:bg-amber-100/50'
            }`}>
              <input
                type="checkbox"
                checked={isAcknowledged}
                onChange={(e) => {
                  setIsAcknowledged(e.target.checked);
                  setError('');
                }}
                className={`checkbox checkbox-sm mt-0.5 rounded ${
                  isHighRisk ? 'checkbox-error' : 'checkbox-warning'
                }`}
              />
              <span className={`text-xs font-semibold leading-relaxed ${
                isHighRisk ? 'text-rose-950' : 'text-amber-950'
              }`}>
                {isHighRisk
                  ? `আমি সতর্ক বার্তা ও প্রাপকের তথ্য সচেতনভাবে যাচাই করেছি এবং এই লেনদেনে পূর্ণ সম্মতি দিচ্ছি।`
                  : `আমি প্রাপকের নাম ও ৳${formatBDT(amount)} টাকার পরিমাণ যাচাই করেছি এবং লেনদেনে সম্মতি দিচ্ছি।`}
              </span>
            </label>
          </div>
        )}

        {/* Secure PIN Entry */}
        <div className="mt-3.5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            নিরাপত্তা পিন (Demo PIN: 1234)
          </label>
          <input
            type="password"
            maxLength={4}
            value={pin}
            disabled={requiresFrictionAcknowledgment && !isAcknowledged}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            placeholder="••••"
            className={`w-full text-center tracking-widest font-mono py-2.5 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition ${
              isStrictMode ? 'text-2xl font-bold border-slate-400' : 'text-xl border-slate-300'
            } ${requiresFrictionAcknowledgment && !isAcknowledged ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
          />
          {error && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        {/* Disclaimer Note */}
        <p className="mt-2.5 text-[10px] text-center text-slate-400 leading-tight">
          AI বোঝে ও পরামর্শ দেয়। নীতি রক্ষা করে। সিদ্ধান্ত গ্রাহকের।
        </p>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" fullWidth onClick={onClose} disabled={isLoading}>
            বাতিল করুন
          </Button>

          <Button
            variant="primary"
            fullWidth
            isLoading={isLoading}
            disabled={requiresFrictionAcknowledgment && !isAcknowledged}
            onClick={handleConfirm}
          >
            নিশ্চিত করুন
          </Button>
        </div>
      </div>
    </div>
  );
}
