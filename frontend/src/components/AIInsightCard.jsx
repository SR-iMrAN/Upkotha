import React from 'react';
import { Sparkles, ArrowRight, Lightbulb, Bell, AlertTriangle } from 'lucide-react';

/**
 * AIInsightCard: Subtle, non-intrusive financial insight card
 * Clearly labeled as AI observation/recommendation without masquerading as an authoritative bank statement.
 */
export default function AIInsightCard({
  type = 'observation', // 'observation' | 'reminder' | 'warning'
  title = 'উপকথার পর্যবেক্ষণ',
  message = 'আপনার electricity payment সাধারণত মাসের ৫ তারিখের দিকে হয়। প্রস্তুত রাখতে আপনার available balance পর্যাপ্ত আছে।',
  actionLabel = 'বিস্তারিত দেখুন',
  onAction,
  onDismiss,
  className = '',
}) {
  const getStyle = () => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-amber-50/80 border-amber-200 text-amber-950',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          button: 'text-amber-800 hover:text-amber-900 bg-amber-100/60 hover:bg-amber-200/60',
        };
      case 'reminder':
        return {
          container: 'bg-blue-50/80 border-blue-200 text-blue-950',
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <Bell className="w-4 h-4 text-blue-600" />,
          button: 'text-blue-800 hover:text-blue-900 bg-blue-100/60 hover:bg-blue-200/60',
        };
      default:
        return {
          container: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950',
          badge: 'bg-emerald-100/80 text-emerald-800 border-emerald-300/60',
          icon: <Sparkles className="w-4 h-4 text-emerald-600" />,
          button: 'text-emerald-800 hover:text-emerald-900 bg-emerald-100/60 hover:bg-emerald-200/60',
        };
    }
  };

  const style = getStyle();

  return (
    <div className={`p-4 rounded-xl border ${style.container} relative transition shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/80 shadow-xs border border-inherit shrink-0 mt-0.5">
            {style.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                {title}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                (কৃত্রিম বুদ্ধিমত্তার বিশ্লেষণ)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {message}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 text-xs p-1"
            title="মুছে ফেলুন"
          >
            ✕
          </button>
        )}
      </div>

      {actionLabel && onAction && (
        <div className="mt-3 pt-2.5 border-t border-inherit/40 flex justify-end">
          <button
            onClick={onAction}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${style.button}`}
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
