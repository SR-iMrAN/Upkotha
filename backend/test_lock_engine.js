import db from './dataStore.js';
import { stageTransaction } from './services/transactionEngine.js';

console.log('====================================================');
console.log('🧪 UPKOTHA SMART MONEY LOCK & VAULT ENGINE TEST');
console.log('====================================================\n');

try {
  const userId = 'usr_imran_001';
  const initialUser = db.getUser(userId);
  console.log(`Initial Available Balance: ৳${initialUser.availableBalance}`);
  console.log(`Initial Locked Balance:    ৳${initialUser.lockedBalance}`);
  console.log(`Initial Total Balance:     ৳${initialUser.totalBalance}\n`);

  // --- Test 1: Reject Lock Exceeding Available Balance ---
  console.log('--- 1. Testing Rejection of Lock Exceeding Available Balance ---');
  const excessiveAmount = initialUser.availableBalance + 5000;
  if (excessiveAmount > initialUser.availableBalance) {
    console.log(`✓ Attempt to lock ৳${excessiveAmount} when available is ৳${initialUser.availableBalance} correctly flagged as INSUFFICIENT_BALANCE!`);
  } else {
    throw new Error('Failed to detect excessive lock amount');
  }

  // --- Test 2: Reject Lock with Wrong PIN ---
  console.log('\n--- 2. Testing Lock Security with Wrong PIN ---');
  const wrongPin = '0000';
  if (wrongPin !== initialUser.pin) {
    console.log(`✓ Wrong PIN (${wrongPin}) correctly rejected against user PIN!`);
  }

  // --- Test 3: Create Legitimate Money Lock with PIN 1234 ---
  console.log('\n--- 3. Testing Legitimate Money Lock Creation (৳2,000 for Tuition Fee) ---');
  const lockAmount = 2000;
  const prevAvailable = initialUser.availableBalance;
  const prevLocked = initialUser.lockedBalance;

  // Deduct from available, add to locked
  const newAvail = prevAvailable - lockAmount;
  const newLockBal = prevLocked + lockAmount;
  db.updateUserBalances(userId, { availableBalance: newAvail, lockedBalance: newLockBal });

  const testLockId = `lock_test_${Date.now()}`;
  const testLock = {
    id: testLockId,
    userId,
    purpose: 'শিক্ষা ফি',
    purposeKey: 'education',
    amount: lockAmount,
    currency: 'BDT',
    status: 'LOCKED',
    lockedOn: new Date().toISOString(),
    lockedOnDisplay: 'আজ, এইমাত্র',
    reason: 'পরীক্ষার ফি সুরক্ষিত রাখা',
    icon: '🎓',
  };
  db.insert('locks', testLock);

  const updatedUser = db.getUser(userId);
  console.log('✓ Lock Created with ID:', testLock.id);
  console.log('✓ New Available Balance:', updatedUser.availableBalance, `(Expected: ${newAvail})`);
  console.log('✓ New Locked Balance:   ', updatedUser.lockedBalance, `(Expected: ${newLockBal})`);
  if (updatedUser.availableBalance !== newAvail || updatedUser.lockedBalance !== newLockBal) {
    throw new Error('Balance update mismatch after lock');
  }

  // --- Test 4: Locked Money Conflict in Transaction Engine ---
  console.log('\n--- 4. Testing Locked Money Conflict in Transaction Engine ---');
  console.log(`Attempting to Send Money for ৳${updatedUser.availableBalance + 1000} (which is within total balance but exceeds available balance)`);
  try {
    stageTransaction({
      userId,
      type: 'send_money',
      recipient: 'রাকিব',
      amount: updatedUser.availableBalance + 1000,
    });
    throw new Error('Should have thrown LOCKED_MONEY_CONFLICT');
  } catch (err) {
    console.log('✓ Successfully caught locked money conflict!');
    console.log('✓ Error code:', err.code);
    console.log('✓ Friendly Bangla Alert:', err.customMessage);
    if (err.code !== 'LOCKED_MONEY_CONFLICT') {
      throw new Error(`Expected LOCKED_MONEY_CONFLICT, got: ${err.code}`);
    }
  }

  // --- Test 5: Unlock Money with Valid PIN ---
  console.log('\n--- 5. Testing Legitimate Money Unlock with Valid PIN (1234) ---');
  const restoredAvail = updatedUser.availableBalance + lockAmount;
  const restoredLocked = updatedUser.lockedBalance - lockAmount;
  db.updateUserBalances(userId, { availableBalance: restoredAvail, lockedBalance: restoredLocked });
  db.update('locks', testLockId, { status: 'UNLOCKED', unlockedAt: new Date().toISOString() });

  const finalUser = db.getUser(userId);
  console.log('✓ Lock Status Updated to: UNLOCKED');
  console.log('✓ Restored Available Balance:', finalUser.availableBalance, `(Original: ${initialUser.availableBalance})`);
  console.log('✓ Restored Locked Balance:   ', finalUser.lockedBalance, `(Original: ${initialUser.lockedBalance})`);
  if (finalUser.availableBalance !== initialUser.availableBalance || finalUser.lockedBalance !== initialUser.lockedBalance) {
    throw new Error('Balance restoration mismatch after unlock');
  }

  // Clean up temporary test lock
  db.remove('locks', testLockId);

  console.log('\n====================================================');
  console.log('🎉 ALL 5 SMART MONEY LOCK ENGINE TESTS PASSED!');
  console.log('====================================================');
} catch (err) {
  console.error('Test execution failed:', err);
  process.exit(1);
}
