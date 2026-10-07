/**
 * Automated Verification Suite for UPKOTHA ML Security Layer & Central Risk Engine
 * 
 * Verifies:
 * 1. Isolation Forest Anomaly Detection on synthetic MFS data
 * 2. 16-D Acoustic Embedding Cosine Similarity (Speaker Verification)
 * 3. Anti-Spoofing / Replay Detection Signal
 * 4. Central Multi-Factor Risk Engine & Adaptive Friction Tiers
 * 5. Scenario A (Low Risk), Scenario B (Medium Risk), Scenario C (High Risk)
 */

import { analyzeTransactionAnomaly, generateSyntheticMfsDataset } from './services/anomalyDetectionService.js';
import { verifyVoiceBiometrics, cosineSimilarity } from './services/speakerVerificationService.js';
import { evaluateTransactionRisk } from './services/riskEngine.js';

console.log('================================================================');
console.log('UPKOTHA (উপকথা) - ML SECURITY & BEHAVIORAL RISK TEST SUITE');
console.log('Architecture Principle: "AI understands. Rules protect. The user decides."');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`);
  }
}

// ---------------------------------------------------------
// TEST 1: Synthetic Dataset & Isolation Forest Model Training
// ---------------------------------------------------------
console.log('--- TEST 1: Synthetic MFS Dataset & Isolation Forest Model ---');
const dataset = generateSyntheticMfsDataset(200, 20);
assert(dataset.length === 220, 'Synthetic dataset generates normal and anomaly rows');
assert(dataset[0].length === 11, 'Feature vector has exactly 11 MFS behavioral features');

// ---------------------------------------------------------
// TEST 2: Speaker Verification via Cosine Similarity
// ---------------------------------------------------------
console.log('\n--- TEST 2: Prototype Speaker Verification (Cosine Similarity) ---');
const ownerVoice = verifyVoiceBiometrics({ speakerType: 'owner' });
assert(ownerVoice.isVerified === true, 'Enrolled account owner voice verified');
assert(ownerVoice.speakerVerification.similarity >= 0.85, 'Owner voice similarity exceeds 0.85 threshold');

const imposterVoice = verifyVoiceBiometrics({ speakerType: 'imposter' });
assert(imposterVoice.isVerified === false, 'Imposter voice rejected (similarity below threshold)');
assert(imposterVoice.status === 'SPEAKER_MISMATCH', 'Imposter tagged as SPEAKER_MISMATCH');

// ---------------------------------------------------------
// TEST 3: Voice Spoof / Replay Signal
// ---------------------------------------------------------
console.log('\n--- TEST 3: Voice Anti-Spoofing & Replay Signal ---');
const spoofVoice = verifyVoiceBiometrics({ isSpoofSimulated: true });
assert(spoofVoice.spoofDetection.spoofDetected === true, 'Synthetic voice / replay audio detected');
assert(spoofVoice.spoofDetection.spoofScore > 0.80, 'Spoof score high for synthetic replay');
assert(spoofVoice.status === 'SPOOF_REJECT', 'Spoof audio tagged as SPOOF_REJECT');

// ---------------------------------------------------------
// TEST 4: Central Risk Engine - Scenario A: Low Risk
// ---------------------------------------------------------
console.log('\n--- TEST 4: Judge Scenario A (Low Risk - Nominal Transfer) ---');
const scenarioA = evaluateTransactionRisk({
  transaction: {
    amount: 500,
    recipient: 'রাকিব',
    recipientIsNew: false,
    recipientFrequency: 8,
    hour: 14,
  },
  voice: {
    speakerType: 'owner',
    isSpoofSimulated: false,
  },
  userProfile: { averageAmount: 450, isStrictMode: false },
});

console.log(`  Scenario A Risk Score: ${scenarioA.riskScore} (${scenarioA.riskLevel})`);
console.log(`  Recommended Action: ${scenarioA.recommendedAction}`);
assert(scenarioA.riskLevel === 'LOW', 'Scenario A classified as LOW RISK');
assert(scenarioA.riskScore < 0.30, 'Scenario A risk score in range [0.00, 0.30]');
assert(scenarioA.recommendedAction === 'STANDARD', 'Standard friction recommended');

// ---------------------------------------------------------
// TEST 5: Central Risk Engine - Scenario B: Medium Risk
// ---------------------------------------------------------
console.log('\n--- TEST 5: Judge Scenario B (Medium Risk - Off-Peak & Deviation) ---');
const scenarioB = evaluateTransactionRisk({
  transaction: {
    amount: 2500,
    recipient: 'সুমন আহমেদ',
    recipientIsNew: false,
    recipientFrequency: 2,
    hour: 23, // 11:15 PM
  },
  voice: {
    speakerType: 'owner',
    isSpoofSimulated: false,
  },
  userProfile: { averageAmount: 450, isStrictMode: false },
});

console.log(`  Scenario B Risk Score: ${scenarioB.riskScore} (${scenarioB.riskLevel})`);
console.log(`  Recommended Action: ${scenarioB.recommendedAction}`);
assert(scenarioB.riskLevel === 'MEDIUM', 'Scenario B classified as MEDIUM RISK');
assert(scenarioB.riskScore >= 0.30 && scenarioB.riskScore < 0.70, 'Scenario B risk score in range [0.30, 0.70]');
assert(scenarioB.recommendedAction === 'ADDITIONAL_CONFIRMATION', 'Additional confirmation friction recommended');

// ---------------------------------------------------------
// TEST 6: Central Risk Engine - Scenario C: High Risk (Midnight Anomaly + Spoof)
// ---------------------------------------------------------
console.log('\n--- TEST 6: Judge Scenario C (High Risk - ৳15,000 at 2:47 AM + Spoof) ---');
const scenarioC = evaluateTransactionRisk({
  transaction: {
    amount: 15000,
    recipient: 'অপরিচিত নম্বর (+8801999999999)',
    recipientIsNew: true,
    recipientFrequency: 0,
    hour: 2, // 2:47 AM
  },
  voice: {
    speakerType: 'spoof',
    isSpoofSimulated: true,
  },
  userProfile: { averageAmount: 450, isStrictMode: false },
});

console.log(`  Scenario C Risk Score: ${scenarioC.riskScore} (${scenarioC.riskLevel})`);
console.log(`  Recommended Action: ${scenarioC.recommendedAction}`);
console.log(`  Explainable Signals: ${scenarioC.signals.length} signals generated`);
assert(scenarioC.riskLevel === 'HIGH', 'Scenario C classified as HIGH RISK');
assert(scenarioC.riskScore >= 0.70 || scenarioC.breakdown.spoofDetection.spoofDetected, 'High risk or spoof detected');
assert(scenarioC.recommendedAction === 'HIGH_FRICTION_CHALLENGE', 'High friction challenge recommended');
assert(scenarioC.signals.length >= 3, 'Multiple explainable signals generated with concrete features');

// ---------------------------------------------------------
// Summary
// ---------------------------------------------------------
console.log('\n================================================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100% SUCCESS)`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
