import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, Wallet, ArrowUpRight, ArrowDownLeft, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import AddMoneyModal from './AddMoneyModal';

/**
 * BalanceCard: Displays Available Balance, Locked Money, and Total Balance
 * Features real-time animated number interpolation and visual deduction pulse (no emojis).
 */
export default function BalanceCard({
  available = 13500,
  locked = 5000,
  userName = 'ইমরান',
  accountNumber = '01712-345678',
  onAddMoney,
}) {
  const { isEnglish } = useLanguage();
  const [showBalance, setShowBalance] = useState(true);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

  // Animated numerical counter state
  const [displayedAvailable, setDisplayedAvailable] = useState(available);
  const [animationState, setAnimationState] = useState(null); // 'deducting' | 'adding' | null
  const prevAvailableRef = useRef(available);

  useEffect(() => {
    const prev = prevAvailableRef.current;
    if (prev !== available) {
      const isDecrease = available < prev;
      setAnimationState(isDecrease ? 'deducting' : 'adding');

      const start = prev;
      const end = available;
      const duration = 700;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic formula
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.round(start + (end - start) * easeOut);
        setDisplayedAvailable(currentVal);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayedAvailable(end);
          setTimeout(() => setAnimationState(null), 600);
        }
      };

      requestAnimationFrame(animate);
      prevAvailableRef.current = available;
    }
  }, [available]);

  const total = displayedAvailable + locked;

  const formatBDT = (amount) => {
    return new Intl.NumberFormat('bn-BD').format(amount);
  };

  return (
    <>
      <div className={`w-full rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white p-6 shadow-lg border border-emerald-700/40 relative overflow-hidden transition-all duration-300 ${
        animationState === 'deducting'
          ? 'ring-2 ring-rose-400/80 shadow-rose-900/30'
          : animationState === 'adding'
          ? 'ring-2 ring-emerald-300/80 shadow-emerald-900/30'
          : ''
      }`}>
        {/* Subtle decorative geometric overlay */}
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-emerald-600/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-44 h-44 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />

        {/* Account Info Header */}
        <div className="flex items-center justify-between relative z-10 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200 border border-white/10 font-bold">
              {userName ? userName.charAt(0) : 'ই'}
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{userName}</h3>
              <p className="text-xs text-emerald-200/80 tracking-wide font-mono">{accountNumber}</p>
            </div>
          </div>

          <button
            onClick={() => setShowBalance(!showBalance)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-xs text-emerald-100 transition-colors border border-white/10"
            title={showBalance ? (isEnglish ? 'Hide balance' : 'ব্যালেন্স লুকান') : (isEnglish ? 'Show balance' : 'ব্যালেন্স দেখুন')}
          >
            {showBalance ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isEnglish ? 'Hide' : 'লুকান'}</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isEnglish ? 'Show' : 'দেখুন'}</span>
              </>
            )}
          </button>
        </div>

        {/* Main Balances Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-5 relative z-10">
          {/* Available Balance (Spendable) */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-emerald-200 font-medium flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-300" />
                {isEnglish ? 'Available Balance' : 'ব্যবহারযোগ্য ব্যালেন্স'}
              </span>
              {animationState === 'deducting' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40 animate-pulse">
                  {isEnglish ? 'Deducted' : 'কর্তন সম্পন্ন'}
                </span>
              )}
              {animationState === 'adding' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-300/40 animate-pulse">
                  {isEnglish ? 'Added' : 'অর্থ যোগ হয়েছে'}
                </span>
              )}
            </div>

            <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-baseline gap-1">
              <span>৳</span>
              <span className={animationState === 'deducting' ? 'text-rose-200 transition-colors' : animationState === 'adding' ? 'text-emerald-200 transition-colors' : ''}>
                {showBalance ? formatBDT(displayedAvailable) : '••••••'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/70 mt-1">
              {isEnglish ? 'Ready for immediate transactions' : 'লেনদেনের জন্য সম্পূর্ণ প্রস্তুত'}
            </p>
          </div>

          {/* Locked Money (Safe / Inviolable) */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-200 font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                {isEnglish ? 'Locked Emergency Savings' : 'সুরক্ষিত/লক করা টাকা'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30">
                {isEnglish ? 'Safety Reserve' : 'জরুরি সঞ্চয়'}
              </span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-amber-100 mt-2">
              ৳ {showBalance ? formatBDT(locked) : '••••••'}
            </div>
            <div className="flex items-center justify-between text-[11px] text-emerald-200/80 pt-2 border-t border-white/5 mt-2">
              <span>{isEnglish ? 'Total Combined Assets:' : 'মোট সর্বমোট সম্পদ:'}</span>
              <span className="font-semibold text-white">৳ {showBalance ? formatBDT(total) : '••••••'}</span>
            </div>
          </div>
        </div>

        {/* 4 Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 relative z-10">
          <Link
            to="/send-money"
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-white/10 hover:bg-emerald-600/50 text-white text-xs font-medium transition border border-white/10 hover:border-emerald-400/40 text-center"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isEnglish ? 'Send Money' : 'সেন্ড মানি'}</span>
          </Link>

          <Link
            to="/cash-out"
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-white/10 hover:bg-emerald-600/50 text-white text-xs font-medium transition border border-white/10 hover:border-emerald-400/40 text-center"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isEnglish ? 'Cash Out' : 'ক্যাশ আউট'}</span>
          </Link>

          <Link
            to="/lock-money"
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-white/10 hover:bg-amber-600/40 text-white text-xs font-medium transition border border-white/10 hover:border-amber-400/40 text-center"
          >
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span>{isEnglish ? 'Lock Money' : 'মানি লক'}</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsAddMoneyOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-100 text-xs font-medium transition border border-emerald-400/40 text-center"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isEnglish ? 'Add Money' : 'অ্যাড মানি'}</span>
          </button>
        </div>
      </div>

      {/* Add Money Modal */}
      <AddMoneyModal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        currentAvailable={available}
        onAddMoneySuccess={onAddMoney}
      />
    </>
  );
}
