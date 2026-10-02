import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Zap, ShoppingBag, HelpCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * TransactionCard: Represents an authoritative ledger transaction line item
 * Equipped with subtle "উপকথার ব্যাখ্যা" trigger.
 */
export default function TransactionCard({
  transaction,
  onExplain,
}) {
  const {
    id = 'TXN-0000',
    title = 'লেনদেন',
    recipient = '',
    type = 'send_money',
    amount = 0,
    date = 'আজকে',
    category = 'সাধারণ',
    status = 'সফল',
  } = transaction || {};

  const isDebit = type === 'send_money' || type === 'cash_out' || type === 'bill_pay';

  const getIcon = () => {
    switch (type) {
      case 'send_money':
        return <ArrowUpRight className="w-4 h-4 text-rose-600" />;
      case 'cash_out':
        return <ArrowDownLeft className="w-4 h-4 text-amber-600" />;
      case 'bill_pay':
        return <Zap className="w-4 h-4 text-blue-600" />;
      case 'received':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
      default:
        return <ShoppingBag className="w-4 h-4 text-slate-600" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'send_money':
        return 'bg-rose-50 border-rose-100';
      case 'cash_out':
        return 'bg-amber-50 border-amber-100';
      case 'bill_pay':
        return 'bg-blue-50 border-blue-100';
      case 'received':
        return 'bg-emerald-50 border-emerald-100';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all hover:shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Left side: Icon + Meta */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getIconBg()}`}>
          {getIcon()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-800 text-sm">{title || recipient}</h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {category}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>{date}</span>
            <span>•</span>
            <span className="font-mono text-[11px]">{id}</span>
          </div>
        </div>
      </div>

      {/* Right side: Amount + AI Explain trigger */}
      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        {onExplain && (
          <button
            onClick={() => onExplain(transaction)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            title="উপকথা থেকে এই লেনদেনের ব্যাখ্যা শুনুন"
          >
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>উপকথার ব্যাখ্যা</span>
          </button>
        )}

        <div className="text-right">
          <div className={`font-bold text-sm sm:text-base ${isDebit ? 'text-slate-900' : 'text-emerald-700'}`}>
            {isDebit ? '-' : '+'} ৳{new Intl.NumberFormat('bn-BD').format(amount)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">{status}</span>
        </div>
      </div>
    </div>
  );
}
