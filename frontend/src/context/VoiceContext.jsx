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
  const [hasNativeBanglaVoice, setHasNativeBanglaVoice] = useState(false);

  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_MUTE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const audioPlayerRef = useRef(null);
  const restartTimerRef = useRef(null);

  // Initialize and detect voices
  useEffect(() => {
    if (!synthRef.current) return;

    const checkVoices = () => {
      const voices = synthRef.current.getVoices();
      const bangla = voices.find(v =>
        v.lang === 'bn-BD' ||
        v.lang === 'bn_BD' ||
        v.lang === 'bn-IN' ||
        v.lang.startsWith('bn') ||
        v.name.toLowerCase().includes('bangla') ||
        v.name.toLowerCase().includes('bengali')
      );
      setHasNativeBanglaVoice(Boolean(bangla));
    };

    checkVoices();
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = checkVoices;
    }
  }, []);

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
      recognition.continuous = false; // Turn-based input
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
        if (event.error === 'not-allowed') {
          setError('মাইক্রোফোন ব্যবহারের অনুমতি নেই। ব্রাউজারের অ্যাড্রেস বারে মাইক আইকনে ক্লিক করে অনুমতি দিন।');
          showToast.warning('মাইক্রোফোন অ্যাক্সেস ব্লক রয়েছে');
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Keep state clean and notify gently without breaking
          setError('কোনো বক্তব্য শোনা যায়নি। আবার চেষ্টা করুন।');
          setIsListening(false);
        } else {
          setError(`ভয়েস ত্রুটি: ${event.error}`);
          setIsListening(false);
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

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // Natural Bangla Speech Engine with Online TTS Fallback
  const speak = useCallback((text, options = {}) => {
    if (isMuted || !text) return;

    // Clean HTML tags and excessive spaces
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) return;

    stopSpeaking();

    // 1. Check if browser has a native Bangla voice
    const voices = synthRef.current ? synthRef.current.getVoices() : [];
    const banglaVoice = voices.find(v =>
      v.lang === 'bn-BD' ||
      v.lang === 'bn_BD' ||
      v.lang === 'bn-IN' ||
      v.lang.startsWith('bn') ||
      v.name.toLowerCase().includes('bangla') ||
      v.name.toLowerCase().includes('bengali')
    );

    // If native Bangla voice is installed in browser, use SpeechSynthesis
    if (banglaVoice && synthRef.current) {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.voice = banglaVoice;
        utterance.lang = 'bn-BD';
        utterance.rate = options.rate || 0.95;
        utterance.pitch = options.pitch || 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          if (options.onEnd) options.onEnd();
        };
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
        return;
      } catch (err) {
        console.warn('SpeechSynthesis failed, falling back to audio stream', err);
      }
    }

    // 2. Fallback: High-Quality Natural Bangla Cloud Audio Stream
    // Prevents English TTS from skipping Bangla words and only saying English words!
    try {
      setIsSpeaking(true);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=bn&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        audioPlayerRef.current = null;
        if (options.onEnd) options.onEnd();
      };

      audio.onerror = (e) => {
        console.warn('[AUDIO FALLBACK ERROR]', e);
        setIsSpeaking(false);
        audioPlayerRef.current = null;
      };

      audio.play().catch(playErr => {
        console.warn('[AUDIO AUTOPLAY BLOCKED]', playErr);
        setIsSpeaking(false);
      });
    } catch (err) {
      console.error('[TTS FALLBACK ERROR]', err);
      setIsSpeaking(false);
    }
  }, [isMuted, stopSpeaking]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_MUTE_KEY, String(next));
      if (next) {
        stopSpeaking();
      }
      showToast.info(next ? 'ভয়েস গাইড মিউট করা হয়েছে' : 'ভয়েস গাইড আনমিউট করা হয়েছে');
      return next;
    });
  }, [stopSpeaking]);

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
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.warn('Recognition start retry failed', e);
          }
        }, 200);
      } catch (e) {
        console.warn('Recognition stop/start cycle failed', e);
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
        hasNativeBanglaVoice,
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
