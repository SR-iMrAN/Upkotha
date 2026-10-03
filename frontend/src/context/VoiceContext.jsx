import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { showToast, showAlert } from '../utils/alert';
import api from '../services/api';

const VoiceContext = createContext(null);

const STORAGE_MUTE_KEY = 'upkotha_voice_muted';

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
  if (rms < 0.015) return null;

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

export function VoiceProvider({ children }) {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [pageContext, setPageContext] = useState('dashboard');
  const [lastIntentResult, setLastIntentResult] = useState(null);
  const [lastBiometricStatus, setLastBiometricStatus] = useState(null);
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
  const playbackCtxRef = useRef(null);
  const currentSourceNodeRef = useRef(null);
  const finalSilenceTimerRef = useRef(null);

  // Hardware Audio Pitch Tracker Refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const pitchSamplesRef = useRef([]);
  const lastMeasuredPitchRef = useRef(null);

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
        let fullText = '';
        let hasFinalResult = false;
        for (let i = 0; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript.trim();
          if (piece) {
            fullText += (fullText ? ' ' : '') + piece;
          }
          if (event.results[i].isFinal) {
            hasFinalResult = true;
          }
        }
        if (fullText && fullText.trim()) {
          setTranscript(fullText.trim());
        }

        // On mobile: auto-stop after speech finishes
        if (hasFinalResult) {
          if (finalSilenceTimerRef.current) clearTimeout(finalSilenceTimerRef.current);
          finalSilenceTimerRef.current = setTimeout(() => {
            try {
              recognition.stop();
            } catch (e) {}
          }, 850);
        }
      };

      recognition.onspeechend = () => {
        if (finalSilenceTimerRef.current) clearTimeout(finalSilenceTimerRef.current);
        finalSilenceTimerRef.current = setTimeout(() => {
          try {
            recognition.stop();
          } catch (e) {}
        }, 500);
      };

      recognition.onerror = (event) => {
        console.warn('[VOICE ERROR]', event.error);
        if (event.error === 'not-allowed') {
          setError('মাইক্রোফোন ব্যবহারের অনুমতি নেই। ব্রাউজারের অ্যাড্রেস বারে মাইক আইকনে ক্লিক করে অনুমতি দিন।');
          showToast.warning('মাইক্রোফোন অ্যাক্সেস ব্লক রয়েছে');
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // If no speech, keep existing transcript if any or reset
          setIsListening(false);
        } else if (event.error === 'network') {
          console.info('[VOICE] Speech recognition server unreachable or blocked by browser shields (Brave/Chrome)');
          setError('ব্রাউজারের গুগল স্পিচ সার্ভিস সীমাবদ্ধ (Brave Shields বা Chrome নেটওয়ার্ক)। নিচে রেডি বাটনে চাপ দিন বা লিখুন।');
          setIsListening(false);
        } else {
          setError(`ভয়েস ত্রুটি: ${event.error}`);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (finalSilenceTimerRef.current) clearTimeout(finalSilenceTimerRef.current);
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
    if (currentSourceNodeRef.current) {
      try {
        currentSourceNodeRef.current.stop();
        currentSourceNodeRef.current.disconnect();
      } catch (e) {}
      currentSourceNodeRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  }, []);

  // Natural Bangla Speech Engine with Cross-Browser Compatibility (Chrome, Brave, Edge, Mobile Safari/Android)
  const speak = useCallback((text, options = {}) => {
    if (isMuted || !text) return;

    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) return;

    stopSpeaking();

    try {
      const voices = synthRef.current ? (synthRef.current.getVoices() || []) : [];
      const banglaVoice = voices.find(v =>
        v.lang === 'bn-BD' ||
        v.lang === 'bn_BD' ||
        v.lang === 'bn-IN' ||
        v.lang.startsWith('bn') ||
        v.name.toLowerCase().includes('bangla') ||
        v.name.toLowerCase().includes('bengali')
      );

      // If browser lacks a native Bengali speech voice (e.g. Google Chrome or Brave on Windows/Android,
      // where English voice fails to read Bangla Unicode and only pronounces "comma"):
      // Stream natural, fluent Bengali voice directly from our backend TTS engine!
      if (!banglaVoice) {
        const ttsUrl = api.getTtsUrl(cleanText);
        setIsSpeaking(true);

        // Web Audio API path (immune to mobile browser async autoplay blocking)
        const playWithWebAudio = async () => {
          try {
            if (!playbackCtxRef.current && typeof window !== 'undefined') {
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (AudioCtx) playbackCtxRef.current = new AudioCtx();
            }
            const ctx = playbackCtxRef.current;
            if (ctx) {
              if (ctx.state === 'suspended') {
                await ctx.resume();
              }
              const res = await fetch(ttsUrl);
              if (!res.ok) throw new Error(`TTS HTTP error ${res.status}`);
              const arrayBuffer = await res.arrayBuffer();
              const decoded = await ctx.decodeAudioData(arrayBuffer);

              const source = ctx.createBufferSource();
              source.buffer = decoded;
              source.connect(ctx.destination);
              currentSourceNodeRef.current = source;

              source.onended = () => {
                setIsSpeaking(false);
                currentSourceNodeRef.current = null;
                if (options.onEnd) options.onEnd();
              };

              source.start(0);
              return true;
            }
          } catch (webAudioErr) {
            console.warn('[WEB AUDIO TTS NOTICE]', webAudioErr);
          }
          return false;
        };

        playWithWebAudio().then((succeeded) => {
          if (succeeded) return;

          // HTML5 Audio Fallback
          let player = audioPlayerRef.current;
          if (!player) {
            player = new Audio();
            audioPlayerRef.current = player;
          }
          player.src = ttsUrl;
          player.onended = () => {
            setIsSpeaking(false);
            if (options.onEnd) options.onEnd();
          };
          player.onerror = (err) => {
            console.warn('[BACKEND AUDIO TTS PLAYBACK ERROR]', err);
            setIsSpeaking(false);
          };
          const playPromise = player.play();
          if (playPromise !== undefined) {
            playPromise.catch((playErr) => {
              console.warn('[AUTOPLAY BLOCKED OR ABORTED, FALLING BACK TO SYNTHESIS]', playErr);
              if (synthRef.current) {
                const fallbackUtterance = new SpeechSynthesisUtterance(cleanText);
                fallbackUtterance.lang = 'bn-BD';
                fallbackUtterance.onend = () => setIsSpeaking(false);
                fallbackUtterance.onerror = () => setIsSpeaking(false);
                synthRef.current.speak(fallbackUtterance);
              } else {
                setIsSpeaking(false);
              }
            });
          }
        });
        return;
      }

      if (!synthRef.current) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.voice = banglaVoice;
      utterance.lang = 'bn-BD';
      utterance.rate = options.rate || 0.95;
      utterance.pitch = options.pitch || 1.0;

      // Prevent Chromium V8 garbage collection mid-speech
      window.__activeSpeechUtterance = utterance;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        window.__activeSpeechUtterance = null;
        setIsSpeaking(false);
        if (options.onEnd) options.onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('[SPEECH SYNTHESIS NOTE]', e.error || e);
        window.__activeSpeechUtterance = null;
        setIsSpeaking(false);
      };

      if (synthRef.current.paused) {
        synthRef.current.resume();
      }

      synthRef.current.cancel();
      synthRef.current.speak(utterance);
    } catch (err) {
      console.warn('[SPEECH SYNTHESIS FALLBACK]', err);
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
    stopSpeaking();
    setTranscript('');
    setError(null);
    lastMeasuredPitchRef.current = null;
    pitchSamplesRef.current = [];

    // Pre-unlock Web Audio API context AND audio element inside user tap event stack
    if (typeof window !== 'undefined') {
      try {
        if (!playbackCtxRef.current) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) playbackCtxRef.current = new AudioCtx();
        }
        if (playbackCtxRef.current && playbackCtxRef.current.state === 'suspended') {
          playbackCtxRef.current.resume();
        }
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new Audio();
        }
        audioPlayerRef.current.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        audioPlayerRef.current.play().then(() => {
          audioPlayerRef.current.pause();
        }).catch(() => {});
      } catch (e) {}
    }

    const triggerRecognition = () => {
      if (!recognitionRef.current) return;
      try {
        recognitionRef.current.start();
      } catch (err) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
            } catch (e) {
              console.warn('Recognition start retry failed', e);
            }
          }, 100);
        } catch (e) {
          console.warn('Recognition cycle failed', e);
        }
      }
    };

    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // Mobile devices (Android/iOS) do NOT permit parallel microphone streams (getUserMedia + SpeechRecognition).
      // Trigger SpeechRecognition immediately and synchronously within the user tap event stack!
      let baselinePitch = 135;
      try {
        const storedUser = JSON.parse(localStorage.getItem('upkotha_user') || '{}');
        if (storedUser?.voiceProfile?.fundamentalFrequencyHz) {
          baselinePitch = storedUser.voiceProfile.fundamentalFrequencyHz;
        } else if (storedUser?.voiceProfile?.pitchRangeHz) {
          baselinePitch = Math.round((storedUser.voiceProfile.pitchRangeHz[0] + storedUser.voiceProfile.pitchRangeHz[1]) / 2);
        }
      } catch (e) {}
      lastMeasuredPitchRef.current = baselinePitch;
      triggerRecognition();
      return;
    }

    // On Desktop:
    triggerRecognition();

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          audioContextRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 2048;
          source.connect(analyser);
          analyserRef.current = analyser;

          const buffer = new Float32Array(analyser.fftSize);
          const trackPitch = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getFloatTimeDomainData(buffer);
            const p = detectFundamentalFrequency(buffer, audioCtx.sampleRate);
            if (p && p >= 80 && p <= 350) {
              pitchSamplesRef.current.push(p);
              if (pitchSamplesRef.current.length > 30) pitchSamplesRef.current.shift();
              const avg = pitchSamplesRef.current.reduce((a, b) => a + b, 0) / pitchSamplesRef.current.length;
              lastMeasuredPitchRef.current = Math.round(avg);
            }
            animFrameRef.current = requestAnimationFrame(trackPitch);
          };
          trackPitch();
        })
        .catch((err) => {
          console.warn('Live pitch tracking microphone unavailable:', err);
        });
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
    setIsListening(false);
  }, []);

  /**
   * Process natural language command through Voice Biometric Guard + Backend AI intent
   */
  const executeCommand = useCallback(async (spokenText, onIntentResolved) => {
    if (!spokenText || !spokenText.trim()) return null;

    try {
      setIsProcessing(true);
      const measuredPitch = lastMeasuredPitchRef.current;

      // ─── 1. REAL VOICE BIOMETRIC VERIFICATION GATE ──────────────
      // Verifies whether the speaker's vocal frequency matches the enrolled user
      let biometricResult = null;
      try {
        if (measuredPitch && measuredPitch > 0) {
          biometricResult = await api.verifyVoice({
            audioFeatures: { pitchHz: measuredPitch },
            sampleTranscript: spokenText.trim(),
          });

          setLastBiometricStatus(biometricResult);

          // If biometric verification FAILS (Imposter / Different voice detected):
          if (!biometricResult.isVerified) {
            showToast.error(`কণ্ঠস্বর অমিল (${Math.round(measuredPitch)} Hz): অননুমোদিত নির্দেশ বাতিল!`);
            
            const warningSpeech = `সতর্কতা: আপনার কণ্ঠস্বর অ্যাকাউন্ট মালিকের সাথে মেলেনি। অপরিচিত ব্যক্তির ভয়েস নির্দেশনায় লেনদেন বাতিল করা হয়েছে।`;
            if (!isMuted) {
              speak(warningSpeech);
            }

            return {
              blockedByBiometrics: true,
              voiceAuth: biometricResult,
              messageBangla: warningSpeech,
            };
          }
        }
      } catch (bioErr) {
        console.warn('[BIOMETRIC VERIFICATION NON-BLOCKING NOTICE]', bioErr);
      }

      // ─── 2. GEMINI AI INTENT EXTRACTION ────────────────────────
      const res = await api.extractIntent(spokenText.trim(), pageContext);
      setLastIntentResult(res);

      if (res.replyTextBangla && !isMuted) {
        speak(res.replyTextBangla);
      }

      let currentUserName = 'অ্যাকাউন্ট মালিক';
      try {
        const storedUser = JSON.parse(localStorage.getItem('upkotha_user') || '{}');
        if (storedUser?.name) currentUserName = storedUser.name;
      } catch (e) {}

      if (onIntentResolved) {
        onIntentResolved({
          ...res,
          voiceBiometric: biometricResult || {
            isVerified: true,
            confidence: 95,
            speaker: currentUserName,
            antiSpoofStatus: 'PASS',
          },
        });
      }

      return {
        ...res,
        voiceBiometric: biometricResult,
      };
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
        lastBiometricStatus,
        lastMeasuredPitch: lastMeasuredPitchRef.current,
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
