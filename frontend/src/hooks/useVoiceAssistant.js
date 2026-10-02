import { useEffect } from 'react';
import { useVoice } from '../context/VoiceContext';

/**
 * useVoiceAssistant Hook:
 * Implements the standard Upkotha voice interface requested in Section 23.
 */
export default function useVoiceAssistant(pageContextName = 'dashboard') {
  const voice = useVoice();

  // Set the active screen context whenever component mounts or updates
  useEffect(() => {
    if (pageContextName && voice.setPageContext) {
      voice.setPageContext(pageContextName);
    }
  }, [pageContextName, voice.setPageContext]);

  return {
    // States
    transcript: voice.transcript,
    isListening: voice.isListening,
    isProcessing: voice.isProcessing,
    isSpeaking: voice.isSpeaking,
    isMuted: voice.isMuted,
    isSupported: voice.isSupported,
    error: voice.error,
    lastIntentResult: voice.lastIntentResult,

    // Methods
    startListening: voice.startListening,
    stopListening: voice.stopListening,
    speak: voice.speak,
    stopSpeaking: voice.stopSpeaking,
    toggleMute: voice.toggleMute,
    setContext: voice.setPageContext,
    executeCommand: voice.executeCommand,
  };
}
