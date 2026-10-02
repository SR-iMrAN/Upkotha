import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, X, Lock, AlertCircle } from 'lucide-react';
import Button from './Button';

/**
 * ConfirmationModal: High-security authorization modal
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
  isLoading = false,
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const totalDeduction = amount + fee;
  const remainingBalance = availableBalance - totalDeduction;

  const handleConfirm = () => {
    if (!pin || pin.length < 4) {
      setError('অনুগ্রহ করে সঠিক ৪ ডিজিটের পিন (PIN) দিন');
      return;
    }
    setError('');
    onConfirm(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">লেনদেনটি সম্পন্ন করতে আপনার তথ্য যাচাই করুন</p>
          </div>
        </div>

        {/* Strict Mode / Anomaly Alert if triggered */}
        {(isStrictMode || anomalyWarning) && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {isStrictMode ? 'স্ট্রিক্ট মোড (Strict Mode) সক্রিয় রয়েছে' : 'সতর্কতা সংকেত'}
              </p>
              <p className="text-amber-800 mt-0.5">
                {anomalyWarning || 'লেনদেনটি চূড়ান্ত করার পূর্বে প্রাপক এবং টাকার পরিমাণ পুনরায় যাচাই করুন।'}
              </p>
            </div>
          </div>
        )}

        {/* Transaction Summary Card */}
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span>প্রাপক / সুবিধাভোগী:</span>
            <span className="font-semibold text-slate-800">{recipient}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>লেনদেনের পরিমাণ:</span>
            <span className="font-bold text-slate-900 text-sm">৳ {new Intl.NumberFormat('bn-BD').format(amount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>সার্ভিস চার্জ:</span>
            <span className="font-medium text-emerald-600">{fee === 0 ? 'বিনামূল্যে (৳ 0)' : `৳ ${fee}`}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-800 font-semibold">
            <span>মোট কর্তন:</span>
            <span className="text-sm font-bold text-emerald-800">৳ {new Intl.NumberFormat('bn-BD').format(totalDeduction)}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span>লেনদেন পরবর্তী ব্যালেন্স:</span>
            <span>৳ {new Intl.NumberFormat('bn-BD').format(remainingBalance)}</span>
          </div>
        </div>

        {/* Secure PIN Entry */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            নিরাপত্তা পিন (Demo PIN: 1234)
          </label>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            placeholder="••••"
            className="w-full text-center text-xl tracking-widest font-mono py-2.5 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          />
          {error && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={isLoading}
          >
            বাতিল করুন
          </Button>

          <Button
            variant="primary"
            fullWidth
            isLoading={isLoading}
            onClick={handleConfirm}
          >
            নিশ্চিত করুন
          </Button>
        </div>
      </div>
    </div>
  );
}
