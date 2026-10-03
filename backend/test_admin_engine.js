import { getAdminMetrics, getVoiceAuditStream } from './controllers/adminController.js';

console.log('====================================================');
console.log('🧪 UPKOTHA ADMIN TELEMETRY & SYSTEM METRICS TEST');
console.log('====================================================\n');

try {
  // Mock request/response helper
  const createMock = (query = {}) => {
    let responseData = null;
    const req = {
      user: { id: 'usr_imran_001' },
      query,
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

  // --- Test 1: Aggregated System KPI Telemetry ---
  console.log('--- 1. Testing System KPI Telemetry Aggregation ---');
  const mock1 = createMock();
  getAdminMetrics(mock1.req, mock1.res, (err) => { if (err) throw err; });
  const metrics = mock1.getData();

  if (!metrics || !metrics.success || !metrics.summary) {
    throw new Error('Failed to retrieve admin telemetry metrics');
  }

  console.log(`✓ Total Voice Interactions: ${metrics.summary.totalInteractions}`);
  console.log(`✓ NLU Requests Processed: ${metrics.summary.nluRequestsProcessed}`);
  console.log(`✓ Biometric Verifications: ${metrics.summary.biometricVerifications}`);
  console.log(`✓ Total Financial Volume Processed: ৳${metrics.summary.totalVolumeProcessed}`);
  console.log('✓ System KPI summary validated!\n');

  // --- Test 2: NLU Intent Distribution & Engine Breakdown ---
  console.log('--- 2. Testing NLU Intent Distribution & Telemetry ---');
  const nlu = metrics.nluTelemetry;
  if (!nlu || !nlu.intentDistribution) {
    throw new Error('NLU telemetry or intent distribution missing');
  }

  console.log(`✓ Average NLU Confidence: ${nlu.avgConfidence}%`);
  console.log(`✓ Average Latency: ${nlu.avgLatencyMs} ms (Gemini Flash Lite)`);
  console.log('✓ Intent Distribution Breakdown:');
  nlu.intentDistribution.forEach((item) => {
    console.log(`   - ${item.intent}: ${item.count} events (${item.percentage}%)`);
  });

  if (nlu.intentDistribution.length === 0) {
    throw new Error('Intent distribution array is empty');
  }
  console.log('✓ NLU telemetry validated!\n');

  // --- Test 3: Biometric Fraud Prevention Telemetry ---
  console.log('--- 3. Testing Biometric Fraud Prevention Telemetry ---');
  const bio = metrics.biometricTelemetry;
  if (!bio) {
    throw new Error('Biometric telemetry section missing');
  }

  console.log(`✓ Total Biometric Checks: ${bio.totalChecks}`);
  console.log(`✓ Legitimate Owner Verified: ${bio.passed}`);
  console.log(`✓ Unmatched / Imposter Blocked: ${bio.breakdown?.mismatchBlocked}`);
  console.log(`✓ Synthetic Spoof / Replay Blocked: ${bio.breakdown?.spoofBlocked}`);
  console.log(`✓ Pass Rate: ${bio.passRate}%`);
  console.log(`✓ Anti-Spoof Accuracy: ${bio.antiSpoofAccuracy}`);

  if (bio.totalChecks <= 0) {
    throw new Error('Biometric check count should be greater than zero');
  }
  console.log('✓ Biometric security telemetry validated!\n');

  // --- Test 4: Privacy-By-Design & Regulatory Compliance ---
  console.log('--- 4. Testing Privacy-By-Design Certification ---');
  const priv = metrics.privacyCompliance;
  if (!priv || !priv.zeroAudioStoredCert || priv.mathematicalFeatureVectorRatio !== '100%') {
    throw new Error('Privacy compliance certificates failed verification');
  }

  console.log(`✓ Zero Audio Files Stored: ${priv.zeroAudioStoredCert}`);
  console.log(`✓ Feature Vector Mathematical Ratio: ${priv.mathematicalFeatureVectorRatio}`);
  console.log(`✓ Regulatory Status: ${priv.regulatoryAuditStatus}`);
  console.log('✓ Privacy compliance certified!\n');

  // --- Test 5: Live Voice Audit Stream with Filters ---
  console.log('--- 5. Testing Live Audit Stream (NLU vs Biometric Filter) ---');
  // 5a. All logs
  const mockAll = createMock({ limit: 10 });
  getVoiceAuditStream(mockAll.req, mockAll.res, (err) => { if (err) throw err; });
  const allLogs = mockAll.getData();
  console.log(`✓ Total Audit Stream items (limit 10): ${allLogs.count}`);

  // 5b. Biometric filter
  const mockBio = createMock({ type: 'biometric', limit: 5 });
  getVoiceAuditStream(mockBio.req, mockBio.res, (err) => { if (err) throw err; });
  const bioStream = mockBio.getData();
  console.log(`✓ Biometric Filter items: ${bioStream.count}`);
  bioStream.logs.forEach((log) => {
    if (log.category !== 'BIOMETRICS') {
      throw new Error(`Expected category BIOMETRICS, got ${log.category}`);
    }
  });

  // 5c. NLU filter
  const mockNlu = createMock({ type: 'nlu', limit: 5 });
  getVoiceAuditStream(mockNlu.req, mockNlu.res, (err) => { if (err) throw err; });
  const nluStream = mockNlu.getData();
  console.log(`✓ NLU Intent Filter items: ${nluStream.count}`);
  nluStream.logs.forEach((log) => {
    if (log.category !== 'NLU_INTENT') {
      throw new Error(`Expected category NLU_INTENT, got ${log.category}`);
    }
  });
  console.log('✓ Live Audit Stream filtering validated!\n');

  console.log('====================================================');
  console.log('🎉 ALL 5 ADMIN TELEMETRY TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
} catch (error) {
  console.error('\n❌ TEST SUITE FAILED:', error.message);
  process.exit(1);
}
