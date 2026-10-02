import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { showToast, showAlert } from '../utils/alert';
import api from '../services/api';

const VoiceContext = createContext(null);

const STORAGE_MUTE_KEY = 'upkotha_voice_muted';

export function VoiceProvider({ children }) {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [pageContext, setPageContext] = useState('dashboard');
  const [lastIntentResult, setLastIntentResult] = useState(null);

  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_MUTE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  // Initialize SpeechRecognition once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[VOICE] Browser does not support SpeechRecognition');
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'bn-BD'; // Primary: Bangla (Bangladesh)
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognition.onerror = (event) => {
        console.warn('[VOICE ERROR]', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('মাইক্রোফোন ব্যবহারের অনুমতি পাওয়া যায়নি। ব্রাউজারের পারমিশন চেক করুন।');
          showToast.warning('মাইক্রোফোন অ্যাক্সেস ব্লক রয়েছে');
        } else if (event.error === 'no-speech') {
          setError('কোনো বক্তব্য শোনা যায়নি। আবার চেষ্টা করুন।');
        } else {
          setError(`ভয়েস ত্রুটি: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error('[VOICE INIT ERROR]', err);
      setIsSupported(false);
    }
  }, []);

  // Text to Speech (SpeechSynthesis)
  const speak = useCallback((text, options = {}) => {
    if (isMuted || !synthRef.current || !text) return;

    try {
      // Cancel any ongoing speech
      synthRef.current.cancel();

      const cleanText = text.replace(/<[^>]*>/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);

      utterance.lang = 'bn-BD';
      utterance.rate = options.rate || 0.95; // Slightly slower for clear Bangla articulation
      utterance.pitch = options.pitch || 1.0;

      // Select Bangla voice if available in the OS/Browser
      const voices = synthRef.current.getVoices();
      const banglaVoice = voices.find(v => v.lang === 'bn-BD' || v.lang === 'bn_BD' || v.lang.startsWith('bn'));
      if (banglaVoice) {
        utterance.voice = banglaVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (options.onEnd) options.onEnd();
      };
      utterance.onerror = (e) => {
        console.warn('[TTS ERROR]', e);
        setIsSpeaking(false);
      };

      synthRef.current.speak(utterance);
    } catch (err) {
      console.error('[SPEECH ERROR]', err);
      setIsSpeaking(false);
    }
  }, [isMuted]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_MUTE_KEY, String(next));
      if (next && synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      showToast.info(next ? 'ভয়েস গাইড মিউট করা হয়েছে' : 'ভয়েস গাইড আনমিউট করা হয়েছে');
      return next;
    });
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      showToast.warning('আপনার ব্রাউজারে স্পিচ রিকগনিশন সমর্থিত নয়');
      return;
    }

    // Stop TTS if speaking so mic doesn't catch own voice
    stopSpeaking();
    setTranscript('');
    setError(null);

    try {
      recognitionRef.current.start();
    } catch (err) {
      // May throw if already active
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 150);
      } catch (e) {
        console.warn('Recognition restart failed', e);
      }
    }
  }, [stopSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignored
      }
    }
    setIsListening(false);
  }, []);

  // Process natural language command through backend AI intent
  const executeCommand = useCallback(async (spokenText, onIntentResolved) => {
    if (!spokenText || !spokenText.trim()) return null;

    try {
      setIsProcessing(true);
      const res = await api.extractIntent(spokenText.trim(), pageContext);
      setLastIntentResult(res);

      // Play back contextual response if voice guide is unmuted
      if (res.replyTextBangla && !isMuted) {
        speak(res.replyTextBangla);
      }

      if (onIntentResolved) {
        onIntentResolved(res);
      }

      return res;
    } catch (err) {
      console.error('[AI INTENT ERROR]', err);
      showToast.error('ভয়েস কমান্ড বুঝতে সমস্যা হয়েছে');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [pageContext, isMuted, speak]);

  return (
    <VoiceContext.Provider
      value={{
        isSupported,
        isListening,
        isProcessing,
        isSpeaking,
        isMuted,
        transcript,
        error,
        pageContext,
        lastIntentResult,
        setPageContext,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        toggleMute,
        executeCommand,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
