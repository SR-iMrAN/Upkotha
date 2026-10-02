import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import TransactionCard from '../components/TransactionCard';
import { useAuth } from '../context/AuthContext';
import { showExplainModal, showToast } from '../utils/alert';
import { SYNTHETIC_TRANSACTIONS } from '../data/syntheticData';
import api from '../services/api';
import {
  History,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Volume2,
  Sparkles,
} from 'lucide-react';

const FILTER_TABS = [
  { key: 'all', label: 'সব লেনদেন' },
  { key: 'send_money', label: 'সেন্ড মানি' },
  { key: 'cash_out', label: 'ক্যাশ আউট' },
  { key: 'bill_pay', label: 'বিল পে' },
  { key: 'received', label: 'জমা' },
];

export default function Transactions() {
  const { user, toggleStrictMode } = useAuth();
  const [transactions, setTransactions] = useState(SYNTHETIC_TRANSACTIONS);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchLiveTxns() {
      try {
        setIsLoading(true);
        const res = await api.getTransactions();
        if (res.transactions && res.transactions.length > 0) {
          setTransactions(res.transactions);
        }
      } catch (err) {
        // Fall back to synthetic data
      } finally {
        setIsLoading(false);
      }
    }
    fetchLiveTxns();
  }, []);

  const filteredTransactions = transactions.filter((txn) => {
    const matchesType = filterType === 'all' || txn.type === filterType;
    const matchesSearch =
      txn.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleExplain = (txn) => {
    showExplainModal({
      title: txn.title,
      explanation:
        txn.explanationBangla ||
        `আপনার ${txn.dateDisplay} তারিখে ${txn.recipient} বাবদ ৳${txn.amount} টাকা সফলভাবে লেনদেন হয়েছে। এতে সার্ভিস ফি ছিল ৳${txn.fee || 0}।`,
      transactionId: txn.id,
    });
  };

  const totalOutflow = transactions
    .filter((t) => t.type !== 'received')
    .reduce((sum, t) => sum + t.amount + (t.fee || 0), 0);

  const totalInflow = transactions
    .filter((t) => t.type === 'received')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatBDT = (val) => new Intl.NumberFormat('bn-BD').format(val || 0);

  return (
    <Layout
      title="লেনদেন ইতিহাস (Transactions)"
      isStrictMode={user?.isStrictMode}
      onToggleStrictMode={toggleStrictMode}
      userName={user?.name}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Contextual Voice Guide */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 shadow-xs">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
            <Volume2 className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="text-xs">
            <span className="font-semibold text-emerald-900 block mb-0.5">
              উপকথা ভয়েস গাইড (Contextual Voice Guide)
            </span>
            <p className="text-emerald-800 leading-relaxed font-normal">
              "আপনি চাইলে যেকোনো transaction সম্পর্কে আমাকে জিজ্ঞেস করতে পারেন।"
            </p>
          </div>
        </div>

        {/* Financial Flow Snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                মোট খরচ ও কর্তন
              </span>
              <span className="text-xl font-bold text-slate-900">৳ {formatBDT(totalOutflow)}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{transactions.filter(t => t.type !== 'received').length} টি লেনদেন</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                মোট প্রাপ্তি / জমা
              </span>
              <span className="text-xl font-bold text-emerald-700">৳ {formatBDT(totalInflow)}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{transactions.filter(t => t.type === 'received').length} টি লেনদেন</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রাপকের নাম, বিবরণ বা লেনদেন আইডি দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                  filterType === tab.key
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2.5">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              কোনো লেনদেন পাওয়া যায়নি।
            </div>
          ) : (
            filteredTransactions.map((txn) => (
              <TransactionCard
                key={txn.id}
                transaction={txn}
                onExplain={handleExplain}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
