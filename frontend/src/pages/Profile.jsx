import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { showConfirm, showToast } from '../utils/alert';
import {
  User,
  Phone,
  Shield,
  ShieldAlert,
  LogOut,
  Wallet,
  Lock,
  Users,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

export default function Profile() {
  const { user, logout, toggleStrictMode } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: 'লগআউট করতে চান?',
      text: 'আপনার বর্তমান সেশনটি সমাপ্ত হবে।',
      icon: 'question',
      confirmButtonText: 'হ্যাঁ, লগআউট করুন',
      cancelButtonText: 'না, থাকুন',
    });

    if (confirmed) {
      logout();
      navigate('/login');
    }
  };

  const formatBDT = (amount) => new Intl.NumberFormat('bn-BD').format(amount || 0);

  return (
    <Layout
      title="প্রোফাইল ও সেটিংস"
      isStrictMode={user?.isStrictMode}
      onToggleStrictMode={toggleStrictMode}
      userName={user?.name}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* User Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white font-bold text-2xl flex items-center justify-center shadow-sm">
              {user?.name ? user.name.charAt(0) : 'ই'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  যাচাইকৃত ডেমো ওয়ালেট
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.phone}</p>
              <p className="text-xs text-slate-400 mt-1">DIU CPC × upay AI Hackathon 2026 Sandbox</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={LogOut}
            onClick={handleLogout}
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            লগআউট
          </Button>
        </div>

        {/* Financial Balance Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              ব্যবহারযোগ্য ব্যালেন্স
            </span>
            <div className="text-xl font-bold text-emerald-700">
              ৳ {formatBDT(user?.availableBalance)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              লক করা ব্যালেন্স
            </span>
            <div className="text-xl font-bold text-amber-700">
              ৳ {formatBDT(user?.lockedBalance)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-slate-600" />
              মোট সম্পদ
            </span>
            <div className="text-xl font-bold text-slate-900">
              ৳ {formatBDT((user?.availableBalance || 0) + (user?.lockedBalance || 0))}
            </div>
          </div>
        </div>

        {/* Strict Mode Security Configuration */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${user?.isStrictMode ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                {user?.isStrictMode ? <ShieldAlert className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  স্ট্রিক্ট মোড (Strict Mode)
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
                  স্ট্রিক্ট মোড চালু থাকলে জটিল ইন্টারফেস লুকিয়ে সহজ মোড দেখায় এবং প্রতিটি সংবেদনশীল লেনদেনের আগে অতিরিক্ত সতর্কবার্তা ও নিশ্চিতকরণ গ্রহণ করে।
                </p>
              </div>
            </div>

            <Button
              variant={user?.isStrictMode ? 'danger' : 'primary'}
              size="md"
              onClick={toggleStrictMode}
            >
              {user?.isStrictMode ? 'স্ট্রিক্ট মোড বন্ধ করুন' : 'স্ট্রিক্ট মোড সক্রিয় করুন'}
            </Button>
          </div>
        </div>

        {/* Saved Contacts */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <h3 className="text-base font-bold text-slate-900">সংরক্ষিত পরিচিতি (Demo Contacts)</h3>
            </div>
            <span className="text-xs text-slate-400">৪ জন প্রাপক</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {user?.contacts?.map((contact) => (
              <div
                key={contact.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                    {contact.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800">{contact.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{contact.phone}</p>
                  </div>
                </div>

                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => {
                    showToast.info(`${contact.name}-কে টাকা পাঠাতে সেন্ড মানি পেজে যান`);
                    navigate('/send-money');
                  }}
                >
                  টাকা পাঠান
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
