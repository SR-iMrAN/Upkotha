import React from 'react';
import { MicOff, ShieldAlert, X, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import Button from './Button';

/**
 * MicPermissionModal: Plain-Bangla illustrated guide to recover from microphone permission blocks.
 */
export default function MicPermissionModal({ isOpen, onClose, onRetry }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <MicOff className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 block">
            মাইক্রোফোন অনুমতি নির্দেশিকা
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 mt-1">
            মাইক্রোফোন ব্যবহারের অনুমতি দিন
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            ব্রাউজারে মাইক্রোফোন অ্যাক্সেস বন্ধ থাকায় উপকথা আপনার কণ্ঠ শুনতে পারছে না। নিচের ৩টি সহজ ধাপে অনুমতি সক্রিয় করুন:
          </p>
        </div>

        {/* Step by Step illustrated instructions */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
              ১
            </div>
            <div>
              <p className="font-bold text-slate-800">ব্রাউজারের অ্যাড্রেস বারে যান</p>
              <p className="text-slate-500 text-[11px]">
                উপরের অ্যাড্রেস বারের বাম পাশে থাকা তালা (🔒) বা মাইক আইকনে ক্লিক করুন।
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
              ২
            </div>
            <div>
              <p className="font-bold text-slate-800">"Microphone" অনুমতি Allow করুন</p>
              <p className="text-slate-500 text-[11px]">
                মাইক্রোফোন অপশনটির পাশে <strong className="text-emerald-700">"Allow" (অনুমতি দিন)</strong> নির্বাচন করুন।
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
              ৩
            </div>
            <div>
              <p className="font-bold text-slate-800">পেজ রিফ্রেশ করুন</p>
              <p className="text-slate-500 text-[11px]">
                নিচের বাটনে চাপ দিয়ে পেজটি রিফ্রেশ করুন এবং কথা বলুন।
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onClose}
          >
            বন্ধ করুন
          </Button>
          <Button
            type="button"
            variant="primary"
            fullWidth
            icon={RefreshCw}
            onClick={() => {
              if (onRetry) onRetry();
              window.location.reload();
            }}
          >
            অনুমতি পেয়েছি / রিফ্রেশ
          </Button>
        </div>
      </div>
    </div>
  );
}
