import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const TRANSLATIONS = {
  // Brand & General
  appTitle: { bn: 'উপকথা', en: 'UPKOTHA' },
  tagline: { bn: 'সহজ ভাষায়, বুদ্ধিমানভাবে, নিরাপদে ডিজিটাল ফাইন্যান্স', en: 'Simple, Intelligent, Secure Digital Finance' },
  aiLayer: { bn: 'উপকথা AI লেয়ার', en: 'Upkotha AI Layer' },
  dashboard: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  demoMode: { bn: 'ডেমো মোড', en: 'Demo Mode' },
  logout: { bn: 'লগআউট', en: 'Logout' },
  login: { bn: 'লগইন', en: 'Login' },
  register: { bn: 'নিবন্ধন করুন', en: 'Register' },
  createAccount: { bn: 'অ্যাকাউন্ট তৈরি করুন', en: 'Create Account' },

  // Navigation Items
  nav_dashboard: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  nav_sendMoney: { bn: 'সেন্ড মানি', en: 'Send Money' },
  nav_cashOut: { bn: 'ক্যাশ আউট', en: 'Cash Out' },
  nav_lockMoney: { bn: 'মানি লক', en: 'Lock Money' },
  nav_transactions: { bn: 'লেনদেন ইতিহাস', en: 'Transactions' },
  nav_reminders: { bn: 'বিল ও রিমাইন্ডার', en: 'Bills & Reminders' },
  nav_strictMode: { bn: 'স্ট্রিক্ট মোড', en: 'Strict Mode' },
  nav_voiceSecurity: { bn: 'ভয়েস বায়োমেট্রিক', en: 'Voice Biometrics' },
  nav_voice: { bn: 'ভয়েস রুম', en: 'Voice Room' },
  nav_admin: { bn: 'অ্যাডমিন কনসোল', en: 'Admin Console' },
  nav_profile: { bn: 'প্রোফাইল', en: 'Profile' },

  // Balance Card
  availableBalance: { bn: 'উপলব্ধ ব্যালেন্স', en: 'Available Balance' },
  lockedBalance: { bn: 'জরুরি ও ভাড়ার জন্য লক করা', en: 'Locked for Emergency & Rent' },
  totalBalance: { bn: 'মোট ব্যালেন্স', en: 'Total Balance' },
  usableNotice: { bn: 'ব্যবহারযোগ্য ব্যালেন্স', en: 'Usable Balance' },
  addMoney: { bn: 'অ্যাড মানি', en: 'Add Money' },
  quickActions: { bn: 'দ্রুত অ্যাকশন', en: 'Quick Actions' },

  // Transaction & Actions
  recipient: { bn: 'প্রাপক', en: 'Recipient' },
  amount: { bn: 'টাকার পরিমাণ', en: 'Amount' },
  fee: { bn: 'সার্ভিস চার্জ / ফি', en: 'Service Charge / Fee' },
  date: { bn: 'তারিখ ও সময়', en: 'Date & Time' },
  status: { bn: 'অবস্থা', en: 'Status' },
  pin: { bn: 'গোপন পিন কোড', en: 'Secret PIN Code' },
  confirm: { bn: 'নিশ্চিত করুন', en: 'Confirm' },
  cancel: { bn: 'বাতিল করুন', en: 'Cancel' },
  close: { bn: 'বন্ধ করুন', en: 'Close' },
  reset: { bn: 'রিসেট করুন', en: 'Reset' },
  search: { bn: 'অনুসন্ধান করুন...', en: 'Search transactions...' },
  all: { bn: 'সব', en: 'All' },
  allTransactions: { bn: 'সব লেনদেন', en: 'All Transactions' },
  noTransactions: { bn: 'কোনো লেনদেন পাওয়া যায়নি।', en: 'No transactions found.' },
  recentTransactions: { bn: 'সাম্প্রতিক লেনদেন', en: 'Recent Transactions' },
  viewAll: { bn: 'সব দেখুন', en: 'View All' },
  explainAi: { bn: 'সহজ ভাষায় ব্যাখ্যা', en: 'Plain Language AI Explanation' },

  // Strict Mode
  strictModeActive: { bn: 'স্ট্রিক্ট মোড সক্রিয়', en: 'Strict Mode Active' },
  strictModeInactive: { bn: 'স্ট্রিক্ট মোড নিষ্ক্রিয়', en: 'Strict Mode Inactive' },
  strictDesc: {
    bn: 'প্রতিটি লেনদেনে অতিরিক্ত নিশ্চিতকরণ ও অস্বাভাবিক খরচে এআই সতর্কতা।',
    en: 'Enhanced human verification on all transactions and AI behavioral anomaly warnings.',
  },

  // Reminders
  upcomingBills: { bn: 'আসন্ন বিল ও রিমাইন্ডার', en: 'Upcoming Bills & Reminders' },
  payNow: { bn: 'পরিশোধ করুন', en: 'Pay Now' },
  paid: { bn: 'পরিশোধিত', en: 'Paid' },
  dueDate: { bn: 'পরিশোধের শেষ সময়', en: 'Due Date' },

  // Lock Money
  lockEmergency: { bn: 'জরুরি সঞ্চয়', en: 'Emergency Savings' },
  lockRent: { bn: 'বাড়িভাড়া', en: 'House Rent' },
  activeLocks: { bn: 'সক্রিয় মানি লক', en: 'Active Money Locks' },
  unlock: { bn: 'আনলক করুন', en: 'Unlock' },
  lockNew: { bn: 'নতুন লক যোগ করুন', en: 'Add New Lock' },

  // Voice Biometrics
  voiceprintStatus: { bn: 'ভয়েস বায়োমেট্রিক স্ট্যাটাস', en: 'Voice Biometric Status' },
  pitchRange: { bn: 'অনুমোদিত পিচ ব্যাপ্তী', en: 'Authorized Pitch Range' },
  primarySpeaker: { bn: 'প্রাথমিক বক্তা', en: 'Primary Speaker' },
  antiSpoofShield: { bn: 'অ্যান্টি-স্পুফ শিল্ড', en: 'Anti-Spoof Shield' },
  recalibrate: { bn: 'রিক্যালিব্রেট করুন', en: 'Recalibrate' },
  saveCustomRange: { bn: 'কাস্টম রেঞ্জ সেভ করুন', en: 'Save Custom Range' },

  // Footer
  footerText: {
    bn: 'UPKOTHA (উপকথা) • সহজ ভাষায়, বুদ্ধিমানভাবে, নিরাপদে ডিজিটাল ফাইন্যান্স',
    en: 'UPKOTHA • Simple, Intelligent, Secure Digital Finance',
  },
};

const STORAGE_LANG_KEY = 'upkotha_language';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_LANG_KEY) || 'bn';
    } catch {
      return 'bn';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // Ignored
    }
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  /**
   * Translate helper:
   * t('nav_dashboard') -> 'ড্যাশবোর্ড' or 'Dashboard'
   * t('custom_key', 'Fallback') -> returns fallback if key doesn't exist
   */
  const t = (key, fallback = '') => {
    if (TRANSLATIONS[key]) {
      return TRANSLATIONS[key][lang] || TRANSLATIONS[key].bn || fallback;
    }
    return fallback || key;
  };

  const isEnglish = lang === 'en';

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t,
        isEnglish,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
