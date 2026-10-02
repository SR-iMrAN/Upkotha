import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';
import ConfirmationModal from '../components/ConfirmationModal';
import VoiceGuide from '../components/VoiceGuide';
import { useAuth } from '../context/AuthContext';
import { showToast, showAlert } from '../utils/alert';
import api from '../services/api';
import {
  Send,
  User,
  Phone,
  Volume2,
  Wallet,
  Lock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

export default function SendMoney() {
  const { user, toggleStrictMode, updateBalance } = useAuth();
  const navigate = useNavigate();

  const [recipient, setRecipient] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [amount, setAmount] = useState('500');
  const [note, setNote] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Staged transaction state
  const [stagedData, setStagedData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Completed Receipt state
  const [receipt, setReceipt] = useState(null);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setRecipient(contact.name);
    showToast.info(`${contact.name} নির্বাচন করা হয়েছে`);
  };

  const handleValidate = async (e) => {
    e.preventDefault();

    if (!recipient.trim()) {
      showToast.error('প্রাপকের নাম বা মোবাইল নম্বর দিন');
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast.error('সঠিক টাকার পরিমাণ দিন');
      return;
    }

    try {
      setIsValidating(true);
      const res = await api.validateTransaction({
        type: 'send_money',
        recipient: recipient.trim(),
        amount: numAmount,
      });

      setStagedData(res);
      setIsModalOpen(true);
    } catch (err) {
      showAlert({
        title: 'লেনদেন যাচাই করা যায়নি',
        text: err.message,
        icon: 'error',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmPin = async (pin) => {
    try {
      setIsExecuting(true);
      const res = await api.sendMoney({
        stageId: stagedData?.stageId,
        recipient: stagedData?.recipient || recipient,
        amount: stagedData?.amount || Number(amount),
        pin,
      });

      const targetRecipient = stagedData?.recipient || recipient || 'প্রাপক';
      const actualAmount = stagedData?.amount || Number(amount);

      const receiptData = res?.receipt || {
        transactionId: res?.transaction?.id || `TXN-${Date.now().toString().slice(-6)}`,
        recipient: res?.transaction?.recipient || targetRecipient,
        amount: res?.transaction?.amount || actualAmount,
        fee: 0,
        totalDeduction: actualAmount,
        newAvailableBalance: res?.newBalance?.available ?? (user?.availableBalance - actualAmount),
        lockedBalance: res?.newBalance?.locked ?? user?.lockedBalance,
        dateDisplay: res?.transaction?.dateDisplay || 'আজ, এইমাত্র',
        explanationBangla: res?.transaction?.explanationBangla || `${targetRecipient}-কে ৳${actualAmount} টাকা সফলভাবে পাঠানো হয়েছে।`,
      };

      setIsModalOpen(false);
      setReceipt(receiptData);

      if (receiptData?.newAvailableBalance !== undefined) {
        updateBalance(receiptData.newAvailableBalance, receiptData.lockedBalance);
      }
      showToast.success('লেনদেন সফলভাবে সম্পন্ন হয়েছে!');
    } catch (err) {
      showAlert({
        title: 'লেনদেন ব্যর্থ হয়েছে',
        text: err.message,
        icon: 'error',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    setReceipt(null);
    setStagedData(null);
    setRecipient('');
    setSelectedContact(null);
    setAmount('500');
    setNote('');
  };

  const formatBDT = (val) => new Intl.NumberFormat('bn-BD').format(val || 0);

  return (
    <Layout
      title="সেন্ড মানি (Send Money)"
      isStrictMode={user?.isStrictMode}
      onToggleStrictMode={toggleStrictMode}
      userName={user?.name}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Contextual Voice Guide */}
        <VoiceGuide
          pageContext="send_money"
          message="যাকে টাকা পাঠাতে চান তার নাম বলুন অথবা contact থেকে নির্বাচন করুন।"
        />

        {/* Balance Status Banner (With Locked Protection Awareness) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">ব্যবহারযোগ্য ব্যালেন্স</span>
              <span className="text-lg font-bold text-slate-900">৳ {formatBDT(user?.availableBalance)}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-amber-700 font-medium flex items-center justify-end gap-1">
              <Lock className="w-3 h-3 text-amber-600" />
              ৳ {formatBDT(user?.lockedBalance)} সুরক্ষিত
            </span>
            <span className="text-[11px] text-slate-400">লক করা টাকা ব্যয়যোগ্য নয়</span>
          </div>
        </div>

        {/* ─── SUCCESS RECEIPT (After execution) ───────────────── */}
        {receipt ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 shadow-md text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                সিমুলেটেড লেনদেন সম্পন্ন
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
                ৳ {formatBDT(receipt.amount)}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                ট্রানজ্যাকশন আইডি: {receipt.transactionId}
              </p>
            </div>

            {/* Receipt Summary Table */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">প্রাপক:</span>
                <span className="font-semibold text-slate-900">{receipt.recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">সময়:</span>
                <span className="text-slate-700">{receipt.dateDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">সার্ভিস ফি:</span>
                <span className="font-medium text-emerald-600">৳ ০ (বিনামূল্যে)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-semibold text-slate-900">
                <span>নতুন ব্যবহারযোগ্য ব্যালেন্স:</span>
                <span className="text-emerald-700">৳ {formatBDT(receipt.newAvailableBalance)}</span>
              </div>
            </div>

            {/* AI Explanation Callout */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-left text-xs">
              <div className="flex items-center gap-1.5 text-emerald-900 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>উপকথার ব্যাখ্যা:</span>
              </div>
              <p className="text-emerald-800 leading-relaxed font-normal">
                {receipt.explanationBangla}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                fullWidth
                icon={RotateCcw}
                onClick={handleReset}
              >
                আরেকটি লেনদেন করুন
              </Button>
              <Link to="/dashboard" className="w-full">
                <Button variant="primary" fullWidth icon={ArrowRight}>
                  ড্যাশবোর্ডে ফিরুন
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* ─── SEND MONEY FORM ──────────────────────────────── */
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            {/* Quick Contacts Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                সংরক্ষিত পরিচিতি থেকে বেছে নিন:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {user?.contacts?.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleSelectContact(contact)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                      selectedContact?.id === contact.id
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {contact.avatar}
                    </div>
                    <div className="truncate">
                      <span className="block text-xs font-semibold text-slate-800 truncate">
                        {contact.name}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono truncate">
                        {contact.phone}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleValidate} className="space-y-4">
              {/* Recipient Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  প্রাপকের নাম অথবা মোবাইল নম্বর
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => {
                      setRecipient(e.target.value);
                      setSelectedContact(null);
                    }}
                    placeholder="যেমন: রাকিব অথবা 01798765432"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    টাকার পরিমাণ (৳)
                  </label>
                  <span className="text-[11px] text-slate-400">সর্বনিম্ন ৳১০ • সর্বোচ্চ ৳২৫,০০০</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                    ৳
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                    min="10"
                    max="25000"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>

                {/* Quick Amount Pills */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {QUICK_AMOUNTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(q.toString())}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                        amount === q.toString()
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ৳{q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strict Mode / Behavioral Warning Preview */}
              {Number(amount) >= 5000 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>সতর্কতা:</strong> এই পরিমাণ টাকা আপনার গড় খরচের চেয়ে বেশি। নিশ্চিত করার পূর্বে প্রাপক যাচাই করবেন।
                  </p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                icon={Send}
                isLoading={isValidating}
              >
                এগিয়ে যান
              </Button>
            </form>
          </div>
        )}

        {/* High-Security Confirmation Modal with PIN */}
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmPin}
          title="সেন্ড মানি নিশ্চিতকরণ"
          recipient={stagedData?.recipient}
          amount={stagedData?.amount || 0}
          fee={0}
          availableBalance={user?.availableBalance || 0}
          isStrictMode={user?.isStrictMode}
          anomalyWarning={stagedData?.anomalySignal?.messageBangla}
          isLoading={isExecuting}
        />
      </div>
    </Layout>
  );
}
