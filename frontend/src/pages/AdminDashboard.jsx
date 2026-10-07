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
  Users,
  Clock3,
  Smile,
  Gauge,
  MessageSquareHeart,
} from 'lucide-react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import api from '../services/api';
import { showToast } from '../utils/alert';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [impactMetrics, setImpactMetrics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadTelemetry();
  }, [filterType]);

  const loadTelemetry = async () => {
    try {
      setIsLoading(true);

      const [metricRes, auditRes, impactRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminAuditStream({
          type: filterType === 'all' ? undefined : filterType,
          limit: 25,
        }),
        api.getImpactMetrics(),
      ]);

      if (metricRes.success) {
        setMetrics(metricRes);
      }

      if (auditRes.success) {
        setAuditLogs(auditRes.logs || []);
      }

      if (impactRes.success) {
        setImpactMetrics(impactRes);
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

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '—';
    return Number(value).toLocaleString('en-US');
  };

  const formatRating = (value) => {
    if (value === null || value === undefined) return '—';
    return `${Number(value).toFixed(1)} / 5`;
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '—';
    return `${Number(value).toFixed(0)}%`;
  };

  const taskLabels = {
    send_money: 'Send Money',
    cash_out: 'Cash Out',
    money_lock: 'Money Lock',
    bill_reminder: 'Bill Reminder',
    transaction_understanding: 'Transaction Understanding',
    balance_check: 'Balance Check',
    voice_navigation: 'Voice Navigation',
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
                উপকথা এআই লেয়ারের লাইভ সিস্টেম মেট্রিক্স, ভয়েস ইনটেন্ট বণ্টন,
                বায়োমেট্রিক ফ্রড প্রতিরোধ, কাস্টমার ইমপ্যাক্ট এবং প্রাইভেসি
                কমপ্লায়েন্স নিরীক্ষা।
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />
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
                {metrics?.summary?.totalInteractions || 0}
              </span>

              <span className="text-xs text-emerald-600 font-semibold">
                লাইভ
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              NLU রিকোয়েস্ট: {metrics?.summary?.nluRequestsProcessed || 0} টি
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>বায়োমেট্রিক ফ্রড প্রতিরোধ</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600 font-mono">
                {metrics?.biometricTelemetry?.blocked || 0}
              </span>

              <span className="text-xs text-rose-700 font-semibold">
                আক্রমণ প্রতিহত
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              পাস রেট:{' '}
              {metrics?.biometricTelemetry?.passRate ?? 0}%
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>গড় NLU রেসপন্স টাইম</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                ~{metrics?.nluTelemetry?.avgLatencyMs ?? 0}
              </span>

              <span className="text-xs text-slate-500 font-mono">
                ms
              </span>
            </div>

            <p className="text-[11px] text-emerald-600 font-medium">
              Gemini-powered NLU
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

              <span className="text-xs text-emerald-700 font-semibold">
                জিরো স্টোরেজ
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              ০ কাঁচা অডিও ফাইল সার্ভারে সংরক্ষিত
            </p>
          </div>
        </div>

        {/* ─── CUSTOMER IMPACT ─────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">

          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquareHeart className="w-5 h-5 text-indigo-300" />
                  <h2 className="text-lg font-extrabold">
                    Customer Impact Measurement
                  </h2>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  বাস্তব prototype interaction থেকে সংগৃহীত customer outcome metrics
                </p>
              </div>

              <div
                className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                  impactMetrics?.measurementStatus?.hasUserData
                    ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-400/30 text-amber-300'
                }`}
              >
                {impactMetrics?.measurementStatus?.hasUserData
                  ? 'REAL USER DATA'
                  : 'NO USER DATA YET'}
              </div>
            </div>

            {/* Main impact metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Gauge className="w-4 h-4" />
                  <span>Task Completion</span>
                </div>

                <div className="text-2xl font-black mt-2">
                  {formatPercent(
                    impactMetrics?.outcomeMetrics?.taskCompletionRate
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Clock3 className="w-4 h-4" />
                  <span>Avg. Completion</span>
                </div>

                <div className="text-2xl font-black mt-2">
                  {impactMetrics?.outcomeMetrics?.averageCompletionTimeSeconds != null
                    ? `${impactMetrics.outcomeMetrics.averageCompletionTimeSeconds}s`
                    : '—'}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Smile className="w-4 h-4" />
                  <span>Confidence</span>
                </div>

                <div className="text-2xl font-black mt-2">
                  {formatRating(
                    impactMetrics?.outcomeMetrics?.averageConfidence
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Satisfaction</span>
                </div>

                <div className="text-2xl font-black mt-2">
                  {formatRating(
                    impactMetrics?.outcomeMetrics?.averageSatisfaction
                  )}
                </div>
              </div>

            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              <div className="bg-slate-800/60 rounded-xl p-3 border border-white/5">
                <span className="text-[11px] text-slate-400 block">
                  Tasks Started
                </span>

                <span className="text-xl font-bold">
                  {formatNumber(
                    impactMetrics?.sampleSize?.tasksStarted
                  )}
                </span>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-white/5">
                <span className="text-[11px] text-slate-400 block">
                  Tasks Completed
                </span>

                <span className="text-xl font-bold">
                  {formatNumber(
                    impactMetrics?.sampleSize?.tasksCompleted
                  )}
                </span>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-white/5">
                <span className="text-[11px] text-slate-400 block">
                  Feedback Responses
                </span>

                <span className="text-xl font-bold">
                  {formatNumber(
                    impactMetrics?.sampleSize?.feedbackResponses
                  )}
                </span>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-white/5">
                <span className="text-[11px] text-slate-400 block">
                  Error Events
                </span>

                <span className="text-xl font-bold">
                  {formatNumber(
                    impactMetrics?.outcomeMetrics?.errorEvents
                  )}
                </span>
              </div>

            </div>

            {/* Ease + channel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    Ease of Use
                  </span>

                  <span className="font-bold text-emerald-300">
                    {formatRating(
                      impactMetrics?.outcomeMetrics?.averageEase
                    )}
                  </span>
                </div>

                <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{
                      width: `${
                        ((impactMetrics?.outcomeMetrics?.averageEase || 0) / 5) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    Interaction Channel
                  </span>

                  <span className="text-xs font-bold text-indigo-300">
                    Voice {impactMetrics?.interactionChannels?.voice || 0}
                    {' · '}
                    Text {impactMetrics?.interactionChannels?.text || 0}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <div
                    className="h-2 rounded-full bg-indigo-400"
                    style={{
                      width: `${
                        (
                          (impactMetrics?.interactionChannels?.voice || 0) /
                          Math.max(
                            1,
                            (impactMetrics?.interactionChannels?.voice || 0) +
                              (impactMetrics?.interactionChannels?.text || 0)
                          )
                        ) * 100
                      }%`,
                    }}
                  />

                  <div
                    className="h-2 rounded-full bg-slate-500"
                    style={{
                      width: `${
                        (
                          (impactMetrics?.interactionChannels?.text || 0) /
                          Math.max(
                            1,
                            (impactMetrics?.interactionChannels?.voice || 0) +
                              (impactMetrics?.interactionChannels?.text || 0)
                          )
                        ) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

            </div>

            {/* Task breakdown */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">

              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-indigo-300" />
                <h3 className="font-bold text-sm">
                  Task-Level Customer Outcomes
                </h3>
              </div>

              <div className="space-y-3">

                {Object.entries(
                  impactMetrics?.taskBreakdown || {}
                ).map(([task, data]) => {

                  const hasData =
                    data.started > 0 ||
                    data.completed > 0 ||
                    data.failed > 0;

                  if (!hasData) return null;

                  return (
                    <div
                      key={task}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-800/60 border border-white/5"
                    >
                      <div>
                        <span className="font-semibold text-sm">
                          {taskLabels[task] || task}
                        </span>

                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Started: {data.started} · Completed:{' '}
                          {data.completed} · Failed: {data.failed}
                        </div>
                      </div>

                      <div className="text-sm font-black text-emerald-300">
                        {formatPercent(data.completionRate)}
                      </div>
                    </div>
                  );
                })}

                {!impactMetrics?.measurementStatus?.hasUserData && (
                  <div className="text-center py-6 text-sm text-slate-400">
                    এখনো কোনো customer impact interaction record করা হয়নি।
                  </div>
                )}

              </div>
            </div>

            {/* Measurement note */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-400/20">
              <ShieldCheck className="w-4 h-4 text-indigo-300 mt-0.5 shrink-0" />

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {impactMetrics?.measurementStatus?.note ||
                  'Customer impact metrics are calculated from recorded prototype interactions.'}
              </p>
            </div>

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

              <span className="text-xs text-slate-400">
                গড় নির্ভুলতা:{' '}
                {metrics?.nluTelemetry?.avgConfidence ?? 0}%
              </span>
            </div>

            <div className="space-y-3">

              {metrics?.nluTelemetry?.intentDistribution &&
              metrics.nluTelemetry.intentDistribution.length > 0 ? (
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
                        style={{
                          width: `${Math.max(5, item.percentage)}%`,
                        }}
                      />
                    </div>

                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400 text-center py-6">
                  কোনো NLU intent data পাওয়া যায়নি।
                </div>
              )}

            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>AI NLU Engine</span>
              </span>

              <span className="font-bold text-emerald-700">
                {metrics?.nluTelemetry?.avgConfidence ?? 0}% confidence
              </span>
            </div>

          </div>

          {/* Biometrics & Safety Telemetry */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">

              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>বায়োমেট্রিক ও সেফটি শিল্ড টেলিমেট্রি</span>
              </div>

              <span className="text-xs text-emerald-600 font-semibold">
                অ্যান্টি-স্পুফ:{' '}
                {metrics?.biometricTelemetry?.antiSpoofAccuracy || '—'}
              </span>

            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-slate-500 block">
                  বৈধ মালিক ভেরিফাইড
                </span>

                <span className="text-xl font-bold text-emerald-800 block mt-1 font-mono">
                  {metrics?.biometricTelemetry?.passed || 0}
                </span>

                <span className="text-[10px] text-emerald-600 mt-0.5 block">
                  সফল ভেরিফিকেশন
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100">
                <span className="text-slate-500 block">
                  কণ্ঠস্বর অমিল প্রতিহত
                </span>

                <span className="text-xl font-bold text-rose-700 block mt-1 font-mono">
                  {metrics?.biometricTelemetry?.breakdown?.mismatchBlocked || 0}
                </span>

                <span className="text-[10px] text-rose-600 mt-0.5 block">
                  ভিন্ন পিচ / অপরিচিত
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="text-slate-500 block">
                  এআই ডিপফেক প্রতিহত
                </span>

                <span className="text-xl font-bold text-purple-700 block mt-1 font-mono">
                  {metrics?.biometricTelemetry?.breakdown?.spoofBlocked || 0}
                </span>

                <span className="text-[10px] text-purple-600 mt-0.5 block">
                  সিন্থেটিক অডিও আক্রমণ
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-slate-500 block">
                  স্ট্রিক্ট মোড দ্বৈত নিশ্চিতকরণ
                </span>

                <span className="text-xl font-bold text-amber-800 block mt-1 font-mono">
                  {metrics?.safetyShield?.highValueAlertsTriggered || 0}
                </span>

                <span className="text-[10px] text-amber-700 mt-0.5 block">
                  উচ্চ-মূল্যের লেনদেনে অ্যালার্ট
                </span>
              </div>

            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">
                🛡️ ৩-স্তরের আর্থিক নিরাপত্তা আর্কিটেকচার:
              </p>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                ১. এনএলইউ ইনটেন্ট আইসোলেশন • ২. লাইভ পিচ
                ভয়েসপ্রিন্ট মিল • ৩. চূড়ান্ত মানুষের ৪-সংখ্যার পিন অনুমোদন।
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
                সিস্টেমে সংঘটিত সাম্প্রতিক ভয়েস ও বায়োমেট্রিক ইভেন্টসমূহের
                রিয়েল-টাইম অডিট লগ।
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
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition"
                  >

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
                            log.biometricStatus === 'PASS' ||
                            log.biometricStatus === 'VERIFIED'
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

                {auditLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-8 text-center text-sm text-slate-400"
                    >
                      কোনো audit log পাওয়া যায়নি।
                    </td>
                  </tr>
                )}

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
                রেগুলেটরি অডিট ও ডাটা সুরক্ষা সার্টিফিকেশন
              </h3>

              <p className="text-slate-600 mt-0.5 leading-relaxed">
                উপকথা এআই লেয়ার কোনো কাঁচা মানব অডিও সংরক্ষণ করে না।
                কোনো স্বয়ংক্রিয় ব্যালেন্স পরিবর্তন করা হয় না; চূড়ান্ত আর্থিক
                কর্তৃত্ব সবসময় মানুষের ৪-সংখ্যার গোপন পিনের ওপর নির্ভরশীল।
              </p>

            </div>
          </div>

          <div className="shrink-0">

            <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xs">
              সুরক্ষিত
            </span>

          </div>
        </div>

      </div>
    </Layout>
  );
}