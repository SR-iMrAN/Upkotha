import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Phone, Lock, Volume2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { showToast } from '../utils/alert';

export default function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast.error('অনুগ্রহ করে আপনার পুরো নাম লিখুন');
      return;
    }
    if (!phone || phone.length < 11) {
      showToast.error('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন');
      return;
    }
    if (!pin || pin.length !== 4) {
      showToast.error('৪ ডিজিটের গোপন পিন কোড সেট করুন');
      return;
    }
    if (pin !== confirmPin) {
      showToast.error('দুইবারের পিন কোড মেলেনি');
      return;
    }

    try {
      setIsLoading(true);
      await register(name, phone, pin);
      navigate('/dashboard');
    } catch (err) {
      // Toast shown in AuthContext
    } finally {
      setIsLoading(false);
    }
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

        <div className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
          নতুন অ্যাকাউন্ট
        </div>
      </div>

      {/* Main Register Card */}
      <div className="max-w-md w-full mx-auto my-auto bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
        {/* Contextual Voice Guide Banner */}
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-semibold text-emerald-900 block mb-0.5">
              উপকথা ভয়েস গাইড:
            </span>
            <p className="text-emerald-800 font-normal leading-relaxed">
              "স্বাগতম। আমি উপকথা। আপনাকে ধাপে ধাপে account তৈরি করতে সাহায্য করব। প্রথমে আপনার নাম দিন।"
            </p>
          </div>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">নিবন্ধন করুন</h2>
          <p className="text-xs text-slate-500 mt-1">
            উপকথায় আপনার ডেমো এমএফএস ওয়ালেট সক্রিয় করুন
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              আপনার পুরো নাম
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: ইমরান আহমেদ"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

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
                placeholder="01712345678"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                নতুন পিন (৪ ডিজিট)
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                পিন নিশ্চিত করুন
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Prototype sandbox allocation notice */}
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 leading-snug">
            ✨ ডেমো প্রোটোটাইপে নিবন্ধনের সাথে সাথে ৳১৫,০০০ প্রোটোটাইপ ব্যালেন্স দেওয়া হবে যাতে আপনি সব ফিচার টেস্ট করতে পারেন।
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            icon={ArrowRight}
            className="mt-2"
          >
            অ্যাকাউন্ট তৈরি করুন
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
          <Link to="/login" className="text-emerald-700 font-semibold hover:underline">
            লগইন করুন
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        UPKOTHA (উপকথা) • সহজ ভাষায়, বুদ্ধিমানভাবে, নিরাপদে ডিজিটাল ফাইন্যান্স
      </div>
    </div>
  );
}
