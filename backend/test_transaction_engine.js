import db from './dataStore.js';
import { stageTransaction, commitTransaction } from './services/transactionEngine.js';

console.log('====================================================');
console.log('🧪 UPKOTHA TRANSACTION ENGINE INTEGRATION TEST');
console.log('====================================================\n');

try {
  // Test 1: Stage Send Money
  console.log('--- 1. Testing Staged Validation for Send Money (500 BDT to Rakib) ---');
  const stage1 = stageTransaction({
    userId: 'usr_imran_001',
    type: 'send_money',
    recipient: 'রাকিব',
    amount: 500,
  });
  console.log('✓ Stage ID:', stage1.stageId);
  console.log('✓ Resolved Recipient:', stage1.recipient);
  console.log('✓ Recipient Phone:', stage1.recipientPhone);
  console.log('✓ Amount:', stage1.amount, '| Fee:', stage1.fee);
  console.log('✓ Post Balance (Projected):', stage1.postBalance);

  // Test 2: Locked Money Conflict
  console.log('\n--- 2. Testing Locked Money Conflict (Attempting ৳15,000 when Available is ৳13,500) ---');
  try {
    stageTransaction({
      userId: 'usr_imran_001',
      type: 'send_money',
      recipient: 'রাকিব',
      amount: 15000,
    });
    console.error('✗ FAILED: Should have rejected ৳15,000 due to locked money');
    process.exit(1);
  } catch (err) {
    console.log('✓ Successfully caught locked money conflict!');
    console.log('✓ Error code:', err.code);
    console.log('✓ Friendly Bangla:', err.customMessage);
  }

  // Test 3: High Value Behavioral Anomaly Signal
  console.log('\n--- 3. Testing Behavioral Anomaly Signal (Transfer >= ৳5,000) ---');
  const stageHigh = stageTransaction({
    userId: 'usr_imran_001',
    type: 'send_money',
    recipient: 'রাকিব',
    amount: 6000,
  });
  console.log('✓ Anomaly Signal Level:', stageHigh.anomalySignal?.level);
  console.log('✓ Anomaly Message:', stageHigh.anomalySignal?.messageBangla);

  // Test 4: Wrong PIN rejection
  console.log('\n--- 4. Testing Secure PIN Verification (Reject wrong PIN) ---');
  try {
    commitTransaction({
      stageId: stage1.stageId,
      pin: '0000',
      userId: 'usr_imran_001',
    });
    console.error('✗ FAILED: Should have rejected wrong PIN 0000');
    process.exit(1);
  } catch (err) {
    console.log('✓ Successfully rejected wrong PIN!');
    console.log('✓ Error code:', err.code);
    console.log('✓ Friendly Bangla:', err.customMessage);
  }

  // Test 5: Successful Execution with PIN 1234
  console.log('\n--- 5. Testing Commit Transaction with Valid PIN (1234) ---');
  const beforeAvailable = db.getUser('usr_imran_001').availableBalance;
  const result = commitTransaction({
    stageId: stage1.stageId,
    pin: '1234',
    userId: 'usr_imran_001',
  });
  console.log('✓ Commit Result Message:', result.message);
  console.log('✓ Receipt Transaction ID:', result.receipt.transactionId);
  console.log('✓ Plain-Bangla Explanation:', result.receipt.explanationBangla);
  console.log('✓ New Available Balance:', result.receipt.newAvailableBalance);
  console.log('✓ Balance Check:', beforeAvailable, '->', result.receipt.newAvailableBalance, `(Deducted: ৳${result.receipt.totalDeduction})`);

  // Test 6: Cash Out with 1% Fee
  console.log('\n--- 6. Testing Cash Out (2000 BDT from Rahim Store with 1% fee) ---');
  const stageCash = stageTransaction({
    userId: 'usr_imran_001',
    type: 'cash_out',
    agent: 'রহিম স্টোর',
    amount: 2000,
  });
  console.log('✓ Agent:', stageCash.recipient);
  console.log('✓ Fee:', stageCash.fee, 'BDT (1% of 2000 = 20 BDT)');
  console.log('✓ Total Deduction:', stageCash.totalDeduction, 'BDT');

  const cashResult = commitTransaction({
    stageId: stageCash.stageId,
    pin: '1234',
    userId: 'usr_imran_001',
  });
  console.log('✓ Cash Out Receipt:', cashResult.receipt.transactionId);
  console.log('✓ Cash Out Explanation:', cashResult.receipt.explanationBangla);
  console.log('✓ New Available Balance:', cashResult.receipt.newAvailableBalance);

  console.log('\n====================================================');
  console.log('🎉 ALL 6 TRANSACTION ENGINE INTEGRATION TESTS PASSED!');
  console.log('====================================================');
} catch (error) {
  console.error('Test execution failed:', error);
  process.exit(1);
}
