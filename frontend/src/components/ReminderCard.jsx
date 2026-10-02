import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertCircle, CheckCircle, Clock, Zap, Wifi, Heart } from 'lucide-react';

const categoryIcons = {
  'বিদ্যুৎ': Zap,
  'ইন্টারনেট': Wifi,
  'পারিবারিক': Heart,
};

const urgencyStyle = (daysUntil) => {
  if (daysUntil <= 3) return 'bg-rose-50 border-rose-200 text-rose-900';
  if (daysUntil <= 7) return 'bg-amber-50 border-amber-200 text-amber-900';
  return 'bg-slate-50 border-slate-200 text-slate-800';
};

const urgencyBadge = (daysUntil) => {
  if (daysUntil <= 3) return 'bg-rose-100 text-rose-700 border-rose-300';
  if (daysUntil <= 7) return 'bg-amber-100 text-amber-700 border-amber-300';
  return 'bg-slate-100 text-slate-600 border-slate-300';
};

/**
 * ReminderCard: Upcoming bill / commitment reminder unit.
 * Clearly grounded in synthetic ledger patterns — no speculation.
 */
export default function ReminderCard({ reminder, onMarkDone }) {
  const { title, category, expectedDate, typicalAmount, lastAmount, daysUntil, status } = reminder;
  const IconComponent = categoryIcons[category] || Calendar;

  return (
    <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${urgencyStyle(daysUntil)}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white/80 border border-inherit shrink-0 shadow-xs">
          <IconComponent className="w-4 h-4" />
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold">{title}</h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${urgencyBadge(daysUntil)}`}>
              {daysUntil <= 3 ? `⚠ ${daysUntil} দিন বাকি` : daysUntil <= 7 ? `${daysUntil} দিন বাকি` : status}
            </span>
          </div>
          <p className="text-xs mt-1 opacity-80 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            প্রত্যাশিত তারিখ: {expectedDate}
          </p>
          <p className="text-xs opacity-70 mt-0.5">
            সাধারণ পরিমাণ: ৳ {new Intl.NumberFormat('bn-BD').format(typicalAmount)}
            {lastAmount && ` (গতবার: ৳ ${new Intl.NumberFormat('bn-BD').format(lastAmount)})`}
          </p>
        </div>
      </div>

      {onMarkDone && (
        <button
          onClick={() => onMarkDone(reminder.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-inherit text-xs font-medium transition-colors shrink-0"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>সম্পন্ন</span>
        </button>
      )}
    </div>
  );
}
