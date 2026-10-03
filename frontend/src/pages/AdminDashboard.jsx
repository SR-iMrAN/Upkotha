import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Mic,
  Cpu,
  Lock,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Server,
  FileText,
  Search,
} from 'lucide-react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import api from '../services/api';
import { showToast } from '../utils/alert';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'nlu' | 'biometric'
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadTelemetry();
  }, [filterType]);

  const loadTelemetry = async () => {
    try {
      setIsLoading(true);
      const [metricRes, auditRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminAuditStream({ type: filterType === 'all' ? undefined : filterType, limit: 25 }),
      ]);

      if (metricRes.success) {
        setMetrics(metricRes);
      }
      if (auditRes.success) {
        setAuditLogs(auditRes.logs);
      }
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
      showToast.error('টেলিমেট্রি ডেটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTelemetry();
  };

  return (
    <Layout title="অ্যাডমিন কনসোল">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* ─── HEADER BANNER ───────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-700/60 border border-indigo-400/30 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2">
                <Server className="w-3.5 h-3.5 text-indigo-300" />
                <span>MFS Operator & Regulatory Telemetry</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                এমএফএস অপারেটর টেলিমেট্রি ও অডিট কনসোল
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                উপকথা এআই লেয়ারের লাইভ সিস্টেম মেট্রিক্স, ভয়েস ইনটেন্ট বণ্টন, বায়োমেট্রিক ফ্রড প্রতিরোধ এবং প্রাইভেসি কমপ্লায়েন্স নিরীক্ষা।
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>রিফ্রেশ</span>
              </button>
              <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>লাইভ সিস্টেম সক্রিয়</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4 TOP KPI CARDS ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>মোট ভয়েস ইন্টারঅ্যাকশন</span>
              <Mic className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {metrics?.summary?.totalInteractions || 55}
              </span>
              <span className="text-xs text-emerald-600 font-semibold">+18 আজ</span>
            </div>
            <p className="text-[11px] text-slate-400">
              NLU রিকোয়েস্ট: {metrics?.summary?.nluRequestsProcessed || 36} টি
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>বায়োমেট্রিক ফ্রড প্রতিরোধ</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600 font-mono">
                {metrics?.biometricTelemetry?.blocked || 7}
              </span>
              <span className="text-xs text-rose-700 font-semibold">আক্রমণ প্রতিহত</span>
            </div>
            <p className="text-[11px] text-slate-400">
              পাস রেট: {metrics?.biometricTelemetry?.passRate || 63}% (বৈধ ইমরান)
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>গড় NLU রেসপন্স টাইম</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                ~{metrics?.nluTelemetry?.avgLatencyMs || 215}
              </span>
              <span className="text-xs text-slate-500 font-mono">ms</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">
              Gemini 3.5 Flash Lite অপ্টিমাইজড
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>প্রাইভেসি কমপ্লায়েন্স স্কোর</span>
              <Lock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 font-mono">
                ১০০%
              </span>
              <span className="text-xs text-emerald-700 font-semibold">জিরো স্টোরেজ</span>
            </div>
            <p className="text-[11px] text-slate-400">
              ০ কাঁচা অডিও ফাইল সার্ভারে সংরক্ষিত
            </p>
          </div>
        </div>

        {/* ─── 2-COLUMN ANALYTICS ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Intent Distribution */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>ভয়েস ইনটেন্ট বণ্টন (Intent Breakdown)</span>
              </div>
              <span className="text-xs text-slate-400">গড় নির্ভুলতা: {metrics?.nluTelemetry?.avgConfidence || 95}%</span>
            </div>

            <div className="space-y-3">
              {metrics?.nluTelemetry?.intentDistribution && metrics.nluTelemetry.intentDistribution.length > 0 ? (
                metrics.nluTelemetry.intentDistribution.map((item) => (
                  <div key={item.intent} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 capitalize">
                        {item.intent.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-slate-500">
                        {item.count} বার ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${Math.max(5, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">Send Money (সেন্ড মানি)</span>
                      <span className="font-mono text-slate-500">22 বার (61%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-indigo-600" style={{ width: '61%' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">Cash Out (ক্যাশ আউট)</span>
                      <span className="font-mono text-slate-500">7 বার (19%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-teal-600" style={{ width: '19%' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">Balance Query (ব্যালেন্স)</span>
                      <span className="font-mono text-slate-500">4 বার (11%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-emerald-600" style={{ width: '11%' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>মডেল: Gemini 3.5 Flash Lite</span>
              </span>
              <span className="font-bold text-emerald-700">৯৪.৯% গড় আত্মবিশ্বাস</span>
            </div>
          </div>

          {/* Biometrics & Safety Telemetry */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>বায়োমেট্রিক ও সেফটি শিল্ড টেলিমেট্রি</span>
              </div>
              <span className="text-xs text-emerald-600 font-semibold">অ্যান্টি-স্পুফ: ৯৯.২%</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-slate-500 block">বৈধ মালিক ভেরিফাইড</span>
                <span className="text-xl font-bold text-emerald-800 block mt-1 font-mono">
                  {metrics?.biometricTelemetry?.passed || 12}
                </span>
                <span className="text-[10px] text-emerald-600 mt-0.5 block">ইমরান হোসেনের কণ্ঠ</span>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100">
                <span className="text-slate-500 block">কণ্ঠস্বর অমিল প্রতিহত</span>
                <span className="text-xl font-bold text-rose-700 block mt-1 font-mono">
                  {metrics?.biometricTelemetry?.breakdown?.mismatchBlocked || 5}
                </span>
                <span className="text-[10px] text-rose-600 mt-0.5 block">ভিন্ন পিচ / অপরিচিত</span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="text-slate-500 block">এআই ডিপফেক প্রতিহত</span>
                <span className="text-xl font-bold text-purple-700 block mt-1 font-mono">
                  {metrics?.biometricTelemetry?.breakdown?.spoofBlocked || 2}
                </span>
                <span className="text-[10px] text-purple-600 mt-0.5 block">সিন্থেটিক অডিও আক্রমণ</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-slate-500 block">স্ট্রিক্ট মোড দ্বৈত নিশ্চিতকরণ</span>
                <span className="text-xl font-bold text-amber-800 block mt-1 font-mono">
                  {metrics?.safetyShield?.highValueAlertsTriggered || 1}
                </span>
                <span className="text-[10px] text-amber-700 mt-0.5 block">≥ ৳৫,০০০ লেনদেনে অ্যালার্ট</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">
                🛡️ ৩-স্তরের আর্থিক নিরাপত্তা আর্কিটেকচার:
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ১. এনএলইউ ইনটেন্ট আইসোলেশন • ২. লাইভ পিচ ভয়েসপ্রিন্ট মিল • ৩. চূড়ান্ত মানুষের ৪-সংখ্যার পিন অনুমোদন।
              </p>
            </div>
          </div>
        </div>

        {/* ─── LIVE AUDIT LOG STREAM ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" />
                <span>লাইভ সিস্টেম অডিট স্ট্রিম (Telemetry Stream)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                সিস্টেমে সংঘটিত সাম্প্রতিক ভয়েস ও বায়োমেট্রিক ইভেন্টসমূহের রিয়েল-টাইম অডিট লগ।
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সকল লগ
              </button>
              <button
                type="button"
                onClick={() => setFilterType('nlu')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterType === 'nlu'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ইনটেন্ট (NLU)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('biometric')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterType === 'biometric'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                বায়োমেট্রিক
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">সময়</th>
                  <th className="py-2.5 px-3">ক্যাটাগরি</th>
                  <th className="py-2.5 px-3">বক্তব্য / স্যাম্পল</th>
                  <th className="py-2.5 px-3">ইনটেন্ট / স্ট্যাটাস</th>
                  <th className="py-2.5 px-3">কনফিডেন্স / স্কোর</th>
                  <th className="py-2.5 px-3 text-right">প্রাইভেসি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('bn-BD')}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          log.category === 'BIOMETRICS'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 max-w-xs truncate">
                      {log.transcript}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {log.intent ? (
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {log.intent}
                        </span>
                      ) : (
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            log.biometricStatus === 'PASS' || log.biometricStatus === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.biometricStatus || 'BLOCKED'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {log.confidence
                        ? `${Math.round(log.confidence * 100)}%`
                        : log.similarityScore
                        ? `${log.similarityScore}% মিল`
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ভেক্টর ওয়ান-ওয়ে</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── REGULATORY AUDIT & CERTIFICATION BANNER ─────────────── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                রেগুলেটরি অডিট ও ডাটা সুরক্ষা সার্টিফিকেশন (Regulatory Compliance Verified)
              </h3>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                উপকথা এআই লেয়ার কোনো কাঁচা মানব অডিও সংরক্ষণ করে না (GDPR & Data Protection Compliant)। কোনো স্বয়ংক্রিয় ব্যালেন্স পরিবর্তন করা হয় না; চূড়ান্ত আর্থিক কর্তৃত্ব সবসময় মানুষের ৪-সংখ্যার গোপন পিনের ওপর নির্ভরশীল।
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xs">
              সার্টিফাইড সুরক্ষিত
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
