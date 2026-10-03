import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Volume2,
  X,
  RefreshCw,
  Info,
} from 'lucide-react';
import Button from './Button';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { showToast } from '../utils/alert';

/**
 * Autocorrelation pitch detection algorithm for Web Audio API.
 * Computes fundamental frequency (F0 in Hz) from raw audio buffer.
 */
function detectPitch(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.015) return null; // Silence

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

export default function VoiceEnrollModal({ isOpen, onClose, onEnrolled }) {
  const { user, updateVoiceProfile } = useAuth();
  const { speak } = useVoice();

  const [isRecording, setIsRecording] = useState(false);
  const [detectedPitch, setDetectedPitch] = useState(145);
  const [minRange, setMinRange] = useState(120);
  const [maxRange, setMaxRange] = useState(180);
  const [audioBars, setAudioBars] = useState(new Array(16).fill(15));
  const [isSaving, setIsSaving] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);

  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const stopRecording = React.useCallback(() => {
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
    setIsRecording(false);
    setHasRecorded(true);
    setAudioBars(new Array(16).fill(15));
  }, []);

  // Stop recording on unmount or when modal closes
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
    }
  }, [isOpen, stopRecording]);

  const startRecording = async () => {
    try {
      setHasRecorded(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsRecording(true);

      const buffer = new Float32Array(analyser.fftSize);
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const samples = [];

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);
        analyserRef.current.getByteFrequencyData(freqData);

        // Visualizer
        const step = Math.floor(freqData.length / 16);
        const bars = [];
        for (let i = 0; i < 16; i++) {
          bars.push(Math.max(15, Math.min(100, ((freqData[i * step] || 10) / 255) * 100)));
        }
        setAudioBars(bars);

        const p = detectPitch(buffer, audioCtx.sampleRate);
        if (p && p >= 80 && p <= 350) {
          samples.push(p);
          if (samples.length > 25) samples.shift();
          const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
          const rounded = Math.round(avg);
          setDetectedPitch(rounded);
          // Auto-adjust default forgiving range around detected pitch (e.g. 120 - 180)
          setMinRange(Math.max(80, Math.min(140, rounded - 25)));
          setMaxRange(Math.max(160, rounded + 35));
        }

        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
      showToast.info('মাইক্রোফোন সক্রিয়: কথা বলুন (যেমন: "আমার ব্যালেন্স কত")');
    } catch (err) {
      console.warn('Mic access failed:', err);
      // Fallback preset
      setDetectedPitch(145);
      setMinRange(120);
      setMaxRange(180);
      setHasRecorded(true);
      showToast.warning('মাইক্রোফোন সরাসরি সক্রিয় হয়নি; ডিফল্ট রেঞ্জ (১২০ - ১৮০ Hz) নির্ধারণ করা হয়েছে।');
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      stopRecording();

      const res = await api.enrollVoice({
        pitchHz: detectedPitch,
        minHz: minRange,
        maxHz: maxRange,
        phrase: 'আমার ব্যালেন্স কত',
      });

      if (res.success && res.profile) {
        updateVoiceProfile(res.profile);
        showToast.success('ভয়েস বায়োমেট্রিক সফলভাবে সংরক্ষিত হয়েছে!');
        speak(`আপনার ভয়েস বায়োমেট্রিক সফলভাবে সংরক্ষিত হয়েছে। অনুমোদিত পিচ ব্যাপ্তী ${minRange} থেকে ${maxRange} হার্টজ।`);
        if (onEnrolled) onEnrolled(res.profile);
        onClose();
      }
    } catch (err) {
      showToast.error('ভয়েস সংরক্ষণ করতে সমস্যা হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>ভয়েস বায়োমেট্রিক রেজিস্ট্রেশন</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            কণ্ঠস্বর ও পিচ ব্যাপ্তী সংরক্ষণ করুন
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            অ্যাকাউন্ট: <strong className="text-emerald-300">{user?.name || 'নতুন ব্যবহারকারী'}</strong> ({user?.phone})
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-3 text-xs text-emerald-950">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              আপনার অ্যাকাউন্টে ভয়েস কমান্ড ব্যবহারের পূর্বে আপনার গলার পিচ ও অনুমোদিত ফ্রিকোয়েন্সি ব্যাপ্তী (যেমন <strong>১২০ - ১৮০ Hz</strong>) সেভ করুন, যাতে শুধু আপনার কণ্ঠেই কমান্ড কার্যকর হয়।
            </p>
          </div>

          {/* Live Mic Recorder / Visualizer */}
          <div className="text-center py-2 space-y-3">
            <div className="flex justify-center items-center gap-1 h-12">
              {audioBars.map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-emerald-600 transition-all duration-75"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>

            <div>
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg animate-pulse"
                >
                  <MicOff className="w-4 h-4" />
                  <span>রেকর্ডিং সম্পন্ন করুন</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
                >
                  <Mic className="w-4 h-4" />
                  <span>{hasRecorded ? 'পুনরায় রেকর্ড করুন' : 'মাইকে কথা বলুন (রেকর্ড)'}</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              {isRecording ? 'স্বাভাবিক গলায় কথা বলুন... পিচ পরিমাপ করা হচ্ছে' : 'মাইকে ক্লিক করে "আমার ব্যালেন্স কত" বলুন'}
            </p>
          </div>

          {/* Measured Pitch Card */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">শনাক্তকৃত কেন্দ্র পিচ (F0):</span>
              <span className="text-base font-extrabold text-emerald-800 font-mono mt-0.5 block">
                ~{detectedPitch} Hz
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">অনুমোদিত ব্যাপ্তী:</span>
              <span className="text-base font-extrabold text-slate-800 font-mono mt-0.5 block">
                {minRange} - {maxRange} Hz
              </span>
            </div>
          </div>

          {/* Customization Sliders */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                ফ্রিকোয়েন্সি রেঞ্জ কাস্টমাইজেশন (Tolerant Range)
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>সর্বনিম্ন ফ্রিকোয়েন্সি (Min Pitch):</span>
                <span className="font-mono font-bold text-emerald-700">{minRange} Hz</span>
              </div>
              <input
                type="range"
                min="80"
                max="150"
                value={minRange}
                onChange={(e) => setMinRange(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>সর্বোচ্চ ফ্রিকোয়েন্সি (Max Pitch):</span>
                <span className="font-mono font-bold text-emerald-700">{maxRange} Hz</span>
              </div>
              <input
                type="range"
                min="160"
                max="260"
                value={maxRange}
                onChange={(e) => setMaxRange(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setMinRange(120);
                  setMaxRange(180);
                  setDetectedPitch(145);
                }}
                className="text-[10px] text-emerald-700 hover:underline font-semibold"
              >
                প্রস্তাবিত রেঞ্জ রিসেট (১২০ - ১৮০ Hz)
              </button>
              <span className="text-[10px] text-slate-400">প্রশস্ত ও নির্ভুল</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium px-3 py-2"
          >
            পরে করব
          </button>
          <Button
            variant="primary"
            size="md"
            isLoading={isSaving}
            onClick={handleSaveProfile}
            className="bg-emerald-700 hover:bg-emerald-800 shadow-md text-xs"
          >
            ভয়েসপ্রিন্ট সংরক্ষণ করুন
          </Button>
        </div>
      </div>
    </div>
  );
}
