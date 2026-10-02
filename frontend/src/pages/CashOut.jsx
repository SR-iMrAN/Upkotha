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
  ArrowDownToLine,
  Store,
  MapPin,
  Volume2,
  Wallet,
  Lock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

const AGENTS = [
  { id: 'ag1', name: 'রহিম স্টোর', area: 'মোহাম্মদপুর, ঢাকা', code: 'AG-10928' },
  { id: 'ag2', name: 'করিম এজেন্ট পয়েন্ট', area: 'মিরপুর-১০, ঢাকা', code: 'AG-10929' },
  { id: 'ag3', name: 'শহীদ ট্রেডার্স', area: 'ধানমন্ডি, ঢাকা', code: 'AG-10930' },
];

const QUICK_AMOUNTS = [500, 1000, 2000, 3000, 5000];

export default function CashOut() {
  const { user, toggleStrictMode, updateBalance } = useAuth();
  const navigate = useNavigate();

  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [customAgent, setCustomAgent] = useState('');
  const [amount, setAmount] = useState('2000');
  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Staged data & modal state
  const [stagedData, setStagedData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Receipt state
  const [receipt, setReceipt] = useState(null);

  const numAmount = Number(amount) || 0;
  const estimatedFee = Math.round(numAmount * 0.01);
  const totalDeduction = numAmount + estimatedFee;

  const handleValidate = async (e) => {
    e.preventDefault();

    const agentName = customAgent.trim() || selectedAgent?.name;
    if (!agentName) {
      showToast.error('অনুগ্রহ করে এজেন্ট নির্বাচন করুন');
      return;
    }

    if (!numAmount || numAmount <= 0) {
      showToast.error('সঠিক টাকার পরিমাণ দিন');
      return;
    }

    try {
      setIsValidating(true);
      const res = await api.validateTransaction({
        type: 'cash_out',
        agent: agentName,
        amount: numAmount,
      });

      setStagedData(res);
      setIsModalOpen(true);
    } catch (err) {
      showAlert({
        title: 'ক্যাশ আউট যাচাই ব্যর্থ',
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
      const res = await api.cashOut({
        stageId: stagedData?.stageId,
        agent: stagedData?.recipient || selectedAgent?.name,
        amount: stagedData?.amount || numAmount,
        pin,
      });

      const agentName = stagedData?.recipient || selectedAgent?.name || 'এজেন্ট পয়েন্ট';
      const actualAmount = stagedData?.amount || numAmount;
      const actualFee = stagedData?.fee ?? estimatedFee;
      const totalDeduct = actualAmount + actualFee;

      const receiptData = res?.receipt || {
        transactionId: res?.transaction?.id || `TXN-${Date.now().toString().slice(-6)}`,
        recipient: res?.transaction?.recipient || agentName,
        amount: res?.transaction?.amount || actualAmount,
        fee: res?.transaction?.fee ?? actualFee,
        totalDeduction: totalDeduct,
        newAvailableBalance: res?.newBalance?.available ?? (user?.availableBalance - totalDeduct),
        lockedBalance: res?.newBalance?.locked ?? user?.lockedBalance,
        dateDisplay: res?.transaction?.dateDisplay || 'আজ, এইমাত্র',
        explanationBangla: res?.transaction?.explanationBangla || `${agentName} থেকে ৳${actualAmount} টাকা ক্যাশ আউট সম্পন্ন হয়েছে।`,
      };

      setIsModalOpen(false);
      setReceipt(receiptData);

      if (receiptData?.newAvailableBalance !== undefined) {
        updateBalance(receiptData.newAvailableBalance, receiptData.lockedBalance);
      }
      showToast.success('ক্যাশ আউট সফল হয়েছে!');
    } catch (err) {
      showAlert({
        title: 'ক্যাশ আউট সম্পন্ন হয়নি',
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
    setAmount('2000');
    setCustomAgent('');
    setSelectedAgent(AGENTS[0]);
  };

  const formatBDT = (val) => new Intl.NumberFormat('bn-BD').format(val || 0);

  return (
    <Layout
      title="ক্যাশ আউট (Cash Out)"
      isStrictMode={user?.isStrictMode}
      onToggleStrictMode={toggleStrictMode}
      userName={user?.name}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Contextual Voice Guide */}
        <VoiceGuide
          pageContext="cash_out"
          message="Cash Out করতে agent নির্বাচন করুন এবং amount বলুন।"
        />

        {/* Balance Awareness Banner */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
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
            <span className="text-[11px] text-slate-400">লক করা টাকা ক্যাশ আউট হবে না</span>
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
                সিমুলেটেড ক্যাশ আউট সম্পন্ন
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
                <span className="text-slate-500">এজেন্ট পয়েন্ট:</span>
                <span className="font-semibold text-slate-900">{receipt.recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">সার্ভিস ফি (১%):</span>
                <span className="font-medium text-slate-700">৳ {formatBDT(receipt.fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">মোট কর্তন:</span>
                <span className="font-semibold text-rose-700">৳ {formatBDT(receipt.totalDeduction)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-semibold text-slate-900">
                <span>নতুন উপলব্ধ ব্যালেন্স:</span>
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
                আরেকটি ক্যাশ আউট
              </Button>
              <Link to="/dashboard" className="w-full">
                <Button variant="primary" fullWidth icon={ArrowRight}>
                  ড্যাশবোর্ডে ফিরুন
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* ─── CASH OUT FORM ────────────────────────────────── */
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            {/* Agent Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                অনুমোদিত এজেন্ট নির্বাচন করুন:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setCustomAgent('');
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      selectedAgent?.id === agent.id && !customAgent
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                        <Store className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{agent.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{agent.area}</span>
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block">
                      {agent.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleValidate} className="space-y-4">
              {/* Optional Custom Agent Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  অথবা অন্য কোনো এজেন্ট নম্বর লিখুন
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customAgent}
                    onChange={(e) => {
                      setCustomAgent(e.target.value);
                      setSelectedAgent(null);
                    }}
                    placeholder="এজেন্ট নম্বর (যেমন: 01553-456789)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    উত্তোলনের পরিমাণ (৳)
                  </label>
                  <span className="text-[11px] text-slate-400">ফি: ১% (৳১০ প্রতি ১,০০০ টাকায়)</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                    ৳
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="2000"
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
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ৳{q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Fee and Total Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>উত্তোলন পরিমাণ:</span>
                  <span>৳ {formatBDT(numAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>সার্ভিস চার্জ (১%):</span>
                  <span>৳ {formatBDT(estimatedFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>মোট কর্তন হবে:</span>
                  <span className="text-amber-800">৳ {formatBDT(totalDeduction)}</span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                icon={ArrowDownToLine}
                isLoading={isValidating}
              >
                ক্যাশ আউট এগিয়ে যান
              </Button>
            </form>
          </div>
        )}

        {/* High-Security Confirmation Modal with PIN */}
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmPin}
          title="ক্যাশ আউট নিশ্চিতকরণ"
          recipient={stagedData?.recipient}
          amount={stagedData?.amount || 0}
          fee={stagedData?.fee || estimatedFee}
          availableBalance={user?.availableBalance || 0}
          isStrictMode={user?.isStrictMode}
          anomalyWarning={stagedData?.anomalySignal?.messageBangla}
          isLoading={isExecuting}
        />
      </div>
    </Layout>
  );
}
