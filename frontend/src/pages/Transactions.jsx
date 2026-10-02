import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import TransactionCard from '../components/TransactionCard';
import VoiceGuide from '../components/VoiceGuide';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { showToast } from '../utils/alert';
import { SYNTHETIC_TRANSACTIONS } from '../data/syntheticData';
import api from '../services/api';
import {
  History,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  RotateCcw,
  ShieldCheck,
  Receipt,
  Layers,
  PieChart,
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
  const { speak, stopSpeaking, isSpeaking } = useVoice();
  const location = useLocation();

  const [transactions, setTransactions] = useState(SYNTHETIC_TRANSACTIONS);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVoiceFilter, setActiveVoiceFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Transaction Explain Modal State
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [explanationText, setExplanationText] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);

  // Fetch Live Transactions from Backend
  useEffect(() => {
    async function fetchLiveTxns() {
      try {
        setIsLoading(true);
        const res = await api.getTransactions();
        if (res.transactions && res.transactions.length > 0) {
          setTransactions(res.transactions);
        }
      } catch (err) {
        // Fall back to synthetic transactions if offline
      } finally {
        setIsLoading(false);
      }
    }
    fetchLiveTxns();
  }, []);

  // Handle incoming voice command filter/query
  useEffect(() => {
    if (location.state) {
      const { query, filterType: incomingFilterType } = location.state;
      if (query) {
        setSearchQuery(query);
        setActiveVoiceFilter(query);
        showToast.info(`'${query}' এর লেনদেন অনুসন্ধান করা হয়েছে`);
      }
      if (incomingFilterType) {
        setFilterType(incomingFilterType);
      }
    }
  }, [location.state]);

  const handleResetFilter = () => {
    setSearchQuery('');
    setFilterType('all');
    setActiveVoiceFilter(null);
  };

  const filteredTransactions = transactions.filter((txn) => {
    const matchesType = filterType === 'all' || txn.type === filterType;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesType;

    const title = (txn.title || '').toLowerCase();
    const recipient = (txn.recipient || '').toLowerCase();
    const id = (txn.id || '').toLowerCase();
    const category = (txn.category || '').toLowerCase();
    const phone = (txn.recipientPhone || '').toLowerCase();

    const matchesSearch =
      title.includes(query) ||
      recipient.includes(query) ||
      id.includes(query) ||
      category.includes(query) ||
      phone.includes(query);

    return matchesType && matchesSearch;
  });

  const handleExplain = async (txn) => {
    setSelectedTxn(txn);
    const fallbackText =
      txn.explanationBangla ||
      `আপনার ${txn.dateDisplay} তারিখে ${txn.recipient} বাবদ ৳${txn.amount} টাকা সফলভাবে লেনদেন হয়েছে। এতে সার্ভিস ফি ছিল ৳${txn.fee || 0}।`;

    setExplanationText(fallbackText);
    setIsExplaining(true);

    try {
      const res = await api.explainTransaction(txn.id);
      if (res?.explanation) {
        setExplanationText(res.explanation);
      }
    } catch (err) {
      console.warn('Dynamic explanation fallback used', err);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleCloseModal = () => {
    stopSpeaking();
    setSelectedTxn(null);
    setExplanationText('');
  };

  // Financial aggregates
  const totalOutflow = transactions
    .filter((t) => t.type !== 'received')
    .reduce((sum, t) => sum + (t.amount || 0) + (t.fee || 0), 0);

  const totalInflow = transactions
    .filter((t) => t.type === 'received')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalFees = transactions.reduce((sum, t) => sum + (t.fee || 0), 0);

  const personalSpending = transactions
    .filter((t) => t.categoryKey === 'personal' || t.type === 'send_money')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const utilitySpending = transactions
    .filter((t) => t.categoryKey === 'utilities' || t.type === 'bill_pay')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const cashOutSpending = transactions
    .filter((t) => t.categoryKey === 'cash_out' || t.type === 'cash_out')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const formatBDT = (val) => new Intl.NumberFormat('bn-BD').format(val || 0);

  return (
    <Layout
      title="লেনদেন ইতিহাস ও এআই বিশ্লেষণ (Transactions)"
      isStrictMode={user?.isStrictMode}
      onToggleStrictMode={toggleStrictMode}
      userName={user?.name}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Contextual Voice Guide */}
        <VoiceGuide
          pageContext="transactions"
          message="আপনার লেনদেন সম্পর্কে জানতে বলুন, যেমন: 'আমি মাকে কত টাকা পাঠিয়েছি?' অথবা যেকোনো লেনদেনের ব্যাখ্যা শুনুন।"
        />

        {/* Financial Flow Snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                মোট খরচ ও কর্তন
              </span>
              <span className="text-xl font-bold text-slate-900">৳ {formatBDT(totalOutflow)}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {transactions.filter((t) => t.type !== 'received').length} টি
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                মোট প্রাপ্তি / জমা
              </span>
              <span className="text-xl font-bold text-emerald-700">৳ {formatBDT(totalInflow)}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {transactions.filter((t) => t.type === 'received').length} টি
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                <Receipt className="w-4 h-4 text-amber-600" />
                মোট সার্ভিস ফি
              </span>
              <span className="text-xl font-bold text-slate-800">৳ {formatBDT(totalFees)}</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              সর্বনিম্ন চার্জ
            </span>
          </div>
        </div>

        {/* Category Spending Breakdown Badges */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-700" />
              খাত অনুযায়ী ব্যয় বিশ্লেষণ
            </span>
            <span className="text-[11px] text-slate-400">এই মাসের মোট হিসাব</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🛒</span>
                <div>
                  <span className="block text-xs font-medium text-slate-700">ব্যক্তিগত সেন্ড মানি</span>
                  <span className="block text-[10px] text-slate-400">পরিবার ও বন্ধু</span>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-900">৳ {formatBDT(personalSpending)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <div>
                  <span className="block text-xs font-medium text-slate-700">ইউটিলিটি ও বিল পে</span>
                  <span className="block text-[10px] text-slate-400">বিদ্যুৎ, ইন্টারনেট</span>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-900">৳ {formatBDT(utilitySpending)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🏪</span>
                <div>
                  <span className="block text-xs font-medium text-slate-700">ক্যাশ আউট</span>
                  <span className="block text-[10px] text-slate-400">এজেন্ট পয়েন্ট</span>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-900">৳ {formatBDT(cashOutSpending)}</span>
            </div>
          </div>

          {/* Plain-Bangla Monthly Spending Insight */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-emerald-900 leading-relaxed font-normal">
              <strong>উপকথার আর্থিক সারসংক্ষেপ:</strong> আপনার খরচের একটি বড় অংশ নিয়মিত বিদ্যুৎ ও ইন্টারনেট বিল
              পরিশোধে ব্যবহৃত হয়েছে। সেন্ড মানিতে কোনো অতিরিক্ত ফি কর্তন করা হয়নি, এবং আপনার ৫,০০০ টাকা মানি লকে সুরক্ষিত রয়েছে।
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value) setActiveVoiceFilter(null);
              }}
              placeholder="প্রাপকের নাম (যেমন: মা, রাকিব), বিবরণ বা আইডি দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>

          {/* Voice Search Active Banner */}
          {activeVoiceFilter && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>ভয়েস ফিল্টার সক্রিয়: "<strong>{activeVoiceFilter}</strong>" এর লেনদেনসমূহ</span>
              </div>
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                রিসেট করুন
              </button>
            </div>
          )}

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
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs space-y-2">
              <p>কোনো লেনদেন পাওয়া যায়নি।</p>
              {(searchQuery || filterType !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  সব লেনদেন দেখতে রিসেট করুন
                </button>
              )}
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

        {/* ─── TRANSACTION INTELLIGENCE & AI EXPLANATION MODAL ─── */}
        {selectedTxn && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">উপকথার এআই লেনদেন বিশ্লেষণ</h3>
                    <span className="text-[11px] text-slate-400 font-mono">আইডি: {selectedTxn.id}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Ledger Details Grid */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">প্রাপক / মার্চেন্ট:</span>
                    <span className="font-semibold text-slate-900">{selectedTxn.recipient || selectedTxn.title}</span>
                  </div>
                  {selectedTxn.recipientPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">মোবাইল নম্বর:</span>
                      <span className="font-mono text-slate-700">{selectedTxn.recipientPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">লেনদেনের ধরন:</span>
                    <span className="font-semibold text-slate-900 capitalize">
                      {selectedTxn.type === 'send_money'
                        ? 'সেন্ড মানি'
                        : selectedTxn.type === 'cash_out'
                        ? 'ক্যাশ আউট'
                        : selectedTxn.type === 'bill_pay'
                        ? 'বিল পে'
                        : 'জমা'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">পরিমাণ:</span>
                    <span className="font-bold text-slate-900">৳ {formatBDT(selectedTxn.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">সার্ভিস ফি:</span>
                    <span className="font-medium text-emerald-600">
                      {selectedTxn.fee ? `৳ ${formatBDT(selectedTxn.fee)}` : '৳ ০ (বিনামূল্যে)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">তারিখ ও সময়:</span>
                    <span className="text-slate-700">{selectedTxn.dateDisplay || selectedTxn.date}</span>
                  </div>
                </div>

                {/* Grounded Plain-Bangla Explanation Callout */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-semibold text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>সহজ ভাষায় উপকথার ব্যাখ্যা:</span>
                    </div>

                    {/* Audio Playback Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isSpeaking) {
                          stopSpeaking();
                        } else {
                          speak(explanationText);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        isSpeaking
                          ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                      }`}
                      title={isSpeaking ? 'ভয়েস থামান' : 'বাংলায় শুনে নিন'}
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isSpeaking ? 'থামান' : 'মুখে শুনুন'}</span>
                    </button>
                  </div>

                  <p className="text-emerald-950 text-xs sm:text-sm leading-relaxed font-normal">
                    {isExplaining ? (
                      <span className="text-slate-400 italic">এআই ব্যাখ্যা তৈরি হচ্ছে...</span>
                    ) : (
                      explanationText
                    )}
                  </p>
                </div>

                {/* Reassurance Guarantee Footer */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>এই লেনদেনটি আপনার ৪ ডিজিটের পিন দ্বারা অনুমোদিত ও ব্যাংকিং লেজারে সুরক্ষিত।</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <Button variant="secondary" size="sm" onClick={handleCloseModal}>
                  বুঝেছি, বন্ধ করুন
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
