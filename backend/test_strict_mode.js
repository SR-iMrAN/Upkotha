import { stageTransaction } from './services/transactionEngine.js';

console.log('====================================================');
console.log('🧪 UPKOTHA STRICT MODE & ANOMALY DETECTION TEST');
console.log('====================================================\n');

try {
  const userId = 'usr_imran_001';

  // --- Test 1: Normal Transfer (< ৳5000 to Saved Contact) ---
  console.log('--- 1. Testing Normal Transfer (< ৳5,000 to Saved Contact: Rakib) ---');
  const stageNormal = stageTransaction({
    userId,
    type: 'send_money',
    recipient: 'রাকিব',
    amount: 500,
    isStrictMode: false,
  });
  console.log('✓ Stage ID:', stageNormal.stageId);
  console.log('✓ Anomaly Signal:', stageNormal.anomalySignal);
  if (stageNormal.anomalySignal !== null) {
    throw new Error('Normal transfer should not trigger anomaly signal in non-strict mode');
  }
  console.log('✓ Normal transfer correctly evaluated with 0 anomaly!\n');

  // --- Test 2: High Value Transfer (>= ৳5000) ---
  console.log('--- 2. Testing High Value Transfer (৳6,000) ---');
  const stageHigh = stageTransaction({
    userId,
    type: 'send_money',
    recipient: 'রাকিব',
    amount: 6000,
    isStrictMode: false,
  });
  console.log('✓ Anomaly Level:', stageHigh.anomalySignal?.level);
  console.log('✓ Requires Double Confirmation:', stageHigh.anomalySignal?.requiresDoubleConfirmation);
  console.log('✓ Alert Bangla:', stageHigh.anomalySignal?.messageBangla);
  if (stageHigh.anomalySignal?.level !== 'WARNING' || !stageHigh.anomalySignal?.requiresDoubleConfirmation) {
    throw new Error('High value transfer failed to trigger WARNING or requiresDoubleConfirmation');
  }
  console.log('✓ High value anomaly signal passed!\n');

  // --- Test 3: Unfamiliar Contact Transfer ---
  console.log('--- 3. Testing Unfamiliar Recipient Transfer (01988-776655) ---');
  const stageUnfamiliar = stageTransaction({
    userId,
    type: 'send_money',
    recipient: '01988-776655',
    amount: 1000,
    isStrictMode: false,
  });
  console.log('✓ Anomaly Level:', stageUnfamiliar.anomalySignal?.level);
  console.log('✓ Title:', stageUnfamiliar.anomalySignal?.title);
  console.log('✓ Alert Bangla:', stageUnfamiliar.anomalySignal?.messageBangla);
  if (stageUnfamiliar.anomalySignal?.level !== 'CAUTION') {
    throw new Error('Unfamiliar recipient failed to trigger CAUTION');
  }
  console.log('✓ Unfamiliar contact alert passed!\n');

  // --- Test 4: Strict Mode Active on Everyday Transfer ---
  console.log('--- 4. Testing Strict Mode Active on Regular Transfer ---');
  const stageStrict = stageTransaction({
    userId,
    type: 'send_money',
    recipient: 'রাকিব',
    amount: 500,
    isStrictMode: true,
  });
  console.log('✓ Strict Mode Signal:', stageStrict.anomalySignal);
  if (!stageStrict.anomalySignal || stageStrict.anomalySignal.level !== 'INFO') {
    throw new Error('Strict mode failed to attach safety badge');
  }
  console.log('✓ Strict mode active signal passed!\n');

  // --- Test 5: Rejection of Amount Exceeding Maximum Limit ---
  console.log('--- 5. Testing Amount Exceeding Limit (> ৳25,000) ---');
  try {
    stageTransaction({
      userId,
      type: 'send_money',
      recipient: 'রাকিব',
      amount: 30000,
    });
    throw new Error('Should have rejected amount exceeding maximum single transaction limit');
  } catch (err) {
    console.log('✓ Successfully rejected excess amount!');
    console.log('✓ Error code:', err.code);
    console.log('✓ Message:', err.customMessage);
    if (err.code !== 'AMOUNT_EXCEEDS_MAXIMUM') {
      throw new Error(`Expected AMOUNT_EXCEEDS_MAXIMUM, got: ${err.code}`);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 ALL 5 STRICT MODE & ANOMALY TESTS PASSED!');
  console.log('====================================================');
} catch (err) {
  console.error('Test execution failed:', err);
  process.exit(1);
}
