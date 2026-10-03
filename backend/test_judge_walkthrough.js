import { resetDemoState, getAdminMetrics } from './controllers/adminController.js';
import { validateTransaction, executeSendMoney } from './controllers/transactionController.js';
import { verifySpeaker } from './controllers/voiceController.js';
import { stageTransaction } from './services/transactionEngine.js';
import db from './dataStore.js';

console.log('====================================================');
console.log('🧪 UPKOTHA END-TO-END JUDGE WALKTHROUGH TEST SUITE');
console.log('====================================================\n');

let passCount = 0;
const totalTests = 6;

try {
  const createMock = (body = {}, user = { id: 'usr_imran_001', isStrictMode: false, availableBalance: 13500, lockedBalance: 5000 }) => {
    let statusCode = 200;
    let responseData = null;
    const req = {
      method: 'POST',
      url: '/test',
      user,
      body,
      query: {},
    };
    const res = {
      status: function (code) {
        statusCode = code;
        return this;
      },
      json: function (payload) {
        responseData = payload;
      },
    };
    return { req, res, getStatus: () => statusCode, getData: () => responseData };
  };

  // --- Journey 1: Reset Demo State & Imran Baseline Verification ---
  console.log('--- 1. Testing Demo Wallet Reset & Baseline State ---');
  const mockReset = createMock();
  resetDemoState(mockReset.req, mockReset.res, (err) => { if (err) throw err; });
  const resetData = mockReset.getData();

  if (
    resetData.success &&
    resetData.wallet.availableBalance === 13500 &&
    resetData.wallet.lockedBalance === 5000 &&
    resetData.wallet.totalBalance === 18500
  ) {
    console.log('✓ Demo state successfully reset to Imran baseline (Available: ৳13,500, Locked: ৳5,000)');
    passCount++;
  } else {
    throw new Error('Reset demo state failed or returned unexpected balance values');
  }

  // --- Journey 2: Voice-First Send Money Staging (৳500 to Rakib) ---
  console.log('\n--- 2. Testing Journey 1: Voice-First Send Money Staging ---');
  const mockJ1 = createMock({
    type: 'send_money',
    amount: 500,
    recipient: 'রাকিব',
  });
  validateTransaction(mockJ1.req, mockJ1.res, (err) => { if (err) throw err; });
  const j1Data = mockJ1.getData();

  if (j1Data.success && j1Data.postBalance === 13000 && j1Data.recipientPhone === '01798-765432') {
    console.log(`✓ Send Money ৳500 to Rakib staged (Fee: ৳${j1Data.fee}, Projected Balance: ৳${j1Data.postBalance})`);
    console.log(`✓ Recipient phone resolved: ${j1Data.recipientPhone}`);
    passCount++;
  } else {
    throw new Error('Journey 1 staging failed');
  }

  // --- Journey 3: Imposter Pitch Rejection & Anti-Spoofing ---
  console.log('\n--- 3. Testing Journey 2: Imposter Voice Pitch Defense ---');
  const mockBioImposter = createMock({
    audioFeatures: { pitchHz: 195 },
    sampleDuration: 2.1,
  });
  verifySpeaker(mockBioImposter.req, mockBioImposter.res, (err) => { if (err) throw err; });
  const imposterData = mockBioImposter.getData();

  if (
    !imposterData.isVerified &&
    imposterData.antiSpoofStatus === 'SPEAKER_MISMATCH' &&
    imposterData.similarityScore < 85
  ) {
    console.log(`✓ Imposter voice (195 Hz) successfully blocked! Status: ${imposterData.antiSpoofStatus}`);
    console.log(`✓ Similarity score dropped to ${imposterData.similarityScore}% (Threshold: 85%)`);
    passCount++;
  } else {
    throw new Error('Journey 2 imposter defense failed to reject high-pitch speaker');
  }

  // --- Journey 4: Anomaly Shield on Unknown Recipient or High Amount ---
  console.log('\n--- 4. Testing Journey 3: Anomaly Alert on Large Transfer ---');
  const mockAnomaly = createMock({
    type: 'send_money',
    amount: 6000,
    recipient: '01999888777',
  });
  validateTransaction(mockAnomaly.req, mockAnomaly.res, (err) => { if (err) throw err; });
  const anomalyData = mockAnomaly.getData();

  if (
    anomalyData.anomalySignal &&
    (anomalyData.anomalySignal.level === 'WARNING' || anomalyData.anomalySignal.level === 'CAUTION') &&
    anomalyData.anomalySignal.requiresDoubleConfirmation
  ) {
    console.log(`✓ Anomaly detected on transfer >= ৳5000: Level=${anomalyData.anomalySignal.level}`);
    console.log(`✓ Double confirmation required: ${anomalyData.anomalySignal.requiresDoubleConfirmation}`);
    console.log(`✓ Plain-Bangla warning: "${anomalyData.anomalySignal.messageBangla.substring(0, 45)}..."`);
    passCount++;
  } else {
    throw new Error('Journey 3 anomaly shield failed');
  }

  // --- Journey 5: Smart Money Lock Savings Protection ---
  console.log('\n--- 5. Testing Journey 4: Smart Money Lock Shield Overdraft Protection ---');
  let lockRejected = false;
  try {
    stageTransaction({
      userId: 'usr_imran_001',
      type: 'send_money',
      recipient: 'রাকিব',
      amount: 15000,
    });
  } catch (err) {
    if (err.code === 'LOCKED_MONEY_CONFLICT' || err.code === 'INSUFFICIENT_FUNDS') {
      lockRejected = true;
      console.log('✓ Spending ৳15,000 into locked savings properly blocked');
      console.log(`✓ Error Code: ${err.code}`);
      console.log(`✓ Plain-Bangla reason: "${err.customMessage || err.message}"`);
    }
  }

  if (lockRejected) {
    passCount++;
  } else {
    throw new Error('Journey 4 Smart Lock shield failed to block overdraft into locked funds');
  }

  // --- Journey 6: MFS Operator Telemetry & Privacy Certification ---
  console.log('\n--- 6. Testing Journey 6: MFS Operator Telemetry & Privacy Audit ---');
  const mockAdmin = createMock();
  getAdminMetrics(mockAdmin.req, mockAdmin.res, (err) => { if (err) throw err; });
  const adminData = mockAdmin.getData();

  if (
    adminData.success &&
    adminData.privacyCompliance.zeroAudioStoredCert === true &&
    adminData.privacyCompliance.regulatoryAuditStatus === 'PASSED_REGULATORY_INSPECTION'
  ) {
    console.log('✓ Admin telemetry aggregates generated successfully');
    console.log(`✓ Zero raw audio storage certified: ${adminData.privacyCompliance.zeroAudioStoredCert}`);
    console.log(`✓ Regulatory audit status: ${adminData.privacyCompliance.regulatoryAuditStatus}`);
    passCount++;
  } else {
    throw new Error('Journey 6 telemetry & privacy verification failed');
  }

  console.log('\n====================================================');
  console.log(`🎉 ALL 6 JUDGE JOURNEYS VERIFIED & PASSING: ${passCount}/${totalTests}`);
  console.log('====================================================');
} catch (error) {
  console.error('\n❌ JUDGE WALKTHROUGH TEST FAILED:', error.message);
  process.exit(1);
}
