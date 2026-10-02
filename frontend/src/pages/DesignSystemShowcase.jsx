import React, { useState } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import BalanceCard from '../components/BalanceCard';
import TransactionCard from '../components/TransactionCard';
import AIInsightCard from '../components/AIInsightCard';
import ConfirmationModal from '../components/ConfirmationModal';
import { Send, ArrowDownToLine, Lock, Check, Sparkles, AlertCircle } from 'lucide-react';

export default function DesignSystemShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStrictMode, setIsStrictMode] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const sampleTransactions = [
    {
      id: 'TXN-9021',
      title: 'রাকিব (Send Money)',
      recipient: 'রাকিব',
      type: 'send_money',
      amount: 500,
      date: 'আজ, ০২:১৫ অপরাহ্ন',
      category: 'ব্যক্তিগত',
      status: 'সম্পন্ন',
    },
    {
      id: 'TXN-9018',
      title: 'DESCO প্রিপেইড মিটার',
      recipient: 'DESCO',
      type: 'bill_pay',
      amount: 1250,
      date: 'গতকাল, ১১:৩০ পূর্বাহ্ন',
      category: 'বিদ্যুৎ বিল',
      status: 'সম্পন্ন',
    },
    {
      id: 'TXN-9014',
      title: 'রহিম স্টোর (Cash Out)',
      recipient: 'রহিম স্টোর',
      type: 'cash_out',
      amount: 2000,
      date: '২৮ সেপ্টেম্বর',
      category: 'এজেন্ট ক্যাশআউট',
      status: 'সম্পন্ন',
    },
  ];

  const handleConfirmTransaction = (pin) => {
    setModalLoading(true);
    setTimeout(() => {
      setModalLoading(false);
      setIsModalOpen(false);
      setSuccessMsg(`পিন (${pin}) সফলভাবে যাচাই হয়েছে এবং ৫০০ টাকার ট্রানজ্যাকশন সিমুলেট করা হয়েছে!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 1200);
  };

  return (
    <Layout
      title="ডিজাইন সিস্টেম ও কম্পোনেন্ট লাইব্রেরি"
      isStrictMode={isStrictMode}
      onToggleStrictMode={() => setIsStrictMode(!isStrictMode)}
    >
      <div className="space-y-8">
        {/* Notification Banner if action succeeded */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section 1: Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upkotha ডিজাইন সিস্টেম</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              একটি বিশ্বস্ত, পরিচ্ছন্ন ও অ্যাক্সেসিবল ফিনটেক অভিজ্ঞতা — বাংলা ফন্ট ও সহজ রঙের বিন্যাস।
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={isStrictMode ? 'danger' : 'outline'}
              size="sm"
              onClick={() => setIsStrictMode(!isStrictMode)}
            >
              {isStrictMode ? 'স্ট্রিক্ট মোড: অন' : 'স্ট্রিক্ট মোড: অফ'}
            </Button>
          </div>
        </div>

        {/* Section 2: Balance Cards */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
            ১. ব্যালেন্স কার্ড (BalanceCard)
          </h3>
          <BalanceCard
            available={13500}
            locked={5000}
            userName="ইমরান"
            accountNumber="01712-345678"
          />
        </div>

        {/* Section 3: AI Insight Cards */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
            ২. এআই পর্যবেক্ষণ কার্ড (AIInsightCard)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AIInsightCard
              type="observation"
              title="উপকথার পর্যবেক্ষণ"
              message="আপনার electricity payment সাধারণত মাসের ৫ তারিখের দিকে হয়। প্রস্তুত রাখতে আপনার available balance পর্যাপ্ত আছে।"
              actionLabel="রিমাইন্ডার দেখুন"
              onAction={() => alert('রিমাইন্ডারে নেভিগেট')}
            />
            <AIInsightCard
              type="warning"
              title="খরচের সতর্কতা"
              message="এই মাসে ক্যাশ-আউট খরচ গত মাসের চেয়ে ১৮% বেশি। সঞ্চয় বাড়াতে মানি লক ব্যবহার করতে পারেন।"
              actionLabel="টাকা লক করুন"
              onAction={() => alert('মানি লক স্ক্রিনে নেওয়া হচ্ছে')}
            />
          </div>
        </div>

        {/* Section 4: Transaction Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              ৩. লেনদেন আইটেম কার্ড (TransactionCard)
            </h3>
            <span className="text-xs text-slate-500">উপকথার ব্যাখ্যা বোতাম যুক্ত</span>
          </div>
          <div className="space-y-3">
            {sampleTransactions.map((txn) => (
              <TransactionCard
                key={txn.id}
                transaction={txn}
                onExplain={(t) => alert(`উপকথা ব্যাখ্যা: "${t.title} বাবদ ৳${t.amount} টাকা লেনদেন সম্পন্ন হয়েছে।"`)}
              />
            ))}
          </div>
        </div>

        {/* Section 5: Standard Buttons & Interactive Modal */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            ৪. বোতাম এবং ইন্টারেক্টিভ কনফার্মেশন মোডাল
          </h3>

          <div className="flex flex-wrap gap-3 items-center">
            <Button
              variant="primary"
              icon={Send}
              onClick={() => setIsModalOpen(true)}
            >
              লেনদেন নিশ্চিতকরণ পরীক্ষা (Modal)
            </Button>

            <Button
              variant="secondary"
              icon={ArrowDownToLine}
              onClick={() => alert('Secondary Action')}
            >
              সেকেন্ডারি বাটন
            </Button>

            <Button
              variant="outline"
              icon={Lock}
              onClick={() => alert('Outline Action')}
            >
              আউটলাইন বাটন
            </Button>

            <Button
              variant="subtle"
              icon={Sparkles}
              onClick={() => alert('Subtle Action')}
            >
              সাবটল এআই বাটন
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => alert('Danger Action')}
            >
              সতর্কতামূলক
            </Button>

            <Button
              variant="primary"
              size="md"
              isLoading={true}
            >
              লোডিং টেস্ট
            </Button>
          </div>
        </div>

        {/* Reusable High-Trust Confirmation Modal */}
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmTransaction}
          recipient="রাকিব (০১৭৯৮-৭৬৫৪৩২)"
          amount={500}
          fee={0}
          availableBalance={13500}
          isStrictMode={isStrictMode}
          anomalyWarning={isStrictMode ? 'স্ট্রিক্ট মোডে বাড়তি সতর্কতা হিসেবে প্রাপকের নম্বর যাচাই করতে বলা হচ্ছে।' : null}
          isLoading={modalLoading}
        />
      </div>
    </Layout>
  );
}
