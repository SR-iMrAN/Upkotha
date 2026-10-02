import {
  normalizeBengaliNumbers,
  deterministicFallbackParser,
  extractIntentWithGemini,
  explainTransactionWithGemini,
} from './services/geminiService.js';
import db from './dataStore.js';

console.log('====================================================');
console.log('🧪 UPKOTHA GEMINI & AI INTENT EXTRACTION TEST');
console.log('====================================================\n');

try {
  // Test 1: Bengali Numeral Normalization
  console.log('--- 1. Testing Bengali Numeral Normalization ---');
  const normalized = normalizeBengaliNumbers('রাকিবকে ৫০০ টাকা পাঠাও এবং মা-কে ২০০০ টাকা');
  console.log('Original: "রাকিবকে ৫০০ টাকা পাঠাও এবং মা-কে ২০০০ টাকা"');
  console.log('Normalized:', normalized);
  if (!normalized.includes('500') || !normalized.includes('2000')) {
    throw new Error('Numeral normalization failed');
  }
  console.log('✓ Numeral normalization passed!\n');

  // Test 2: Fallback Intent Extraction - Send Money
  console.log('--- 2. Testing Send Money Intent Extraction ---');
  const sendIntent = deterministicFallbackParser('রাকিবকে ৫০০ টাকা পাঠাও', 'dashboard');
  console.log('Intent:', sendIntent.intent);
  console.log('Recipient:', sendIntent.entities.recipient);
  console.log('Amount:', sendIntent.entities.amount, sendIntent.entities.currency);
  console.log('Requires Confirmation:', sendIntent.requiresConfirmation);
  console.log('Reply Bangla:', sendIntent.replyTextBangla);
  if (sendIntent.intent !== 'send_money' || sendIntent.entities.recipient !== 'রাকিব' || sendIntent.entities.amount !== 500) {
    throw new Error('Send money intent test failed');
  }
  console.log('✓ Send money intent passed!\n');

  // Test 3: Fallback Intent Extraction - Cash Out
  console.log('--- 3. Testing Cash Out Intent Extraction ---');
  const cashIntent = deterministicFallbackParser('রহিম স্টোর থেকে ২০০০ টাকা cash out করতে চাই', 'cash_out');
  console.log('Intent:', cashIntent.intent);
  console.log('Agent:', cashIntent.entities.agent);
  console.log('Amount:', cashIntent.entities.amount);
  if (cashIntent.intent !== 'cash_out' || cashIntent.entities.agent !== 'রহিম স্টোর' || cashIntent.entities.amount !== 2000) {
    throw new Error('Cash out intent test failed');
  }
  console.log('✓ Cash out intent passed!\n');

  // Test 4: Check Balance
  console.log('--- 4. Testing Check Balance Intent Extraction ---');
  const balIntent = deterministicFallbackParser('আমার balance কত?', 'dashboard');
  console.log('Intent:', balIntent.intent);
  console.log('Reply Bangla:', balIntent.replyTextBangla);
  if (balIntent.intent !== 'check_balance') {
    throw new Error('Check balance intent test failed');
  }
  console.log('✓ Check balance intent passed!\n');

  // Test 5: Lock Money
  console.log('--- 5. Testing Lock Money Intent Extraction ---');
  const lockIntent = deterministicFallbackParser('৫০০০ টাকা emergency-এর জন্য lock করো', 'lock_money');
  console.log('Intent:', lockIntent.intent);
  console.log('Purpose:', lockIntent.entities.purpose);
  console.log('Amount:', lockIntent.entities.amount);
  if (lockIntent.intent !== 'lock_money' || lockIntent.entities.amount !== 5000) {
    throw new Error('Lock money intent test failed');
  }
  console.log('✓ Lock money intent passed!\n');

  // Test 6: Bill Reminders
  console.log('--- 6. Testing Bill Reminders Intent Extraction ---');
  const billIntent = deterministicFallbackParser('আমার পরের bill কবে?', 'reminders');
  console.log('Intent:', billIntent.intent);
  if (billIntent.intent !== 'show_reminders') {
    throw new Error('Bill reminders intent test failed');
  }
  console.log('✓ Bill reminders intent passed!\n');

  // Test 7: Transaction Explanation
  console.log('--- 7. Testing AI Transaction Explanation ---');
  const sampleTxn = db.getById('transactions', 'TXN-2026-001') || {
    id: 'TXN-2026-001',
    title: 'রাকিব (Send Money)',
    recipient: 'রাকিব',
    amount: 500,
    fee: 0,
    dateDisplay: 'আজ, ০২:১৫ অপরাহ্ন',
    category: 'ব্যক্তিগত',
    explanationBangla: 'আপনার ২ অক্টোবর রাকিবকে ৫০০ টাকা পাঠানোর লেনদেন সফল হয়েছে।',
  };
  const explanation = await explainTransactionWithGemini(sampleTxn);
  console.log('Txn ID:', sampleTxn.id);
  console.log('Explanation:', explanation);
  if (!explanation || explanation.length < 5) {
    throw new Error('Transaction explanation failed');
  }
  console.log('✓ Transaction explanation passed!\n');

  console.log('====================================================');
  console.log('🎉 ALL 7 GEMINI & AI INTENT EXTRACTION TESTS PASSED!');
  console.log('====================================================');
} catch (err) {
  console.error('Test execution failed:', err);
  process.exit(1);
}
