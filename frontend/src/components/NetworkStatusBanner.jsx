import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';

/**
 * NetworkStatusBanner: Graceful Offline & Connectivity Resilience Banner.
 * Detects online/offline status, informs user in plain Bangla, and provides audio reassurance.
 */
export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);
  const { speak } = useVoice();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      speak('ইন্টারনেট সংযোগ পুনরায় সংযুক্ত হয়েছে।');
      setTimeout(() => setShowReconnected(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      speak('ইন্টারনেট সংযোগ সাময়িক বিচ্ছিন্ন হয়েছে। আপনার অ্যাকাউন্টের সকল তথ্য নিরাপদে সংরক্ষিত রয়েছে।');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [speak]);

  if (isOnline && !showReconnected) return null;

  if (showReconnected) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm animate-in slide-in-from-top duration-300">
        <Wifi className="w-4 h-4" />
        <span>ইন্টারনেট সংযোগ পুনঃস্থাপিত হয়েছে • লাইভ সার্ভার সিঙ্ক সম্পন্ন</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-600 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-md animate-in slide-in-from-top duration-300 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-amber-100" />
        <span>
          <strong>অফলাইন মোড:</strong> ইন্টারনেট সংযোগ বিচ্ছিন্ন রয়েছে। আপনার ব্যালেন্স ও হিসেব নিরাপদ রয়েছে।
        </span>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition flex items-center gap-1 shrink-0"
      >
        <RefreshCw className="w-3 h-3" />
        <span>পুনরায় চেষ্টা</span>
      </button>
    </div>
  );
}
