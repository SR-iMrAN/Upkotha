import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Phone, Lock, Volume2, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import Button from '../components/Button';
import VoiceGuide from '../components/VoiceGuide';
import { showToast, showAlert } from '../utils/alert';
import api from '../services/api';

function normalizeDigits(str) {
  if (!str) return '';
  const bnToEn = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };
  return String(str).replace(/[০-৯]/g, (d) => bnToEn[d] || d);
}

export default function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic step-by-step onboarding voice guide state
  const [guideMessage, setGuideMessage] = useState(
    'স্বাগতম। আমি উপকথা। আপনাকে ধাপে ধাপে অ্যাকাউন্ট তৈরি করতে সাহায্য করব। প্রথমে আপনার নাম দিন।'
  );
  const [activeStep, setActiveStep] = useState('NAME'); // 'NAME' | 'PHONE' | 'PIN' | 'READY'

  const { register } = useAuth();
  const { speak } = useVoice();
  const navigate = useNavigate();

  // Track if steps have already triggered audio guidance to prevent repetitive loops
  const nameSpokenRef = useRef(false);
  const phoneSpokenRef = useRef(false);
  const pinSpokenRef = useRef(false);

  // 1. Initial Greeting when user lands on registration page
  useEffect(() => {
    const timer = setTimeout(() => {
      speak('স্বাগতম। আমি উপকথা। আপনাকে ধাপে ধাপে অ্যাকাউন্ট তৈরি করতে সাহায্য করব। প্রথমে আপনার নাম দিন।');
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // 2. Validate name and speak next instruction (Gemini-backed with fallback)
  const validateNameAndProceed = async (nameVal) => {
    const trimmed = (nameVal || name).trim();
    if (trimmed.length < 2 || nameSpokenRef.current) return;

    nameSpokenRef.current = true;
    setActiveStep('PHONE');

    try {
      const data = await api.getOnboardGreeting({ name: trimmed, step: 'NAME' });
      const prompt = (data.spokenText || `হ্যালো, ${trimmed}! এবার আপনার সচল ১১ ডিজিটের মোবাইল নম্বর দিন।`).replace(/নমস্কার/g, 'হ্যালো');
      setGuideMessage(prompt);
      speak(prompt);
    } catch {
      const fallbackPrompt = `হ্যালো, ${trimmed}! এবার আপনার সচল ১১ ডিজিটের মোবাইল নম্বর দিন।`;
      setGuideMessage(fallbackPrompt);
      speak(fallbackPrompt);
    }
  };

  // 3. Handle phone input completion (11 digits)
  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);

    const clean = normalizeDigits(val).replace(/\D/g, '');
    if (clean.length === 11 && !phoneSpokenRef.current) {
      phoneSpokenRef.current = true;
      setActiveStep('PIN');
      const pinPrompt =
        'মোবাইল নম্বর পেয়েছি। এবার ৪ ডিজিটের একটি গোপন পিন দিন এবং নিশ্চিত করুন। মনে রাখবেন, এমন পিন দিন যা আপনি মনে রাখতে পারবেন এবং কারো সাথে শেয়ার করবেন না।';
      setGuideMessage(pinPrompt);
      speak(pinPrompt);
    }
  };

  // 4. Handle PIN confirmation
  const handleConfirmPinChange = (e) => {
    const val = normalizeDigits(e.target.value).replace(/\D/g, '');
    setConfirmPin(val);

    const cleanPin = normalizeDigits(pin).replace(/\D/g, '');
    if (cleanPin.length === 4 && val.length === 4 && cleanPin === val && !pinSpokenRef.current) {
      pinSpokenRef.current = true;
      setActiveStep('READY');
      const readyPrompt = 'পিন নিশ্চিত হয়েছে! এবার নিচে "অ্যাকাউন্ট তৈরি করুন" বোতামে চাপ দিন।';
      setGuideMessage(readyPrompt);
      speak(readyPrompt);
    }
  };

  // 5. Final Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanPhone = normalizeDigits(phone).replace(/\D/g, '');
    const cleanPin = normalizeDigits(pin).replace(/\D/g, '');
    const cleanConfirmPin = normalizeDigits(confirmPin).replace(/\D/g, '');

    if (!name.trim()) {
      showToast.error('অনুগ্রহ করে আপনার পুরো নাম লিখুন');
      speak('অনুগ্রহ করে আপনার পুরো নাম লিখুন।');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 11) {
      showToast.error('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন');
      speak('সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    if (!cleanPin || cleanPin.length !== 4) {
      showToast.error('৪ ডিজিটের গোপন পিন কোড সেট করুন');
      speak('৪ ডিজিটের গোপন পিন কোড সেট করুন।');
      return;
    }
    if (cleanPin !== cleanConfirmPin) {
      showToast.error('দুইবারের পিন কোড মেলেনি');
      speak('দুইবারের পিন কোড মেলেনি। পুনরায় যাচাই করুন।');
      return;
    }

    try {
      setIsLoading(true);
      await register(name.trim(), cleanPhone, cleanPin);

      // Spoken congratulatory celebration requested by user
      const successGreeting = `অভিনন্দন ${name.trim()}! আপনার উপকথা অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। স্বাগতম!`;
      speak(successGreeting);

      showAlert({
        title: 'অ্যাকাউন্ট তৈরি সফল!',
        text: `${name.trim()}, আপনার উপকথা এমএফএস অ্যাকাউন্ট সফলভাবে সক্রিয় করা হয়েছে।`,
        icon: 'success',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      showToast.error('অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
      {/* Brand Header */}
      <div className="max-w-md w-full mx-auto pt-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="UPKOTHA" className="w-10 h-10 object-contain drop-shadow-sm" />
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
        {/* Interactive Step-by-Step Contextual Voice Guide */}
        <VoiceGuide
          pageContext="register"
          message={guideMessage}
          className="mb-6"
        />

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">নিবন্ধন করুন</h2>
          <p className="text-xs text-slate-500 mt-1">
            উপকথায় আপনার ডেমো এমএফএস ওয়ালেট সক্রিয় করুন
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                আপনার পুরো নাম
              </label>
              {name.trim().length >= 2 && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> নাম গৃহীত
                </span>
              )}
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => validateNameAndProceed()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    validateNameAndProceed();
                  }
                }}
                placeholder="যেমন: ইমরান আহমেদ"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Step 2: Mobile Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                মোবাইল নম্বর (১১ ডিজিট)
              </label>
              {phone.replace(/\D/g, '').length === 11 && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> নম্বর সঠিক
                </span>
              )}
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="01712345678"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Step 3: PIN & Confirm PIN */}
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
                  onChange={handleConfirmPinChange}
                  placeholder="••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* PIN Security Tip requested by user */}
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-snug">
            💡 <strong>টিপস:</strong> এমন ৪ সংখ্যার পিন দিন যা আপনি সহজে মনে রাখতে পারবেন, তবে অন্য কেউ অনুমান করতে পারবে না (যেমন জন্মসাল বা ১২৩৪ এড়িয়ে চলুন)।
          </div>

          {/* Prototype sandbox allocation notice */}
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 leading-snug">
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
