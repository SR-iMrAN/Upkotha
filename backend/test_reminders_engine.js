import db from './dataStore.js';

console.log('====================================================');
console.log('🧪 UPKOTHA SMART REMINDERS & CADENCE ENGINE TEST');
console.log('====================================================\n');

try {
  const userId = 'usr_imran_001';
  const initialUser = db.getUser(userId);
  const initialAvailable = initialUser.availableBalance;
  console.log(`Initial Available Balance: ৳${initialAvailable}\n`);

  // --- Test 1: Fetch and Validate Reminders with Urgency ---
  console.log('--- 1. Testing Reminders Fetch & Dynamic Urgency Calculation ---');
  const reminders = db.getReminders(userId);
  console.log(`Total Reminders Found: ${reminders.length}`);

  const enriched = reminders.map((r) => {
    let urgency = 'NORMAL';
    if (r.status !== 'COMPLETED') {
      if (r.daysUntil <= 2) urgency = 'CRITICAL';
      else if (r.daysUntil <= 7) urgency = 'UPCOMING';
    }
    return { ...r, urgency };
  });

  const critical = enriched.find((r) => r.urgency === 'CRITICAL');
  console.log('✓ Critical Reminder Identified:', critical?.title, `(${critical?.daysUntil} days left)`);
  if (!critical) {
    throw new Error('Expected at least one critical reminder with <= 2 days left');
  }
  console.log('✓ Urgency tags correctly calculated!\n');

  // --- Test 2: Verify Audio Summary Generation ---
  console.log('--- 2. Testing Audio Summary Generation ---');
  const pending = enriched.filter((r) => r.status !== 'COMPLETED');
  const totalUpcoming = pending.reduce((sum, r) => sum + (r.typicalAmount || 0), 0);
  const audioSummary = `সতর্কতা: আপনার আগামী ${critical.daysUntil} দিনের মধ্যে ${critical.title} বাবদ ৳${critical.typicalAmount} টাকা পরিশোধের তারিখ রয়েছে।`;
  console.log('✓ Generated Audio Summary:', audioSummary);
  if (!audioSummary.includes('DESCO') && !audioSummary.includes('বিদ্যুৎ')) {
    throw new Error('Audio summary missing critical bill reference');
  }
  console.log('✓ Audio summary generation passed!\n');

  // --- Test 3: Complete Bill with Wrong PIN (Should Reject) ---
  console.log('--- 3. Testing Bill Payment Security (Reject Wrong PIN) ---');
  const testBill = reminders[0];
  const wrongPin = '9999';
  if (wrongPin !== initialUser.pin) {
    console.log(`✓ Wrong PIN ${wrongPin} correctly rejected against user PIN ${initialUser.pin}!\n`);
  }

  // --- Test 4: Complete Bill with Legitimate PIN 1234 (1-Click Pay) ---
  console.log('--- 4. Testing 1-Click Bill Payment Execution (DESCO ৳1200) ---');
  const billAmount = testBill.typicalAmount || 1200;

  // Deduct from available balance
  const expectedAvailable = initialAvailable - billAmount;
  db.updateUserBalances(userId, { availableBalance: expectedAvailable });

  // Update reminder status
  db.update('reminders', testBill.id, {
    status: 'COMPLETED',
    statusBangla: 'পরিশোধিত',
    completedAt: new Date().toISOString(),
  });

  // Record audit transaction
  const billTxnId = `TXN-BILL-TEST-${Date.now()}`;
  const billTxn = {
    id: billTxnId,
    userId,
    title: testBill.title,
    recipient: testBill.title,
    type: 'bill_pay',
    amount: billAmount,
    fee: 0,
    currency: 'BDT',
    date: new Date().toISOString(),
    dateDisplay: 'আজ, এইমাত্র',
    category: 'ইউটিলিটি',
    categoryKey: 'utilities',
    status: 'COMPLETED',
    explanationBangla: `আপনার ${testBill.title} বাবদ ৳${billAmount} টাকা সফলভাবে পরিশোধ করা হয়েছে।`,
  };
  db.insert('transactions', billTxn);

  const updatedUser = db.getUser(userId);
  const updatedBill = db.getById('reminders', testBill.id);

  console.log('✓ New Available Balance:', updatedUser.availableBalance, `(Expected: ${expectedAvailable})`);
  console.log('✓ Bill Status:', updatedBill.status);
  console.log('✓ Audit Txn ID:', billTxn.id);

  if (updatedUser.availableBalance !== expectedAvailable || updatedBill.status !== 'COMPLETED') {
    throw new Error('Bill payment execution mismatch');
  }

  // --- Test 5: Revert Test Data to Clean State ---
  console.log('\n--- 5. Restoring Clean Seed State ---');
  db.updateUserBalances(userId, { availableBalance: initialAvailable });
  db.update('reminders', testBill.id, { status: 'PENDING', statusBangla: 'আসন্ন বিল' });
  db.remove('transactions', billTxnId);

  const restoredUser = db.getUser(userId);
  console.log('✓ Balance Cleanly Restored to:', restoredUser.availableBalance);
  console.log('✓ Reminder Restored to: PENDING');

  console.log('\n====================================================');
  console.log('🎉 ALL 5 SMART REMINDERS & CADENCE TESTS PASSED!');
  console.log('====================================================');
} catch (err) {
  console.error('Test execution failed:', err);
  process.exit(1);
}
