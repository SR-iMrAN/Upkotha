import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { executeSendMoney } from './controllers/transactionController.js';
import db from './dataStore.js';

console.log('====================================================');
console.log('🧪 UPKOTHA ERROR HANDLING & RESILIENCE ENGINE TEST');
console.log('====================================================\n');

try {
  const createMock = (body = {}) => {
    let statusCode = 200;
    let responseData = null;
    const req = {
      method: 'POST',
      url: '/api/transactions/test',
      originalUrl: '/api/transactions/test',
      user: { id: 'usr_imran_001', availableBalance: 13500, lockedBalance: 5000 },
      body,
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

  // --- Test 1: 404 Route Not Found Recovery Envelope ---
  console.log('--- 1. Testing 404 Graceful Error Envelope & Recovery Guidance ---');
  const mock404 = createMock();
  notFoundHandler(mock404.req, mock404.res);
  const data404 = mock404.getData();

  console.log(`✓ Status Code: ${mock404.getStatus()}`);
  console.log(`✓ Error Code: ${data404.error}`);
  console.log(`✓ Message: "${data404.message}"`);
  console.log(`✓ Recovery: "${data404.recoverySuggestion}"`);

  if (mock404.getStatus() !== 404 || !data404.recoverySuggestion) {
    throw new Error('404 error envelope missing recoverySuggestion');
  }
  console.log('✓ 404 recovery envelope passed!\n');

  // --- Test 2: Insufficient Balance Error Handling ---
  console.log('--- 2. Testing Insufficient Balance Graceful Recovery ---');
  const mockBal = createMock();
  const balErr = new Error('INSUFFICIENT_BALANCE');
  balErr.statusCode = 400;
  balErr.code = 'INSUFFICIENT_BALANCE';

  errorHandler(balErr, mockBal.req, mockBal.res, () => {});
  const dataBal = mockBal.getData();

  console.log(`✓ Status Code: ${mockBal.getStatus()}`);
  console.log(`✓ Error Code: ${dataBal.error}`);
  console.log(`✓ Friendly Message: "${dataBal.message}"`);
  console.log(`✓ Recovery Suggestion: "${dataBal.recoverySuggestion}"`);

  if (!dataBal.message.includes('পর্যাপ্ত ব্যালেন্স') || !dataBal.recoverySuggestion.includes('ক্যাশ ইন')) {
    throw new Error('Insufficient balance error message or recovery failed');
  }
  console.log('✓ Insufficient balance recovery passed!\n');

  // --- Test 3: Invalid PIN Error Handling ---
  console.log('--- 3. Testing Invalid PIN Error Recovery ---');
  const mockPin = createMock();
  const pinErr = new Error('INVALID_PIN');
  pinErr.statusCode = 401;
  pinErr.code = 'INVALID_PIN';

  errorHandler(pinErr, mockPin.req, mockPin.res, () => {});
  const dataPin = mockPin.getData();

  console.log(`✓ Status Code: ${mockPin.getStatus()}`);
  console.log(`✓ Friendly Message: "${dataPin.message}"`);
  console.log(`✓ Recovery Suggestion: "${dataPin.recoverySuggestion}"`);

  if (!dataPin.message.includes('পিন') || !dataPin.recoverySuggestion.includes('1234')) {
    throw new Error('Invalid PIN guidance failed');
  }
  console.log('✓ Invalid PIN recovery guidance passed!\n');

  // --- Test 4: Locked Money Conflict Error Handling ---
  console.log('--- 4. Testing Locked Money Conflict Graceful Recovery ---');
  const mockLock = createMock();
  const lockErr = new Error('LOCKED_MONEY_CONFLICT');
  lockErr.statusCode = 400;
  lockErr.code = 'LOCKED_MONEY_CONFLICT';

  errorHandler(lockErr, mockLock.req, mockLock.res, () => {});
  const dataLock = mockLock.getData();

  console.log(`✓ Friendly Message: "${dataLock.message}"`);
  console.log(`✓ Recovery Suggestion: "${dataLock.recoverySuggestion}"`);

  if (!dataLock.message.includes('স্মার্ট মানি লকে') || !dataLock.recoverySuggestion.includes('আনলক')) {
    throw new Error('Locked money recovery failed');
  }
  console.log('✓ Locked money conflict recovery passed!\n');

  // --- Test 5: Maximum Transaction Limit Exceeded ---
  console.log('--- 5. Testing Amount Exceeds Maximum Limit Error Handling ---');
  const mockMax = createMock();
  const maxErr = new Error('Amount exceeds maximum');
  maxErr.statusCode = 400;
  maxErr.code = 'AMOUNT_EXCEEDS_MAXIMUM';

  errorHandler(maxErr, mockMax.req, mockMax.res, () => {});
  const dataMax = mockMax.getData();

  console.log(`✓ Friendly Message: "${dataMax.message}"`);
  console.log(`✓ Recovery Suggestion: "${dataMax.recoverySuggestion}"`);

  if (!dataMax.recoverySuggestion.includes('২৫,০০০')) {
    throw new Error('Maximum limit recovery message failed');
  }
  console.log('✓ Maximum limit error handling passed!\n');

  console.log('====================================================');
  console.log('🎉 ALL 5 RESILIENCE & ERROR HANDLING TESTS PASSED!');
  console.log('====================================================');
} catch (error) {
  console.error('\n❌ TEST SUITE FAILED:', error.message);
  process.exit(1);
}
