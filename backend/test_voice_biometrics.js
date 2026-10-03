import {
  getVoiceProfile,
  verifySpeaker,
  enrollVoice,
  getVoiceLogs,
} from './controllers/voiceController.js';
import db from './dataStore.js';

console.log('====================================================');
console.log('🧪 UPKOTHA VOICE BIOMETRICS & ANTI-SPOOF ENGINE TEST');
console.log('====================================================\n');

try {
  const userId = 'usr_imran_001';

  // Helper mock request/response
  const createMock = (body = {}) => {
    let responseData = null;
    const req = {
      user: { id: userId },
      body,
    };
    const res = {
      json: (payload) => {
        responseData = payload;
      },
      status: function (code) {
        this.statusCode = code;
        return this;
      },
    };
    return { req, res, getData: () => responseData };
  };

  // --- Test 1: Retrieve Enrolled Voice Biometric Profile ---
  console.log('--- 1. Testing Voice Profile Retrieval & Acoustic Specs ---');
  const mock1 = createMock();
  getVoiceProfile(mock1.req, mock1.res, (err) => { if (err) throw err; });
  const profData = mock1.getData();

  if (!profData || !profData.success || !profData.profile) {
    throw new Error('Failed to retrieve voice profile');
  }
  console.log(`✓ Owner Name: ${profData.profile.ownerName}`);
  console.log(`✓ Primary Speaker: ${profData.profile.primarySpeaker}`);
  console.log(`✓ Fundamental Frequency (F0): ${profData.profile.fundamentalFrequencyHz} Hz`);
  console.log(`✓ Pitch Range: ${profData.profile.pitchRangeHz?.join(' - ')} Hz`);
  console.log(`✓ Anti-Spoof Enabled: ${profData.profile.antiSpoofEnabled}`);
  console.log(`✓ Privacy Notice: "${profData.privacyNotice}"`);

  if (!profData.profile.isEnrolled || profData.profile.primarySpeaker !== 'ইমরান হোসেন') {
    throw new Error('Voice profile verification attributes failed');
  }
  console.log('✓ Profile retrieved and acoustic specs validated!\n');

  // --- Test 2: Verify Legitimate Account Owner (Imran) ---
  console.log('--- 2. Testing Legitimate Account Owner Verification (Imran) ---');
  const mock2 = createMock({
    simulatedSpeaker: 'owner',
    sampleTranscript: 'রাকিবকে ৫০০ টাকা পাঠাও',
    sampleDuration: 2.3,
  });
  verifySpeaker(mock2.req, mock2.res, (err) => { if (err) throw err; });
  const ownerResult = mock2.getData();

  console.log(`✓ Is Verified: ${ownerResult.isVerified}`);
  console.log(`✓ Similarity Score: ${ownerResult.similarityScore}%`);
  console.log(`✓ Liveness Score: ${ownerResult.livenessScore}%`);
  console.log(`✓ Anti-Spoof Status: ${ownerResult.antiSpoofStatus}`);
  console.log(`✓ Confidence: ${ownerResult.confidenceLevel}`);
  console.log(`✓ Bangla Message: "${ownerResult.messageBangla}"`);

  if (!ownerResult.isVerified || ownerResult.similarityScore < 85 || ownerResult.antiSpoofStatus !== 'PASS') {
    throw new Error('Legitimate owner voice failed verification or anti-spoof check');
  }
  console.log('✓ Legitimate owner verification passed with high confidence!\n');

  // --- Test 3: Test Imposter / Unknown Third-Party Speaker ---
  console.log('--- 3. Testing Imposter / Unknown Speaker Detection ---');
  const mock3 = createMock({
    simulatedSpeaker: 'imposter',
    sampleTranscript: 'রাকিবকে ৫০০০ টাকা পাঠাও',
    sampleDuration: 2.1,
  });
  verifySpeaker(mock3.req, mock3.res, (err) => { if (err) throw err; });
  const imposterResult = mock3.getData();

  console.log(`✓ Is Verified: ${imposterResult.isVerified}`);
  console.log(`✓ Similarity Score: ${imposterResult.similarityScore}%`);
  console.log(`✓ Anti-Spoof Status: ${imposterResult.antiSpoofStatus}`);
  console.log(`✓ Speaker Identified: ${imposterResult.speaker}`);
  console.log(`✓ Bangla Alert: "${imposterResult.messageBangla}"`);

  if (imposterResult.isVerified !== false || imposterResult.similarityScore >= 70 || imposterResult.antiSpoofStatus !== 'SPEAKER_MISMATCH') {
    throw new Error('Imposter voice was not correctly rejected by biometric matcher');
  }
  console.log('✓ Imposter voice correctly rejected with mismatch signal!\n');

  // --- Test 3B: Testing Real Acoustic Pitch Deviation (126 Hz vs 215 Hz) ---
  console.log('--- 3B. Testing Real Acoustic Pitch Differentiation (126 Hz vs 215 Hz) ---');
  // Matching Pitch
  const mockMatchPitch = createMock({
    audioFeatures: { pitchHz: 126 },
    sampleTranscript: 'আমার ব্যালেন্স কত',
  });
  verifySpeaker(mockMatchPitch.req, mockMatchPitch.res, (err) => { if (err) throw err; });
  const matchResult = mockMatchPitch.getData();
  console.log(`✓ 126 Hz Voice -> Verified: ${matchResult.isVerified}, Match: ${matchResult.similarityScore}%, Status: ${matchResult.antiSpoofStatus}`);

  // Divergent Pitch (Different voice, e.g. 215 Hz)
  const mockDiffPitch = createMock({
    audioFeatures: { pitchHz: 215 },
    sampleTranscript: 'আমার ব্যালেন্স কত',
  });
  verifySpeaker(mockDiffPitch.req, mockDiffPitch.res, (err) => { if (err) throw err; });
  const diffResult = mockDiffPitch.getData();
  console.log(`✓ 215 Hz Voice -> Verified: ${diffResult.isVerified}, Match: ${diffResult.similarityScore}%, Status: ${diffResult.antiSpoofStatus}`);
  console.log(`✓ Divergent Voice Alert: "${diffResult.messageBangla}"`);

  if (!matchResult.isVerified || diffResult.isVerified !== false || diffResult.similarityScore > 50) {
    throw new Error('Real acoustic pitch differentiation failed between 126 Hz and 215 Hz');
  }
  console.log('✓ Acoustic pitch comparison successfully distinguishes two different voices!\n');

  // --- Test 4: Test Synthetic Spoof / Deepfake / Replay Attack ---
  console.log('--- 4. Testing Synthetic Spoof & Deepfake Replay Attack Detection ---');
  const mock4 = createMock({
    simulatedSpoof: true,
    sampleTranscript: 'জরুরি ক্যাশ আউট করো',
    sampleDuration: 2.8,
  });
  verifySpeaker(mock4.req, mock4.res, (err) => { if (err) throw err; });
  const spoofResult = mock4.getData();

  console.log(`✓ Is Verified: ${spoofResult.isVerified}`);
  console.log(`✓ Liveness Score: ${spoofResult.livenessScore}%`);
  console.log(`✓ Anti-Spoof Status: ${spoofResult.antiSpoofStatus}`);
  console.log(`✓ Confidence Level: ${spoofResult.confidenceLevel}`);
  console.log(`✓ Bangla Warning: "${spoofResult.messageBangla}"`);

  if (spoofResult.isVerified !== false || spoofResult.antiSpoofStatus !== 'SYNTHETIC_SPOOF_DETECTED' || spoofResult.confidenceLevel !== 'REJECT') {
    throw new Error('Synthetic spoof attack was not caught by anti-spoof detector');
  }
  console.log('✓ Synthetic spoof attack blocked and flagged successfully!\n');

  // --- Test 5: Voice Enrollment / Recalibration ---
  console.log('--- 5. Testing Voice Enrollment & Recalibration ---');
  const prevCount = profData.profile.sampleCount || 0;
  const mock5 = createMock({
    phrase: 'আমার ব্যালেন্স কত',
    pitchHz: 129.2,
  });
  enrollVoice(mock5.req, mock5.res, (err) => { if (err) throw err; });
  const enrollResult = mock5.getData();

  console.log(`✓ Message: "${enrollResult.message}"`);
  console.log(`✓ New Sample Count: ${enrollResult.profile.sampleCount}`);
  console.log(`✓ Recalibrated F0: ${enrollResult.profile.fundamentalFrequencyHz} Hz`);

  if (enrollResult.profile.sampleCount !== prevCount + 1) {
    throw new Error('Voice recalibration failed to increment sample count');
  }
  console.log('✓ Voice recalibration updated biometric parameters!\n');

  // --- Test 6: Biometric Verification Audit Logs ---
  console.log('--- 6. Testing Privacy-Safe Biometric Audit Logs ---');
  const mock6 = createMock();
  getVoiceLogs(mock6.req, mock6.res, (err) => { if (err) throw err; });
  const logsResult = mock6.getData();

  console.log(`✓ Log Records Found: ${logsResult.count}`);
  if (!logsResult.logs || logsResult.logs.length === 0) {
    throw new Error('No biometric audit log records found');
  }
  const latestLog = logsResult.logs[0];
  console.log(`✓ Latest Audit ID: ${latestLog.id}`);
  console.log(`✓ Logged Speaker: ${latestLog.speakerIdentified}`);
  console.log(`✓ Logged Status: ${latestLog.antiSpoofStatus}`);
  console.log(`✓ Privacy Compliant: ${latestLog.privacyCompliant}`);

  if (!latestLog.privacyCompliant) {
    throw new Error('Audit log is missing privacy compliance flag');
  }
  console.log('✓ Privacy-safe biometric audit logs verified!\n');

  console.log('====================================================');
  console.log('🎉 ALL 6 VOICE BIOMETRICS TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
} catch (error) {
  console.error('\n❌ TEST SUITE FAILED:', error.message);
  process.exit(1);
}
