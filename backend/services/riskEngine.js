/**
 * Central Risk Engine (কেন্দ্রীয় ঝুঁকি মূল্যায়ন ইঞ্জিন)
 * 
 * Orchestrates multi-factor security signals across Upkotha:
 * 1. Transaction Anomaly Score (Isolation Forest ML Model)
 * 2. Speaker Verification Score (16-D Acoustic Embedding Cosine Similarity)
 * 3. Voice Anti-Spoof / Replay Signal (Spectral Liveness & Phase Analysis)
 * 4. Recipient Novelty & Historical Deviation
 * 
 * Architecture Principle:
 * "AI understands. Rules protect. The user decides."
 * 
 * Calibrated Risk Tiers:
 * 0.00 - 0.30 = LOW
 * 0.30 - 0.70 = MEDIUM
 * 0.70 - 1.00 = HIGH
 * 
 * Adaptive Friction Recommendations:
 * - LOW    -> STANDARD (Normal PIN confirmation)
 * - MEDIUM -> ADDITIONAL_CONFIRMATION (Explicit caution alert + checkbox + PIN)
 * - HIGH   -> HIGH_FRICTION_CHALLENGE (Biometric challenge + friction banner + PIN)
 */

import { analyzeTransactionAnomaly } from './anomalyDetectionService.js';
import { verifyVoiceBiometrics } from './speakerVerificationService.js';

/**
 * Composite Multi-Factor Risk Assessment
 * 
 * @param {Object} params
 * @param {Object} params.transaction - { amount, recipient, recipientIsNew, hour, day, etc. }
 * @param {Object} params.voice - { speakerType, isSpoofSimulated, audioFeatures }
 * @param {Object} params.userProfile - { averageAmount, stdAmount, isStrictMode }
 * @returns {Object} Comprehensive risk evaluation payload
 */
export function evaluateTransactionRisk(params = {}) {
  const {
    transaction = {},
    voice = {},
    userProfile = {},
  } = params;

  // 1. Evaluate Transaction Anomaly using Isolation Forest
  const anomalyResult = analyzeTransactionAnomaly(transaction, userProfile);

  // 2. Evaluate Voice Biometrics (Speaker Verification + Anti-Spoof)
  const voiceResult = verifyVoiceBiometrics(voice);

  // 3. Multi-Factor Weighted Risk Scoring
  // An unusual transaction anomaly (e.g. ৳2,500 at off-peak hour or ৳15,000)
  // elevates baseline risk even if the voice biometric is familiar.
  const txnAnomalyScore = anomalyResult.anomalyScore; // 0.0 - 1.0
  const speakerSimilarity = voiceResult.speakerVerification.similarity; // 0.0 - 1.0
  const voiceMismatchPenalty = Math.max(0, 1.0 - speakerSimilarity); // 0.0 - 1.0
  const spoofScore = voiceResult.spoofDetection.spoofScore; // 0.0 - 1.0

  let compositeScore = Math.max(
    txnAnomalyScore * 0.85,
    (txnAnomalyScore * 0.45 + voiceMismatchPenalty * 0.35 + spoofScore * 0.20)
  );

  // If spoof detected, composite score immediately escalates
  if (spoofScore >= 0.50) {
    compositeScore = Math.max(compositeScore, spoofScore * 0.95);
  }

  // Strict Mode multiplier if enabled by user
  if (userProfile.isStrictMode) {
    compositeScore = Math.min(1.0, compositeScore + 0.10);
  }

  // Bound and round composite score
  compositeScore = Number(Math.max(0.02, Math.min(0.99, compositeScore)).toFixed(2));

  // Determine Risk Tier
  let riskLevel = 'LOW';
  let recommendedAction = 'STANDARD';
  let frictionLevel = 'LOW';

  if (compositeScore >= 0.70 || spoofScore >= 0.50 || txnAnomalyScore >= 0.75) {
    riskLevel = 'HIGH';
    compositeScore = Math.max(0.70, compositeScore);
    recommendedAction = 'HIGH_FRICTION_CHALLENGE';
    frictionLevel = 'HIGH';
  } else if (compositeScore >= 0.30 || txnAnomalyScore >= 0.30 || !voiceResult.speakerVerification.matched) {
    riskLevel = 'MEDIUM';
    compositeScore = Math.max(0.32, Math.min(0.68, compositeScore));
    recommendedAction = 'ADDITIONAL_CONFIRMATION';
    frictionLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
    compositeScore = Math.min(0.28, compositeScore);
    recommendedAction = 'STANDARD';
    frictionLevel = 'LOW';
  }

  // 4. Compile Unified Explainable Signals (Transparent & Data-Grounded)
  const explainableSignals = [...anomalyResult.signals];

  if (voiceResult.spoofDetection.spoofDetected) {
    explainableSignals.unshift({
      id: 'VOICE_SPOOF_ALERT',
      severity: 'CRITICAL',
      title: 'কৃত্রিম কণ্ঠ বা রিপ্লে অডিও শনাক্ত',
      detail: `ভয়েস ইনপুটে অস্বাভাবিক কৃত্রিম বৈশিষ্ট্য পাওয়া গেছে (স্পুফ স্কোর: ${voiceResult.spoofDetection.spoofPercent}%)।`,
      feature: 'voice_spoof_signal',
      metric: `${voiceResult.spoofDetection.spoofPercent}% spoof probability`,
    });
  } else if (!voiceResult.speakerVerification.matched) {
    explainableSignals.unshift({
      id: 'SPEAKER_MISMATCH_ALERT',
      severity: 'HIGH',
      title: 'কণ্ঠস্বরের সাদৃশ্য কম',
      detail: `বর্তমান স্বরের মিল মাত্র ${voiceResult.speakerVerification.similarityPercent}%, যা নিরাপত্তা সীমা ৮৫%-এর নিচে।`,
      feature: 'voice_similarity_score',
      metric: `${voiceResult.speakerVerification.similarityPercent}% match`,
    });
  } else {
    explainableSignals.push({
      id: 'VOICE_BIOMETRIC_PASS',
      severity: 'INFO',
      title: 'ভয়েস বায়োমেট্রিক অনুমোদিত',
      detail: `অ্যাকাউন্ট মালিকের কণ্ঠের সাথে ${voiceResult.speakerVerification.similarityPercent}% মিল পাওয়া গেছে।`,
      feature: 'voice_similarity_score',
      metric: `${voiceResult.speakerVerification.similarityPercent}% match`,
    });
  }

  // Generate Bangla Friction Summary Guidance
  let frictionAdviceBangla = '';
  if (riskLevel === 'HIGH') {
    frictionAdviceBangla = 'উচ্চ ঝুঁকি শনাক্ত হয়েছে! নিরাপত্তা বিধিমোতাবেক সতর্কতামূলক যাচাই ও অতিরিক্ত সম্মতি গ্রহণ আবশ্যক।';
  } else if (riskLevel === 'MEDIUM') {
    frictionAdviceBangla = 'মাঝারি ঝুঁকি: প্রাপক ও টাকার পরিমাণ পুনরায় মিলিয়ে নিন এবং সম্মতি নিশ্চিত করুন।';
  } else {
    frictionAdviceBangla = 'স্বাভাবিক ও নিরাপদ লেনদেন। ৪ ডিজিটের পিন দিয়ে সম্পন্ন করুন।';
  }

  return {
    engine: 'Upkotha Central Multi-Factor Risk Engine',
    timestamp: new Date().toISOString(),
    riskScore: compositeScore,
    riskScorePercent: Math.round(compositeScore * 100),
    riskLevel,
    recommendedAction,
    frictionLevel,
    frictionAdviceBangla,
    isStrictModeActive: Boolean(userProfile.isStrictMode),
    breakdown: {
      transactionAnomaly: {
        score: anomalyResult.anomalyScore,
        rawScore: anomalyResult.rawScore,
        riskLevel: anomalyResult.riskLevel,
        model: anomalyResult.model,
      },
      speakerVerification: voiceResult.speakerVerification,
      spoofDetection: voiceResult.spoofDetection,
    },
    signals: explainableSignals,
    thresholds: {
      low: '0.00 - 0.30 (Standard Friction)',
      medium: '0.30 - 0.70 (Additional Confirmation)',
      high: '0.70 - 1.00 (High Friction Biometric Challenge)',
    },
  };
}

export default {
  evaluateTransactionRisk,
};
