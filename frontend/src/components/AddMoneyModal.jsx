import React, { useState } from 'react';
import { X, PlusCircle, Building2, CreditCard, Store, CheckCircle2, ArrowRight } from 'lucide-react';
import Button from './Button';
import { showToast } from '../utils/alert';
import { useVoice } from '../context/VoiceContext';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const SOURCES = [
  { id: 'bank', name: 'ব্যাংক অ্যাকাউন্ট', icon: Building2, desc: 'সরাসরি ব্যাংক থেকে ট্রান্সফার' },
  { id: 'card', name: 'ডেবিট / ক্রেডিট কার্ড', icon: CreditCard, desc: 'ভিসা বা মাস্টারকার্ড' },
  { id: 'agent', name: 'এজেন্ট ক্যাশ-ইন', icon: Store, desc: 'নিকটস্থ এজেন্ট পয়েন্ট থেকে' },
];

export default function AddMoneyModal({ isOpen, onClose, currentAvailable = 15000, onAddMoneySuccess }) {
  const [amount, setAmount] = useState('1000');
  const [source, setSource] = useState('bank');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { speak } = useVoice();

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;
  const projectedBalance = currentAvailable + numAmount;

  const handleConfirm = async () => {
    if (numAmount < 10) {
      showToast.error('সর্বনিম্ন ১০ টাকা যোগ করা যাবে');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedSource = SOURCES.find(s => s.id === source);
      const channelName = selectedSource?.name || 'ব্যাংক অ্যাকাউন্ট';

      if (onAddMoneySuccess) {
        await onAddMoneySuccess({
          amount: numAmount,
          channel: channelName,
        });
      }

      speak(`আপনার অ্যাকাউন্টে ${numAmount} টাকা সফলভাবে যোগ করা হয়েছে। নতুন উপলব্ধ ব্যালেন্স ${projectedBalance} টাকা।`);
      showToast.success(`৳${numAmount.toLocaleString('bn-BD')} টাকা সফলভাবে যোগ হয়েছে!`);
      onClose();
    } catch (err) {
      showToast.error('টাকা যোগ করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">অ্যাড মানি (Add Money)</h3>
              <p className="text-xs text-slate-500">আপনার ওয়ালেটে ডেমো ব্যালেন্স যোগ করুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Input & Quick Chips */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">টাকার পরিমাণ (BDT)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">৳</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(String(amt))}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${
                  numAmount === amt
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ৳{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Source Channels */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">অর্থের উৎস নির্বাচন করুন</label>
          <div className="space-y-2">
            {SOURCES.map((s) => {
              const Icon = s.icon;
              const isSelected = source === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSource(s.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{s.name}</span>
                      <span className="text-[10px] text-slate-500">{s.desc}</span>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Balance Preview */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">পরবর্তী উপলব্ধ ব্যালেন্স:</span>
            <span className="font-bold text-emerald-700 text-sm">৳{projectedBalance.toLocaleString('bn-BD')}</span>
          </div>
          <span className="text-[11px] text-slate-500">চার্জ: ৳০ (ফ্রি)</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" size="md" onClick={onClose} className="flex-1 justify-center">
            বাতিল
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={ArrowRight}
            onClick={handleConfirm}
            isLoading={isSubmitting}
            className="flex-1 justify-center"
          >
            টাকা যোগ করুন
          </Button>
        </div>
      </div>
    </div>
  );
}
