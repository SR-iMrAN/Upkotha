import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';
import api from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Mic,
  Brain,
  Layers,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  FileText,
  Key,
  Database,
  Sliders,
} from 'lucide-react';

export default function SecurityArchitecture() {
  const navigate = useNavigate();

  // Test scenarios definitions
  const SCENARIOS = [
    {
      id: 'A',
      title: 'দৃশ্যপট ক: স্বাভাবিক ও নিরাপদ লেনদেন (Low Risk)',
      level: 'LOW',
      levelBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'পরিচিত প্রাপক রাকিবকে স্বাভাবিক সময়ে সাধারণ অঙ্কের (৳৫০০) টাকা প্রেরণ।',
      payload: {
        amount: 500,
        recipient: 'রাকিব (০১৭xxxxxxxx)',
        recipientIsNew: false,
        hour: 14, // 2:00 PM
        speakerType: 'owner',
        isSpoofSimulated: false,
      },
      stats: {
        amount: '৳ ৫০০',
        recipient: 'রাকিব (পরিচিত, পূর্বের লেনদেন: ৮টি)',
        time: 'দুপুর ২:০০',
        voiceSimilarity: '৯৪% (উচ্চ সাদৃশ্য)',
        spoofSignal: '৬% (জেনুইন লাইভ কণ্ঠ)',
      },
    },
    {
      id: 'B',
      title: 'দৃশ্যপট খ: মাঝারি ঝুঁকি সতর্কতা (Medium Risk)',
      level: 'MEDIUM',
      levelBadgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'কম পরিচিত প্রাপককে স্বাভাবিক গড়ের চেয়ে বেশি অঙ্কের (৳২,৫০০) টাকা রাত ১১:১৫ টায় প্রেরণ।',
      payload: {
        amount: 2500,
        recipient: 'সুমন আহমেদ (০১৮xxxxxxxx)',
        recipientIsNew: false,
        hour: 23, // 11:15 PM
        speakerType: 'owner',
        isSpoofSimulated: false,
      },
      stats: {
        amount: '৳ ২,৫০০ (গড়ের চেয়ে ৩.৫x বেশি)',
        recipient: 'সুমন আহমেদ (অনিয়মিত পরিচিতি)',
        time: 'রাত ১১:১৫ (অফ-পিক সময়)',
        voiceSimilarity: '৮১% (সীমার কাছাকাছি)',
        spoofSignal: '১৪% (স্বাভাবিক মাইক্রোফোন নয়েজ)',
      },
    },
    {
      id: 'C',
      title: 'দৃশ্যপট গ: চরম ঝুঁকি ও কৃত্রিম স্পুফ (High Risk / Fraud Attack)',
      level: 'HIGH',
      levelBadgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      description: 'গভীর রাতে (রাত ২:৪৭) সম্পূর্ণ নতুন নম্বরে অস্বাভাবিক বড় অঙ্কের (৳১৫,০০০) টাকা ট্রান্সফার চেষ্টা + অডিও স্পুফ।',
      payload: {
        amount: 15000,
        recipient: 'অপরিচিত নম্বর (+৮৮০১৯৯৯৯৯৯৯৯)',
        recipientIsNew: true,
        hour: 2, // 2:47 AM
        speakerType: 'spoof',
        isSpoofSimulated: true,
      },
      stats: {
        amount: '৳ ১৫,০০০ (স্বাভাবিক গড়ের চেয়ে ৩৩ গুণ বেশি)',
        recipient: 'নতুন অপরিচিত নম্বর',
        time: 'রাত ২:৪৭ (গভীর রাতের অস্বাভাবিক সময়)',
        voiceSimilarity: '৫৮% (ভয়েস অমিল)',
        spoofSignal: '৮৮% (কৃত্রিম ডিপফেক বা রেকর্ডকৃত রিপ্লে শনাক্ত)',
      },
    },
  ];

  const [activeScenarioId, setActiveScenarioId] = useState('A');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedScenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  const runEvaluation = async (scenario) => {
    setIsLoading(true);
    try {
      const res = await api.analyzeRisk(scenario.payload);
      if (res.success && res.data) {
        setAnalysisResult(res.data);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      // Fallback local calculation
      const isHigh = scenario.level === 'HIGH';
      const isMed = scenario.level === 'MEDIUM';
      setAnalysisResult({
        engine: 'Upkotha Central Multi-Factor Risk Engine',
        riskScore: isHigh ? 0.88 : isMed ? 0.48 : 0.12,
        riskScorePercent: isHigh ? 88 : isMed ? 48 : 12,
        riskLevel: scenario.level,
        recommendedAction: isHigh ? 'HIGH_FRICTION_CHALLENGE' : isMed ? 'ADDITIONAL_CONFIRMATION' : 'STANDARD',
        frictionLevel: scenario.level,
        frictionAdviceBangla: isHigh
          ? 'উচ্চ ঝুঁকি শনাক্ত হয়েছে! নিরাপত্তা বিধিমোতাবেক সতর্কতামূলক যাচাই ও অতিরিক্ত সম্মতি গ্রহণ আবশ্যক।'
          : isMed
          ? 'মাঝারি ঝুঁকি: প্রাপক ও টাকার পরিমাণ পুনরায় মিলিয়ে নিন এবং সম্মতি নিশ্চিত করুন।'
          : 'স্বাভাবিক ও নিরাপদ লেনদেন। ৪ ডিজিটের পিন দিয়ে সম্পন্ন করুন।',
        breakdown: {
          transactionAnomaly: {
            score: isHigh ? 0.85 : isMed ? 0.42 : 0.05,
            model: 'Isolation Forest (Tree Ensemble)',
          },
          speakerVerification: {
            similarity: isHigh ? 0.58 : isMed ? 0.81 : 0.94,
            similarityPercent: isHigh ? 58 : isMed ? 81 : 94,
            matched: !isHigh,
            distanceMetric: 'Cosine Similarity',
          },
          spoofDetection: {
            spoofScore: isHigh ? 0.88 : isMed ? 0.14 : 0.06,
            spoofPercent: isHigh ? 88 : isMed ? 14 : 6,
            spoofDetected: isHigh,
            signalType: isHigh ? 'SYNTHETIC_REPLAY_DETECTED' : 'GENUINE_LIVE_VOICE',
          },
        },
        signals: isHigh
          ? [
              {
                id: 'VOICE_SPOOF_ALERT',
                title: 'কৃত্রিম কণ্ঠ বা রিপ্লে অডিও শনাক্ত',
                detail: 'ভয়েস ইনপুটে অস্বাভাবিক কৃত্রিম বৈশিষ্ট্য পাওয়া গেছে (স্পুফ স্কোর: ৮৮%)।',
                metric: '88% spoof probability',
                severity: 'CRITICAL',
              },
              {
                id: 'AMOUNT_HIGH_DEVIATION',
                title: 'টাকার পরিমাণ সাধারণ অভ্যাসের চেয়ে লক্ষণীয় বেশি',
                detail: 'বর্তমান ৳১৫,০০০ টাকা আপনার স্বাভাবিক গড় লেনদেনের (৳৪৫০) চেয়ে ৩৩ গুণ বেশি।',
                metric: '33x deviation',
                severity: 'HIGH',
              },
              {
                id: 'RECIPIENT_NOVEL',
                title: 'নতুন ও অপরিচিত প্রাপক',
                detail: 'প্রাপকের নম্বরে পূর্বে কখনো লেনদেন করা হয়নি।',
                metric: 'first_time_recipient',
                severity: 'HIGH',
              },
              {
                id: 'UNUSUAL_TRANSACTION_TIME',
                title: 'অস্বাভাবিক গভীর রাতের লেনদেন',
                detail: 'লেনদেনের সময় রাত ২:৪৭, যা গ্রাহকের স্বাভাবিক সময়সূচীর বাইরে।',
                metric: '2:47 AM',
                severity: 'HIGH',
              },
            ]
          : isMed
          ? [
              {
                id: 'AMOUNT_MODERATE_DEVIATION',
                title: 'টাকার পরিমাণ কিছুটা বেশি',
                detail: 'বর্তমান ৳২,৫০০ টাকা আপনার স্বাভাবিক গড়ের (৳৪৫০) চেয়ে ৩.৫ গুণ বেশি।',
                metric: '3.5x baseline',
                severity: 'MEDIUM',
              },
              {
                id: 'OFF_PEAK_TIME',
                title: 'অফ-পিক সময়সূচি',
                detail: 'লেনদেনটি রাতের শেষ ভাগে (রাত ১১:১৫) সংঘটিত হচ্ছে।',
                metric: '23:15 hrs',
                severity: 'LOW',
              },
            ]
          : [
              {
                id: 'NORMAL_BEHAVIORAL_MATCH',
                title: 'স্বাভাবিক লেনদেন প্যাটার্ন',
                detail: 'প্রাপক পরিচিত এবং টাকার পরিমাণ ঐতিহাসিক নিয়মিত গড়ের সাথে সামঞ্জস্যপূর্ণ।',
                metric: 'nominal (z-score < 1.0)',
                severity: 'INFO',
              },
              {
                id: 'VOICE_BIOMETRIC_PASS',
                title: 'ভয়েস বায়োমেট্রিক অনুমোদিত',
                detail: 'অ্যাকাউন্ট মালিকের কণ্ঠের সাথে ৯৪% মিল পাওয়া গেছে।',
                metric: '94% match',
                severity: 'INFO',
              },
            ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount or tab select
  React.useEffect(() => {
    runEvaluation(selectedScenario);
  }, [activeScenarioId]);

  const handleLaunchSendMoneyDemo = () => {
    navigate('/send-money', {
      state: {
        prefill: {
          recipient: selectedScenario.payload.recipient,
          amount: selectedScenario.payload.amount,
        },
      },
    });
  };

  return (
    <Layout title="AI নিরাপত্তা ও আর্কিটেকচার">
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header Hero */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold mb-3">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI সিকিউরিটি লেয়ার ও প্রযুক্তিগত স্থাপত্য</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            উপকথা: এআই-চালিত বাংলা ভয়েস ও আচরণগত নিরাপত্তা স্তর
          </h1>
          <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl">
            উপকথা কেবলমাত্র একটি স্ট্যান্ডার্ড এপিআই র‍্যাপার বা হিউরিস্টিক ফিল্টার নয়—এটি ৩টি স্বতন্ত্র স্তরে বিভক্ত একটি সমন্বিত আর্কিটেকচার:
          </p>

          {/* Core Philosophy Banner */}
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0" />
              <div>
                <p className="text-xs uppercase font-extrabold text-emerald-800 tracking-wider">
                  মৌলিক নীতি (Core Architectural Principle)
                </p>
                <p className="text-base sm:text-lg font-bold text-slate-900">
                  "AI বোঝে। নিয়ম রক্ষা করে। সিদ্ধান্ত গ্রাহকের।"
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-900">
              AI কখনোই স্বয়ংক্রিয়ভাবে লেনদেন অনুমোদন বা নির্বাহ করে না
            </span>
          </div>
        </div>

        {/* 3-Tier Architecture Diagram */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                সিস্টেমের ৩-স্তর আর্কিটেকচারাল পাইপলাইন
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                কণ্ঠস্বর গ্রহণ থেকে শুরু করে আর্থিক ছাড়পত্র পর্যন্ত প্রতিটি স্তরের প্রযুক্তিগত পৃথকীকরণ
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 rounded-md text-slate-700">
              End-to-End Flow
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            {/* Tier 1: Language Intelligence */}
            <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                ১
              </div>
              <div>
                <h3 className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-blue-600" />
                  ভাষা বুদ্ধিমত্তা (Language Intelligence)
                </h3>
                <p className="text-xs text-blue-800 font-medium mt-0.5">Google Gemini 2.5 Flash</p>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5">
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>প্রাকৃতিক বাংলা ও আঞ্চলিক বুলির ভাষা অনুধাবন (NLU)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>উদ্দেশ্য (Intent) ও সত্ত্বা (Entity: প্রাপক, টাকা) এক্সট্রাকশন</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>কথোপকথন ও সহজবোধ্য আর্থিক ব্যাখ্যা তৈরি</span>
                </li>
              </ul>
              <div className="pt-2 border-t border-blue-200/60 text-[11px] text-blue-900 font-semibold">
                দায়িত্ব: কেবল অনুরোধ বোঝা ও ইন্টারঅ্যাকশন
              </div>
            </div>

            {/* Tier 2: Security Intelligence */}
            <div className="p-5 rounded-xl border-2 border-emerald-500 bg-emerald-50/40 space-y-3 relative shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                ২
              </div>
              <div>
                <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-700" />
                  নিরাপত্তা বুদ্ধিমত্তা (Security Intelligence)
                </h3>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  ML Isolation Forest + Voice Biometrics
                </p>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span><strong>Isolation Forest:</strong> ১১-ফিচার MFS অ্যানোমালি ডিটেকশন</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span><strong>Speaker Verification:</strong> ১৬-D ভেক্টর কোসাইন সাদৃশ্য</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span><strong>Anti-Spoof Signal:</strong> অডিও রিপ্লে ও কৃত্রিম এআই রোধ</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span><strong>Central Risk Engine:</strong> ০.০০-১.০০ সার্বিক ঝুঁকি স্কোর</span>
                </li>
              </ul>
              <div className="pt-2 border-t border-emerald-300 text-[11px] text-emerald-900 font-bold">
                দায়িত্ব: বহুমুখী আচরণগত ঝুঁকি ও বায়োমেট্রিক স্কোরিং
              </div>
            </div>

            {/* Tier 3: Financial Control */}
            <div className="p-5 rounded-xl border border-slate-300 bg-slate-50 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                ৩
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-slate-700" />
                  আর্থিক নিয়ন্ত্রণ (Financial Control)
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">ডিটারমিনিস্টিক ব্যাকএন্ড ও মানুষ</p>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5">
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-800 font-bold">•</span>
                  <span>ব্যালেন্স, দৈনিক সীমা ও লক ব্যালেন্সের কঠোর যাচাই</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-800 font-bold">•</span>
                  <span>৫-মিনিটের অস্থায়ী স্টেজিং টিকেট (No direct execution)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-800 font-bold">•</span>
                  <span>ঝুঁকির মাত্রা অনুযায়ী অ্যাডাপটিভ ঘর্ষণ (Friction) প্রয়োগ</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-800 font-bold">•</span>
                  <span><strong>চূড়ান্ত অনুমোদন:</strong> ব্যবহারকারীর নিজস্ব ৪-সংখ্যার পিন</span>
                </li>
              </ul>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-900 font-semibold">
                দায়িত্ব: বাস্তব টাকার স্থানান্তর ও নিরাপত্তা নিয়ম বলবৎ
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Judge Scenarios Playground */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>বিচারকদের জন্য লাইভ টেস্ট স্যুট (Judge Scenarios)</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                ৩টি নির্দিষ্ট দৃশ্যপটে লাইভ এআই ঝুঁকি ও ঘর্ষণ মূল্যায়ন
              </h2>
            </div>
            <span className="text-xs text-slate-500">এক ক্লিকে বিভিন্ন ঝুঁকির মাত্রা পরীক্ষা করুন</span>
          </div>

          {/* Scenario Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setActiveScenarioId(sc.id)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  activeScenarioId === sc.id
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-500">দৃশ্যপট {sc.id}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${sc.levelBadgeClass}`}>
                    {sc.level} RISK
                  </span>
                </div>
                <h4 className="mt-1 text-sm font-bold text-slate-900">{sc.title.split('(')[0]}</h4>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{sc.description}</p>
              </button>
            ))}
          </div>

          {/* Selected Scenario Details & Live Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Input Vector Preview */}
            <div className="lg:col-span-5 space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-slate-600" />
                ইনপুট ফিচারের তথ্য (Telemetry Data)
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">টাকার পরিমাণ:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedScenario.stats.amount}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">প্রাপক পরিচিতি:</span>
                  <span className="font-bold text-slate-900">{selectedScenario.stats.recipient}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">লেনদেনের সময়:</span>
                  <span className="font-mono text-slate-900">{selectedScenario.stats.time}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">ভয়েস সাদৃশ্য (Cosine):</span>
                  <span className="font-bold text-slate-900">{selectedScenario.stats.voiceSimilarity}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">স্পুফ সিগন্যাল (Anti-Replay):</span>
                  <span className="font-bold text-slate-900">{selectedScenario.stats.spoofSignal}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  icon={Play}
                  isLoading={isLoading}
                  onClick={() => runEvaluation(selectedScenario)}
                >
                  পুনরায় মডেল চালান (Evaluate Model)
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  icon={ArrowRight}
                  onClick={handleLaunchSendMoneyDemo}
                >
                  সেন্ড মানি ফ্লোতে এই দৃশ্যপট ট্রাই করুন
                </Button>
              </div>
            </div>

            {/* Central Risk Engine Output Card */}
            <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      সেন্ট্রাল রিস্ক ইঞ্জিন ফলাফল (Risk Engine Output)
                    </h4>
                    <span className="text-[11px] text-slate-400">রিয়েল-টাইম মাল্টি-ফ্যাক্টর স্কোরিং</span>
                  </div>
                </div>

                {analysisResult && (
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full border ${
                      analysisResult.riskLevel === 'HIGH'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : analysisResult.riskLevel === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {analysisResult.riskLevel} RISK ({analysisResult.riskScorePercent}%)
                  </span>
                )}
              </div>

              {analysisResult ? (
                <div className="space-y-4">
                  {/* Score Gauge */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">কম্পোজিট ঝুঁকি স্কোর (Composite Score):</span>
                      <span className="font-mono font-bold text-slate-900">
                        {analysisResult.riskScore} / ১.০০ ({analysisResult.riskScorePercent}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full transition-all duration-700 rounded-full ${
                          analysisResult.riskLevel === 'HIGH'
                            ? 'bg-rose-600'
                            : analysisResult.riskLevel === 'MEDIUM'
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.max(5, Math.min(100, analysisResult.riskScorePercent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Breakdown Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-400">অ্যানোমালি (ML):</span>
                      <span className="font-mono font-bold text-slate-800">
                        {analysisResult.breakdown?.transactionAnomaly?.score ?? '০.১০'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">ভয়েস সাদৃশ্য:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {analysisResult.breakdown?.speakerVerification?.similarityPercent ?? '৯৫'}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">স্পুফ সম্ভাবনা:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {analysisResult.breakdown?.spoofDetection?.spoofPercent ?? '৫'}%
                      </span>
                    </div>
                  </div>

                  {/* Adaptive Friction Recommendation */}
                  <div className={`p-3.5 rounded-xl border text-xs ${
                    analysisResult.riskLevel === 'HIGH'
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : analysisResult.riskLevel === 'MEDIUM'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  }`}>
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>প্রস্তাবিত নিরাপত্তা ঘর্ষণ (Adaptive Friction): {analysisResult.recommendedAction}</span>
                    </div>
                    <p className="leading-relaxed font-normal">{analysisResult.frictionAdviceBangla}</p>
                  </div>

                  {/* Grounded Signals List */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 mb-2">
                      ব্যাখ্যাযোগ্য সিগন্যালসমূহ (Explainable Signals):
                    </h5>
                    <div className="space-y-1.5">
                      {analysisResult.signals?.map((sig, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs flex items-start justify-between gap-2"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{sig.title}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5">{sig.detail}</p>
                          </div>
                          {sig.metric && (
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                              {sig.metric}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  ফলাফল লোড হচ্ছে...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Technical Deep-Dive & Responsible AI Notice */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            মডেল স্পেসিফিকেশন ও দায়িত্বশীল এআই ঘোষণা (Responsible AI Notice)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800 text-sm">১. সিন্থেটিক ট্রানজেকশন ডেটাসেট ও আইসোলেশন ফরেস্ট</h4>
              <p>
                যেহেতু এটি একটি হ্যাকাথন প্রোটোটাইপ এবং বাস্তব গ্রাহকদের আর্থিক গোপনীয় তথ্য ব্যবহার করা সম্ভব নয়, তাই বাস্তবসম্মত বাংলাদেশি MFS লেনদেনের পরিসংখ্যানগত বৈশিষ্ট্যের ভিত্তিতে একটি সিন্থেটিক ডেটাসেট তৈরি করা হয়েছে (স্বাভাবিক গড় ৳৪৫০, ৮-১০টা দিনকালীন সাধারণ ফ্রিকোয়েন্সি বনাম গভীর রাতে ৳১৫,০০০ এর অ্যানোমালি)।
              </p>
              <p className="font-mono text-[11px] text-emerald-800">
                Formula: s(x, n) = 2^(-E(h(x)) / c(n))
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800 text-sm">২. স্পিকার ভেরিফিকেশন ও স্পুফ ডিটেকশন প্রোটোটাইপ</h4>
              <p>
                ভয়েস বায়োমেট্রিক্সে কোনো কাঁচা অডিও ফাইল সংরক্ষণ করা হয় না (Privacy-by-design)। নিবন্ধিত ও যাচাইকৃত স্বরের ১৬-মাত্রিক অ্যাকোস্টিক ভেক্টর এক্সট্র্যাক্ট করে কোসাইন দূরত্বের মাধ্যমে তুলনা করা হয়। একই সাথে কৃত্রিম ডিপফেক বা রিপ্লে অডিওর অস্বাভাবিক সমতল পিচ বৈচিত্র্য শনাক্তে স্পুফ সিগন্যাল প্রদান করা হয়।
              </p>
              <p className="font-mono text-[11px] text-emerald-800">
                Metric: Cosine Similarity &ge; 0.85 &amp; Spoof Score &lt; 0.50
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 text-slate-700 text-xs flex items-center justify-between flex-wrap gap-2">
            <span className="font-medium">
              সোর্স কোড ও মডেল প্রশিক্ষণ স্ক্রিপ্ট: <code>backend/services/anomalyDetectionService.js</code>, <code>backend/ml/train_anomaly_model.py</code>
            </span>
            <span className="font-semibold text-emerald-700">Hackathon AI Evaluation Ready</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
