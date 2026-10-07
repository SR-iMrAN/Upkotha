import React, { useState } from 'react';
import { CheckCircle2, Send, Star } from 'lucide-react';
import api from '../services/api';
import { showToast } from '../utils/alert';

export default function CustomerFeedback({
  task,
  sessionId,
  durationMs,
  source = 'unknown',
  onSubmitted,
}) {
  const [confidence, setConfidence] = useState(0);
  const [easeRating, setEaseRating] = useState(0);
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = async () => {
    if (!confidence || !easeRating || !satisfactionRating) {
      showToast.error('অনুগ্রহ করে তিনটি প্রশ্নের উত্তর দিন।');
      return;
    }

    try {
      setIsSubmitting(true);

      await api.recordImpactEvent({
        eventType: 'task_feedback',
        task,
        sessionId,
        durationMs,
        confidence,
        easeRating,
        satisfactionRating,
        source,
      });

      setSubmitted(true);

      showToast.success(
        'আপনার মতামত সংরক্ষণ করা হয়েছে। ধন্যবাদ!'
      );

      if (onSubmitted) {
        onSubmitted();
      }
    } catch (error) {
      showToast.error(
        error.message || 'মতামত সংরক্ষণ করা যায়নি।'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center gap-2 text-emerald-800 font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>আপনার মতামত গ্রহণ করা হয়েছে</span>
        </div>

        <p className="text-sm text-emerald-700 mt-2">
          এই feedback ব্যবহার করে আমরা উপকথার customer experience
          আরও উন্নত করব।
        </p>
      </div>
    );
  }

  const RatingButtons = ({ value, onChange }) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          aria-label={`${rating} out of 5`}
          className={`w-9 h-9 rounded-lg border flex items-center justify-center transition ${
            value >= rating
              ? 'bg-emerald-700 text-white border-emerald-700'
              : 'bg-white text-slate-400 border-slate-300 hover:border-emerald-500'
          }`}
        >
          <Star
            className="w-4 h-4"
            fill={value >= rating ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      <div>
        <h3 className="font-bold text-slate-900">
          আপনার অভিজ্ঞতা কেমন ছিল?
        </h3>

        <p className="text-xs text-slate-500 mt-1">
          এই ছোট feedback আমাদের customer impact পরিমাপ করতে সাহায্য করবে।
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">
          ১. কাজটি সম্পন্ন করার পর আপনি কতটা confident?
        </p>

        <RatingButtons
          value={confidence}
          onChange={setConfidence}
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">
          ২. কাজটি কতটা সহজ মনে হয়েছে?
        </p>

        <RatingButtons
          value={easeRating}
          onChange={setEaseRating}
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">
          ৩. আপনার overall satisfaction কত?
        </p>

        <RatingButtons
          value={satisfactionRating}
          onChange={setSatisfactionRating}
        />
      </div>

      <button
        type="button"
        onClick={submitFeedback}
        disabled={isSubmitting}
        className="w-full rounded-xl bg-emerald-700 text-white py-3 px-4 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-800 disabled:opacity-60"
      >
        <Send className="w-4 h-4" />

        {isSubmitting
          ? 'সংরক্ষণ হচ্ছে...'
          : 'Feedback জমা দিন'}
      </button>
    </div>
  );
}