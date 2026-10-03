import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  ArrowDownToLine,
  Lock,
  History,
  BellRing,
  ShieldCheck,
  Radio,
  Mic,
  UserCheck,
  BarChart3,
  X,
  Sparkles,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'ড্যাশবোর্ড', path: '/dashboard', icon: LayoutDashboard },
  { name: 'সেন্ড মানি', path: '/send-money', icon: Send },
  { name: 'ক্যাশ আউট', path: '/cash-out', icon: ArrowDownToLine },
  { name: 'মানি লক', path: '/lock-money', icon: Lock },
  { name: 'লেনদেন ইতিহাস', path: '/transactions', icon: History },
  { name: 'বিল ও রিমাইন্ডার', path: '/reminders', icon: BellRing },
  { name: 'স্ট্রিক্ট মোড', path: '/strict-mode', icon: ShieldCheck },
  { name: 'ভয়েস বায়োমেট্রিক', path: '/voice-security', icon: Radio },
  { name: 'ভয়েস রুম', path: '/voice', icon: Mic },
  { name: 'অ্যাডমিন কনসোল', path: '/admin', icon: BarChart3 },
  { name: 'প্রোফাইল', path: '/profile', icon: UserCheck },
];

/**
 * Sidebar: Persistent desktop navigation + responsive mobile drawer
 */
export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div>
          <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
            <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                উপ
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight">UPKOTHA</span>
                <span className="block text-[10px] text-emerald-400 font-medium">উপকথা AI লেয়ার</span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer / Smart Tagline */}
        <div className="p-4 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>সহজ ও বুদ্ধিমান</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              ভয়েস ও এআই সহযোগিতায় আপনার আর্থিক লেনদেন আরও সুরক্ষিত।
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
