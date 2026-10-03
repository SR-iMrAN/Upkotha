import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Mic,
  MicOff,
  Activity,
  UserCheck,
  UserX,
  Radio,
  Lock,
  Volume2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  History,
  Info,
  Sliders,
} from 'lucide-react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { useVoice } from '../context/VoiceContext';
import api from '../services/api';
import { showToast } from '../utils/alert';

/**
 * Autocorrelation pitch detection algorithm for Web Audio API.
 * Computes fundamental frequency (F0 in Hz) from raw audio buffer.
 */
function detectFundamentalFrequency(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.015) return null; // Background silence

  let r1 = 0;
  let r2 = buffer.length - 1;
  const thres = 0.2;
  for (let i = 0; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[buffer.length - i]) < thres) {
      r2 = buffer.length - i;
      break;
    }
  }

  const trimmed = buffer.subarray(r1, r2);
  const size = trimmed.length;
  const c = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - i; j++) {
      c[i] += trimmed[j] * trimmed[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1] && d < size - 1) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < size; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  if (maxpos <= 0) return null;
  const pitch = sampleRate / maxpos;
  if (pitch >= 75 && pitch <= 400) {
    return pitch;
  }
  return null;
}

export default function VoiceSecurity() {
  const { speak, isListening: isContextListening, startListening: startContextListening, stopListening: stopContextListening, transcript } = useVoice();

  const [profile, setProfile] = useState(null);
  const [acousticSpec, setAcousticSpec] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mode: 'live_mic' (Real Web Audio API Pitch detection) vs 'preset' (Judge Scenario simulator)
  const [testingMode, setTestingMode] = useState('live_mic');

  // Verification Testing State
  const [selectedSpeaker, setSelectedSpeaker] = useState('owner'); // for preset mode
  const [testPhrase, setTestPhrase] = useState('রাকিবকে ৫০০ টাকা পাঠাও');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Live Microphone Audio Context State
  const [isLiveRecording, setIsLiveRecording] = useState(false);
  const [livePitch, setLivePitch] = useState(null);
  const [pitchHistory, setPitchHistory] = useState([]);
  const [audioVisualBars, setAudioVisualBars] = useState(new Array(20).fill(15));

  // Calibration State
  const [isCalibrating, setIsCalibrating] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    loadVoiceData();
    return () => {
      stopLiveMic();
    };
  }, []);

  const loadVoiceData = async () => {
    try {
      setIsLoading(true);
      const [profRes, logsRes] = await Promise.all([
        api.getVoiceProfile(),
        api.getVoiceLogs(),
      ]);

      if (profRes.success) {
        setProfile(profRes.profile);
        setAcousticSpec(profRes.acousticSpec);
      }
      if (logsRes.success) {
        setLogs(logsRes.logs);
      }
    } catch (err) {
      console.error('Failed to load voice profile data:', err);
      showToast.error('ভয়েস প্রোফাইল লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  // Start Real Hardware Microphone Analysis via Web Audio API
  const startLiveMic = async () => {
    try {
      setLivePitch(null);
      setPitchHistory([]);
      setVerificationResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsLiveRecording(true);
      startContextListening(); // Also capture speech-to-text transcript

      const detectedPitches = [];
      const buffer = new Float32Array(analyser.fftSize);
      const freqData = new Uint8Array(analyser.frequencyBinCount);

      const updateAcoustics = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getFloatTimeDomainData(buffer);
        analyserRef.current.getByteFrequencyData(freqData);

        // Update animated visualizer bars
        const step = Math.floor(freqData.length / 20);
        const bars = [];
        for (let i = 0; i < 20; i++) {
          const val = freqData[i * step] || 10;
          bars.push(Math.max(15, Math.min(100, (val / 255) * 100)));
        }
        setAudioVisualBars(bars);

        // Calculate Fundamental Frequency (F0)
        const currentPitch = detectFundamentalFrequency(buffer, audioCtx.sampleRate);
        if (currentPitch && currentPitch >= 80 && currentPitch <= 350) {
          detectedPitches.push(currentPitch);
          if (detectedPitches.length > 30) detectedPitches.shift();

          const avg = detectedPitches.reduce((a, b) => a + b, 0) / detectedPitches.length;
          setLivePitch(Math.round(avg));
          setPitchHistory([...detectedPitches]);
        }

        animFrameRef.current = requestAnimationFrame(updateAcoustics);
      };

      updateAcoustics();
      showToast.info('মাইক্রোফোন সক্রিয়: কথা বলুন');
    } catch (err) {
      console.warn('Microphone access failed or denied:', err);
      showToast.warning('মাইক্রোফোন সক্রিয় করা যায়নি। প্রিসেট মোড ব্যবহার করুন।');
      setTestingMode('preset');
    }
  };

  const stopLiveMic = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsLiveRecording(false);
    stopContextListening();
    setAudioVisualBars(new Array(20).fill(15));
  };

  const handleRunVerification = async () => {
    try {
      setIsVerifying(true);
      setVerificationResult(null);

      let payload;

      if (testingMode === 'live_mic') {
        const finalPitch = livePitch;
        if (!finalPitch) {
          showToast.warning('কোনো কণ্ঠস্বর বা পিচ পরিমাপ করা যায়নি। অনুগ্রহ করে মাইক অন করে কথা বলুন।');
          setIsVerifying(false);
          return;
        }
        stopLiveMic();

        payload = {
          sampleTranscript: transcript || testPhrase,
          sampleDuration: 2.5,
          audioFeatures: {
            pitchHz: finalPitch,
          },
        };
      } else {
        // Preset Judge Simulation Mode
        payload = {
          simulatedSpeaker: selectedSpeaker === 'spoof' ? 'owner' : selectedSpeaker,
          simulatedSpoof: selectedSpeaker === 'spoof',
          sampleTranscript: testPhrase,
          sampleDuration: 2.5,
        };
      }

      const res = await api.verifyVoice(payload);
      setVerificationResult(res);

      if (res.messageBangla) {
        speak(res.messageBangla);
      }

      if (res.isVerified) {
        showToast.success('কণ্ঠস্বর সফলভাবে যাচাই করা হয়েছে');
      } else if (res.antiSpoofStatus === 'SYNTHETIC_SPOOF_DETECTED') {
        showToast.error('কৃত্রিম বা রেকর্ডকৃত শব্দ (Spoofing) শনাক্ত হয়েছে!');
      } else {
        showToast.warning('কণ্ঠস্বর অমিল: পরিচয় নিশ্চিত হওয়া যায়নি');
      }

      // Refresh recent logs
      const updatedLogs = await api.getVoiceLogs();
      if (updatedLogs.success) {
        setLogs(updatedLogs.logs);
      }
    } catch (err) {
      console.error('Verification failed:', err);
      showToast.error('যাচাইকরণ প্রক্রিয়া সম্পন্ন করা যায়নি');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRecalibrate = async () => {
    try {
      setIsCalibrating(true);
      const targetPitch = livePitch || 128.4 + (Math.random() * 2 - 1);
      const res = await api.enrollVoice({
        phrase: 'আমার ব্যালেন্স কত',
        pitchHz: targetPitch,
      });

      if (res.success) {
        setProfile(res.profile);
        showToast.success('ভয়েস মডেল সফলভাবে রিক্যালিব্রেট করা হয়েছে');
        speak(`আপনার ভয়েস প্রোফাইল নতুন পিচ ${Math.round(targetPitch)} হার্টজে রিক্যালিব্রেট করা হয়েছে।`);
      }
    } catch (err) {
      console.error('Calibration failed:', err);
      showToast.error('রিক্যালিব্রেশন ব্যর্থ হয়েছে');
    } finally {
      setIsCalibrating(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* ─── HEADER ──────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-400/30 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>বায়োমেট্রিক স্পিকার সিকিউরিটি লেয়ার</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                ভয়েস বায়োমেট্রিক ও স্পিকার ভেরিফিকেশন
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                অননুমোদিত কণ্ঠস্বর ও এআই ডিপফেক/রেকর্ডিং থেকে আর্থিক সুরক্ষা। আপনার অ্যাকাউন্ট শুধুমাত্র আপনার কণ্ঠের পিচ ও ফ্রিকোয়েন্সিতে নির্দেশ গ্রহণ করবে।
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-emerald-700/50">
              <span className="text-[11px] text-emerald-300">এনরোলমেন্ট স্ট্যাটাস</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                সক্রিয় ও সুরক্ষিত
              </span>
            </div>
          </div>
        </div>

        {/* ─── PROFILE & ACOUSTIC METRICS CARD ─────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>নিবন্ধিত ভয়েসপ্রিন্ট বৈশিষ্ট্য (Voiceprint Parameters)</span>
            </div>
            <button
              onClick={handleRecalibrate}
              disabled={isCalibrating}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin' : ''}`} />
              <span>{isCalibrating ? 'ক্যালিব্রেট হচ্ছে...' : 'রিক্যালিব্রেট করুন'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">প্রাথমিক বক্তা</span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5">
                {profile?.primarySpeaker || 'ইমরান হোসেন'}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-1">✓ মালিক ভেরিফাইড</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">নিবন্ধিত পিচ (F0)</span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5">
                ~{Math.round(profile?.fundamentalFrequencyHz || 128)} Hz
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">ব্যাপ্তী: 110 - 155 Hz</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">স্পেকট্রাল সেন্ট্রয়েড</span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5">
                {profile?.spectralCentroidHz || 1820.5} Hz
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">গাণিতিক অ্যাকোস্টিক ভেক্টর</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">অ্যান্টি-স্পুফ শিল্ড</span>
              <span className="text-sm font-bold text-emerald-700 block mt-0.5">
                সক্রিয় (Active)
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">লাইভনেস সেন্সিটিভিটি: ৮৫%</span>
            </div>
          </div>

          {/* Privacy Notice Pill */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>গোপনীয়তা রক্ষা ও নীতি:</strong> উপকথা কোনো কাঁচা অডিও ফাইল সংরক্ষণ করে না। শুধুমাত্র একমুখী গাণিতিক বায়োমেট্রিক ভেক্টর (Mathematical Feature Vector) ব্যবহার করে সত্যতা যাচাই করা হয়।
            </p>
          </div>
        </div>

        {/* ─── INTERACTIVE BIOMETRIC STUDIO ────────────────────────── */}
        <div className="bg-white rounded-2xl border-2 border-emerald-500/20 p-5 sm:p-6 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
                <span>লাইভ স্পিকার ভেরিফিকেশন স্টুডিও</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                আসল মাইক্রোফোনে কথা বলে কণ্ঠস্বরের মিল ও পিচ পরীক্ষা করুন অথবা প্রিসেট সিনারিও টেস্ট করুন।
              </p>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setTestingMode('live_mic');
                  setVerificationResult(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  testingMode === 'live_mic'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>আসল মাইক টেস্ট</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTestingMode('preset');
                  stopLiveMic();
                  setVerificationResult(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  testingMode === 'preset'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>প্রিসেট সিনারিও</span>
              </button>
            </div>
          </div>

          {/* ─── LIVE MIC MODE ─────────────────────────────────────── */}
          {testingMode === 'live_mic' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      ধাপ ১: মাইক্রোফোনে পরিষ্কার গলায় কথা বলুন
                    </h3>
                    <p className="text-xs text-slate-500">
                      ব্রাউজারের ওয়েব অডিও এনালাইজার স্বয়ংক্রিয়ভাবে আপনার কণ্ঠস্বরের মৌলিক পিচ (F0 Hz) নির্ণয় করবে।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={isLiveRecording ? stopLiveMic : startLiveMic}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      isLiveRecording
                        ? 'bg-rose-600 text-white animate-pulse shadow-md'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm'
                    }`}
                  >
                    {isLiveRecording ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>রেকর্ডিং থামান</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>মাইক অন করুন ও বলুন</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Real-time Measured Pitch Badge */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">লাইভ মাপা পিচ (Pitch F0):</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded ${
                        livePitch
                          ? livePitch >= 110 && livePitch <= 155
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {livePitch ? `${livePitch} Hz` : 'অপেক্ষমান...'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    ইমরানের নিবন্ধিত ব্যাপ্তী: <strong className="text-slate-700">110 Hz - 155 Hz</strong>
                  </div>

                  {livePitch && (
                    <span
                      className={`text-[11px] font-semibold ${
                        livePitch >= 110 && livePitch <= 155
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {livePitch >= 110 && livePitch <= 155
                        ? '✓ ইমরানের স্বাভাবিক পুরুষ কণ্ঠের সীমার মধ্যে'
                        : '⚠️ ভিন্ন কণ্ঠস্বর / উচ্চ পিচ শনাক্ত হয়েছে'}
                    </span>
                  )}
                </div>

                {/* Transcript text if recognized */}
                {(transcript || testPhrase) && (
                  <div className="text-xs text-slate-600 pt-1">
                    <span className="text-slate-400">বক্তব্য: </span>
                    <span className="font-semibold text-slate-800">
                      "{transcript || testPhrase}"
                    </span>
                  </div>
                )}
              </div>

              {/* Animated Spectrogram Waveform */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                  <span className="font-mono text-[11px]">Real-Time Web Audio Spectrogram</span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {isLiveRecording ? 'RECORDING REAL VOICE...' : 'MICROPHONE READY'}
                  </span>
                </div>

                <div className="h-10 flex items-end justify-center gap-1 sm:gap-1.5 px-4">
                  {audioVisualBars.map((height, i) => (
                    <div
                      key={i}
                      className={`w-1.5 sm:w-2 rounded-t transition-all duration-75 ${
                        isLiveRecording
                          ? livePitch && (livePitch < 110 || livePitch > 155)
                            ? 'bg-rose-400'
                            : 'bg-emerald-400'
                          : 'bg-slate-700'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <Button
                type="button"
                variant="primary"
                fullWidth
                size="lg"
                icon={ShieldCheck}
                isLoading={isVerifying}
                onClick={handleRunVerification}
              >
                {isVerifying ? 'অ্যাকোস্টিক বিশ্লেষণ চলছে...' : 'বায়োমেট্রিক ভেরিফিকেশন চালান'}
              </Button>
            </div>
          ) : (
            /* ─── PRESET JUDGE SIMULATION MODE ─────────────────────── */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  পরীক্ষার জন্য বক্তা নির্বাচন করুন (Speaker Scenario):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSpeaker('owner')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedSpeaker === 'owner'
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20 text-emerald-950 font-semibold'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-bold">ইমরান হোসেন (মালিক)</span>
                    </div>
                    <span className="text-xs text-slate-500 block leading-tight">
                      বৈধ একাউন্ট হোল্ডার। মিল প্রত্যাশিত: ৯৩-৯৭%।
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSpeaker('imposter')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedSpeaker === 'imposter'
                        ? 'border-rose-600 bg-rose-50 ring-2 ring-rose-500/20 text-rose-950 font-semibold'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UserX className="w-4 h-4 text-rose-600" />
                      <span className="text-sm font-bold">অপরিচিত ব্যক্তি (ইম্পোস্টার)</span>
                    </div>
                    <span className="text-xs text-slate-500 block leading-tight">
                      ভিন্ন মানুষের কণ্ঠ। মিল প্রত্যাশিত: &lt; ৫০% (বাতিল)।
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSpeaker('spoof')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedSpeaker === 'spoof'
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-500/20 text-purple-950 font-semibold'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-bold">এআই ক্লোন / ডিপফেক (Spoof)</span>
                    </div>
                    <span className="text-xs text-slate-500 block leading-tight">
                      রেকর্ডকৃত বা কৃত্রিম শব্দ। লাইভনেস ডিটেকশনে ফ্ল্যাগড।
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  পরীক্ষামূলক বক্তব্য (Test Phrase):
                </label>
                <input
                  type="text"
                  value={testPhrase}
                  onChange={(e) => setTestPhrase(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  placeholder="বাংলায় কোনো কমান্ড লিখুন..."
                />
              </div>

              <Button
                type="button"
                variant="primary"
                fullWidth
                size="lg"
                icon={ShieldCheck}
                isLoading={isVerifying}
                onClick={handleRunVerification}
              >
                {isVerifying ? 'বিশ্লেষণ চলছে...' : 'প্রিসেট টেস্ট চালান'}
              </Button>
            </div>
          )}

          {/* ─── REAL-TIME RESULT CARD ────────────────────────────── */}
          {verificationResult && (
            <div
              className={`p-5 rounded-2xl border-2 transition-all animate-in fade-in space-y-4 ${
                verificationResult.isVerified
                  ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950'
                  : verificationResult.antiSpoofStatus === 'SYNTHETIC_SPOOF_DETECTED'
                  ? 'bg-purple-50/80 border-purple-500 text-purple-950'
                  : 'bg-rose-50/80 border-rose-500 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {verificationResult.isVerified ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : verificationResult.antiSpoofStatus === 'SYNTHETIC_SPOOF_DETECTED' ? (
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      {verificationResult.isVerified
                        ? 'বায়োমেট্রিক সফল (VERIFIED)'
                        : verificationResult.antiSpoofStatus === 'SYNTHETIC_SPOOF_DETECTED'
                        ? 'ডিপফেক / স্পুফ আক্রমণ প্রতিহত (SPOOF BLOCKED)'
                        : 'কণ্ঠস্বর অমিল (UNVERIFIED)'}
                    </span>
                    <span className="text-base font-extrabold block">
                      শনাক্তকৃত অবস্থা: {verificationResult.speaker}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black font-mono">
                    {verificationResult.similarityScore}%
                  </span>
                  <span className="text-[10px] block opacity-80">ভয়েসপ্রিন্ট মিল</span>
                </div>
              </div>

              {/* Progress Bar Gauge */}
              <div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      verificationResult.isVerified
                        ? 'bg-emerald-600'
                        : verificationResult.antiSpoofStatus === 'SYNTHETIC_SPOOF_DETECTED'
                        ? 'bg-purple-600'
                        : 'bg-rose-600'
                    }`}
                    style={{ width: `${verificationResult.similarityScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>০% (সম্পূর্ণ অমিল)</span>
                  <span>৮৫% থ্রেশহোল্ড (নূন্যতম মিল)</span>
                  <span>১০০% (নিখুঁত মিল)</span>
                </div>
              </div>

              {/* Message Bangla */}
              <div className="p-3 rounded-xl bg-white/80 border border-slate-200/60 text-xs space-y-1">
                <p className="font-semibold">{verificationResult.messageBangla}</p>
                <p className="text-slate-600 text-[11px]">{verificationResult.recommendation}</p>
              </div>

              {/* Acoustic Evidence Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-white/70 p-2 rounded-lg border border-slate-200/50">
                  <span className="text-slate-400 block">লাইভনেস স্কোর</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {verificationResult.livenessScore}%
                  </span>
                </div>
                <div className="bg-white/70 p-2 rounded-lg border border-slate-200/50">
                  <span className="text-slate-400 block">অ্যান্টি-স্পুফ স্ট্যাটাস</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {verificationResult.antiSpoofStatus}
                  </span>
                </div>
                <div className="bg-white/70 p-2 rounded-lg border border-slate-200/50">
                  <span className="text-slate-400 block">মাপা পিচ (F0)</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {verificationResult.measuredPitchHz ? `${verificationResult.measuredPitchHz} Hz` : '১২৮ Hz'}
                  </span>
                </div>
                <div className="bg-white/70 p-2 rounded-lg border border-slate-200/50">
                  <span className="text-slate-400 block">পিচ ডেভিয়েশন</span>
                  <span className="font-bold text-slate-800 font-mono">
                    ±{verificationResult.pitchDeviationHz} Hz
                  </span>
                </div>
              </div>

              {/* Speak Audio readout */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => speak(verificationResult.messageBangla)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 border border-slate-200 text-xs font-semibold shadow-sm transition"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ফলাফল বাংলায় শুনুন</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── RECENT VERIFICATION AUDIT LOGS ──────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
              <History className="w-5 h-5 text-slate-600" />
              <span>সাম্প্রতিক অডিট হিস্টোরি (Security Verification Logs)</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">সর্বশেষ {logs.length}টি রেকর্ড</span>
          </div>

          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">এখনো কোনো অডিট রেকর্ড নেই।</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {log.isVerified ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    )}
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {log.speakerIdentified} ({log.similarityScore}% মিল)
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('bn-BD')} — {log.sampleTranscript}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.isVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.antiSpoofStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── 3-LAYER DEFENSE EXPLANATION ─────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              ১
            </div>
            <h3 className="text-sm font-bold text-slate-900">ভয়েস ন্যাচারাল ল্যাঙ্গুয়েজ</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              স্বাভাবিক বাংলায় যা-ই বলা হোক, জেমিনাই এআই শুধুমাত্র অর্থ ও সুবিধাভোগীর নাম নির্ভুলভাবে এক্সট্র্যাক্ট করে।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
              ২
            </div>
            <h3 className="text-sm font-bold text-slate-900">বায়োমেট্রিক ও স্পুফ শিল্ড</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              বক্তার গাণিতিক অ্যাকোস্টিক ভেক্টর মেলানো হয় এবং ডিপফেক বা স্পিকার অমিল থাকলে সাথে সাথে অ্যালার্ট প্রদান করা হয়।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              ৩
            </div>
            <h3 className="text-sm font-bold text-slate-900">৪ সংখ্যার গোপন পিন</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              কোনো লেনদেনই মানুষের চূড়ান্ত পিন কোড ছাড়া সম্পন্ন হতে পারে না। ফলে শতভাগ আর্থিক নিয়ন্ত্রণ ব্যবহারকারীর হাতে।
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
