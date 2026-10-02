import React from 'react';
import { Menu, Shield, ShieldAlert, Mic, User } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Navbar: Application header with responsive drawer toggle and user status
 */
export default function Navbar({
  onToggleSidebar,
  isStrictMode = false,
  onToggleStrictMode,
  title = 'ড্যাশবোর্ড',
  userName = 'ইমরান',
}) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              উপ
            </div>
          </Link>
          <div className="hidden sm:block h-5 w-px bg-slate-200 lg:hidden" />
          <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Strict Mode indicator, Voice link, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Strict Mode quick pill */}
        <button
          onClick={onToggleStrictMode}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            isStrictMode
              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
          title="স্ট্রিক্ট মোড চালু বা বন্ধ করুন"
        >
          {isStrictMode ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">স্ট্রিক্ট মোড:</span>
              <span className="font-semibold text-amber-700">সক্রিয়</span>
            </>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">স্ট্রিক্ট মোড</span>
            </>
          )}
        </button>

        {/* Voice Room link */}
        <Link
          to="/voice"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-medium transition-colors"
          title="ভয়েস অ্যাসিস্ট্যান্ট টেস্ট রুম"
        >
          <Mic className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden md:inline">ভয়েস রুম</span>
        </Link>

        {/* User Profile Avatar */}
        <Link
          to="/profile"
          className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition"
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-semibold text-xs">
            {userName ? userName.charAt(0) : <User className="w-4 h-4" />}
          </div>
          <span className="hidden lg:inline text-xs font-semibold text-slate-800">
            {userName}
          </span>
        </Link>
      </div>
    </header>
  );
}
