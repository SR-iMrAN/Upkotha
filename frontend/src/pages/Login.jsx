import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Phone, Volume2, Sparkles, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import VoiceGuide from '../components/VoiceGuide';
import { showToast, showAlert } from '../utils/alert';

export default function Login() {
  const [phone, setPhone] = useState('01712-345678');
  const [pin, setPin] = useState('1234');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone) {
      showToast.error('অনুগ্রহ করে মোবাইল নম্বর লিখুন');
      return;
    }
    if (!pin || pin.length !== 4) {
      showToast.error('৪ ডিজিটের পিন কোড দিন (ডেমো: 1234)');
      return;
    }

    try {
      setIsLoading(true);
      await login(phone, pin);
      navigate(from, { replace: true });
    } catch (err) {
      // Toast already shown in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setPhone('01712-345678');
    setPin('1234');
    showToast.info('ইমরানের ডেমো ক্রেডেনশিয়াল পূরণ করা হয়েছে');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
      {/* Brand Header */}
      <div className="max-w-md w-full mx-auto pt-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            উপ
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">UPKOTHA</span>
            <span className="block text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
              উপকথা AI লেয়ার
            </span>
          </div>
        </Link>

        <div className="text-xs px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700 font-medium">
          ডেমো মোড
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
        {/* Contextual Voice Guide */}
        <VoiceGuide
          pageContext="login"
          message="আপনার মোবাইল নম্বর দিন। এরপর PIN ব্যবহার করে login করুন।"
          className="mb-6"
        />

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">লগইন করুন</h2>
          <p className="text-xs text-slate-500 mt-1">
            আপনার নিবন্ধিত মোবাইল নম্বর ও পিন দিয়ে প্রবেশ করুন
          </p>
        </div>

        {/* Demo Auto-fill Quick Action */}
        <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-800 block">ডেমো অ্যাকাউন্ট (ইমরান)</span>
            <span className="text-[11px] text-slate-500">ব্যালেন্স: ৳১৩,৫০০ • পিন: 1234</span>
          </div>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-medium transition"
          >
            অটো পূরণ
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              মোবাইল নম্বর
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ৪ ডিজিটের পিন (Demo PIN: 1234)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Prototype Notice */}
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-amber-800 leading-snug">
            ⚠️ এটি হ্যাকাথন প্রোটোটাইপ ডেমো প্রমাণীকরণ। আসল ব্যাংকিং পাসওয়ার্ড বা ওটিপি কখনোই প্রবেশ করবেন না।
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            icon={ArrowRight}
            className="mt-2"
          >
            লগইন করুন
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
          অ্যাকাউন্ট নেই?{' '}
          <Link to="/register" className="text-emerald-700 font-semibold hover:underline">
            নতুন অ্যাকাউন্ট নিবন্ধন করুন
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        UPKOTHA (উপকথা) • নিরাপদ ও বুদ্ধিমান ডিজিটাল ফাইন্যান্স
      </div>
    </div>
  );
}
