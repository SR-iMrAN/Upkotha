import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Play, RotateCcw, Square, Sparkles } from 'lucide-react';
import useVoiceAssistant from '../hooks/useVoiceAssistant';

/**
 * VoiceGuide Component:
 * Provides contextual spoken and visual assistance per page.
 * Controlled by user: Listen, Replay, Pause, and Mute.
 */
export default function VoiceGuide({
  pageContext = 'dashboard',
  message,
  autoPlay = false,
  className = '',
}) {
  const { speak, stopSpeaking, isSpeaking, isMuted, toggleMute } = useVoiceAssistant(pageContext);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);

  // Auto-play once on page mount only if requested and unmuted
  useEffect(() => {
    if (autoPlay && message && !isMuted && !hasPlayedOnce) {
      const timer = setTimeout(() => {
        speak(message);
        setHasPlayedOnce(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, message, isMuted, hasPlayedOnce, speak]);

  const handlePlay = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(message);
    }
  };

  const handleReplay = () => {
    stopSpeaking();
    setTimeout(() => speak(message), 100);
  };

  return (
    <div
      className={`rounded-2xl border transition-all shadow-xs p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isSpeaking
          ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-200'
          : 'bg-emerald-50/50 border-emerald-200/80'
      } ${className}`}
    >
      {/* Left: Speaker icon & Message */}
      <div className="flex items-start gap-3">
        <div
          className={`p-2.5 rounded-xl shrink-0 transition-colors ${
            isSpeaking
              ? 'bg-emerald-600 text-white shadow-xs animate-pulse'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-semibold text-emerald-900 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              উপকথা ভয়েস গাইড (Voice Guide)
            </span>
            {isSpeaking && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                কথা বলছে...
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-emerald-950 font-normal leading-relaxed">
            "{message}"
          </p>
        </div>
      </div>

      {/* Right: Audio Controls */}
      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-200/50 w-full sm:w-auto justify-end">
        {/* Listen / Pause Button */}
        <button
          type="button"
          onClick={handlePlay}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
            isSpeaking
              ? 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800'
              : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
          }`}
          title={isSpeaking ? 'থামুন' : 'শুনুন'}
        >
          {isSpeaking ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              <span>থামুন</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>শুনুন</span>
            </>
          )}
        </button>

        {/* Replay Button */}
        <button
          type="button"
          onClick={handleReplay}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
          title="পুনরায় শুনুন"
        >
          <RotateCcw className="w-3 h-3 text-slate-500" />
          <span className="hidden md:inline">আবার</span>
        </button>

        {/* Mute / Unmute Button */}
        <button
          type="button"
          onClick={toggleMute}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
            isMuted
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title={isMuted ? 'আনমিউট করুন' : 'মিউট করুন'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-amber-700" />
              <span>আনমিউট</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-slate-500" />
              <span>মিউট</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
