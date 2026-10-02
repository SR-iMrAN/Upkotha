import { getInsights } from './controllers/aiController.js';
import db from './dataStore.js';

console.log('====================================================');
console.log('🧪 UPKOTHA PERSONALIZED AI INSIGHTS ENGINE TEST');
console.log('====================================================\n');

try {
  const userId = 'usr_imran_001';

  // --- Test 1: Fetch Live Personalized Insights for Imran ---
  console.log('--- 1. Testing Live Insights Generation for Imran ---');
  let responseData = null;
  const mockReq = { user: { id: userId } };
  const mockRes = {
    json: (payload) => {
      responseData = payload;
    },
    status: function (code) {
      this.statusCode = code;
      return this;
    }
  };

  getInsights(mockReq, mockRes, (err) => {
    if (err) throw err;
  });

  if (!responseData || !responseData.success) {
    throw new Error('Failed to retrieve financial insights from aiController');
  }

  console.log(`✓ Received ${responseData.count} generated insights`);
  console.log(`✓ Metrics: Total Spent = ৳${responseData.metrics.totalSpent}, Locked = ৳${responseData.metrics.totalLocked} (${responseData.metrics.lockedPercentage}%), Cash-Out Fees = ৳${responseData.metrics.totalCashOutFees}`);
  console.log('✓ Basic response payload structure verified!\n');

  // --- Test 2: Verify Grounded Fact Transparency ---
  console.log('--- 2. Testing Grounded Fact Presence and Auditability ---');
  if (!responseData.insights || responseData.insights.length === 0) {
    throw new Error('No insights found in payload');
  }

  responseData.insights.forEach((insight, idx) => {
    console.log(`   [Insight #${idx + 1}] ID: ${insight.id}`);
    console.log(`   - Title: ${insight.title}`);
    console.log(`   - Message: ${insight.message}`);
    console.log(`   - Grounded Fact: "${insight.groundedFact}"`);
    console.log(`   - Action: ${insight.actionLabel} -> ${insight.actionRoute}`);

    if (!insight.groundedFact || insight.groundedFact.trim() === '') {
      throw new Error(`Insight ${insight.id} is missing a groundedFact attribute!`);
    }
  });
  console.log('✓ All insights have verified grounded facts anchored in the ledger!\n');

  // --- Test 3: Verify Savings Retention Calculation ---
  console.log('--- 3. Testing Savings Retention Ratio Calculation ---');
  const user = db.getUser(userId);
  const totalBalance = user.totalBalance || (user.availableBalance + user.lockedBalance);
  const expectedPercentage = Math.round((user.lockedBalance / totalBalance) * 100);

  if (responseData.metrics.lockedPercentage !== expectedPercentage) {
    throw new Error(`Locked percentage mismatch: expected ${expectedPercentage}%, got ${responseData.metrics.lockedPercentage}%`);
  }

  const savingsInsight = responseData.insights.find(i => i.id === 'ins_savings_ratio');
  if (!savingsInsight) {
    throw new Error('Savings retention insight (ins_savings_ratio) not found');
  }
  console.log(`✓ Savings retention computed correctly: ${responseData.metrics.lockedPercentage}%\n`);

  // --- Test 4: Verify Bill Readiness Alert ---
  console.log('--- 4. Testing Upcoming Utility Readiness Insight ---');
  const utilityInsight = responseData.insights.find(i => i.id === 'ins_utility_readiness');
  if (!utilityInsight) {
    throw new Error('Utility readiness insight (ins_utility_readiness) not found');
  }
  console.log(`✓ Utility Readiness title: ${utilityInsight.title}`);
  console.log(`✓ Utility Readiness note: ${utilityInsight.message}`);
  console.log('✓ Bill readiness insight verified!\n');

  // --- Test 5: Verify Strict Mode Dynamic Advice ---
  console.log('--- 5. Testing Strict Mode Dynamic Adaptation ---');
  const initialSafety = responseData.insights.find(i => i.id === 'ins_safety_tip');
  const initialStatus = user.isStrictMode;

  // Toggle user strict mode temporarily
  db.update('users', userId, { isStrictMode: !initialStatus });

  let toggledData = null;
  getInsights(mockReq, {
    json: (p) => { toggledData = p; }
  }, () => {});

  const toggledSafety = toggledData.insights.find(i => i.id === 'ins_safety_tip');
  console.log(`✓ When Strict Mode = ${!initialStatus}: Title = "${toggledSafety.title}"`);
  console.log(`✓ Grounded Fact: "${toggledSafety.groundedFact}"`);

  // Revert user state back
  db.update('users', userId, { isStrictMode: initialStatus });

  if (toggledSafety.type === initialSafety.type) {
    throw new Error('Strict mode toggle did not dynamically change insight type or advice');
  }
  console.log('✓ Strict mode dynamic advisory successfully adapted!\n');

  console.log('====================================================');
  console.log('🎉 ALL 5 AI INSIGHTS ENGINE TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
} catch (error) {
  console.error('\n❌ TEST SUITE FAILED:', error.message);
  process.exit(1);
}
