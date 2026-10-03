/**
 * Centralized error handling middleware for UPKOTHA Backend.
 * Ensures security: never exposes internal stack traces or API keys to the client.
 * Returns empathetic, plain-Bangla messages and clear recovery suggestions.
 */

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `অনুরোধকৃত পথটি পাওয়া যায়নি: ${req.method} ${req.originalUrl}`,
    recoverySuggestion: 'অনুগ্রহ করে লিঙ্ক বা এপিআই রুটটি পুনরায় যাচাই করুন।',
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error(`[UPKOTHA ERROR] ${req.method} ${req.url}:`, err.message || err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Friendly Bangla error resolution based on error type
  let friendlyBanglaMessage = 'একটি সাময়িক কারিগরি সমস্যা দেখা দিয়েছে। আপনার অর্থ ও ব্যালেন্স সম্পূর্ণ সুরক্ষিত রয়েছে।';
  let recoverySuggestion = 'কিছুক্ষণ পর পুনরায় চেষ্টা করুন অথবা অ্যাপটি রিফ্রেশ করুন।';

  if (err.message && err.message.includes('INSUFFICIENT_BALANCE')) {
    friendlyBanglaMessage = 'আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।';
    recoverySuggestion = 'টাকার পরিমাণ কমিয়ে চেষ্টা করুন অথবা ক্যাশ ইন করুন।';
  } else if (err.message && err.message.includes('LOCKED_MONEY_CONFLICT')) {
    friendlyBanglaMessage = 'এই পরিমাণ টাকা আপনার জরুরি সঞ্চয়ে স্মার্ট মানি লকে সুরক্ষিত রয়েছে।';
    recoverySuggestion = 'মানি লক পেজে গিয়ে লক করা অর্থ আনলক করুন অথবা অবশিষ্ট উপলব্ধ ব্যালেন্স ব্যবহার করুন।';
  } else if (err.message && err.message.includes('INVALID_PIN')) {
    friendlyBanglaMessage = 'ভুল পিন কোড দেওয়া হয়েছে। লেনদেন সম্পন্ন করা যায়নি।';
    recoverySuggestion = 'অনুগ্রহ করে আপনার সঠিক ৪ ডিজিটের গোপন পিন নম্বর প্রদান করুন (ডেমো পিন: 1234)।';
  } else if (err.message && err.message.includes('INVALID_RECIPIENT')) {
    friendlyBanglaMessage = 'প্রাপকের তথ্য সঠিক নয় অথবা পাওয়া যায়নি।';
    recoverySuggestion = 'প্রাপকের ১১ ডিজিটের মোবাইল নম্বর সঠিক রয়েছে কিনা মিলিয়ে নিন।';
  } else if (err.message && err.message.includes('INVALID_AGENT')) {
    friendlyBanglaMessage = 'উক্ত এজেন্ট পাওয়া যায়নি। সঠিক এজেন্ট নির্বাচন করুন।';
    recoverySuggestion = 'নিকটস্থ অনুমোদিত এজেন্ট পয়েন্ট নির্বাচন করুন।';
  } else if (err.code === 'AMOUNT_EXCEEDS_MAXIMUM') {
    friendlyBanglaMessage = 'একক লেনদেনের সর্বোচ্চ সীমা অতিক্রম করেছে।';
    recoverySuggestion = 'একক লেনদেনে সর্বোচ্চ ২৫,০০০ টাকা পাঠানো সম্ভব।';
  } else if (err.code === 'AMOUNT_BELOW_MINIMUM') {
    friendlyBanglaMessage = 'সর্বনিম্ন লেনদেনের পরিমাণ ১০ টাকা।';
    recoverySuggestion = '১০ টাকা বা তার বেশি অঙ্ক প্রদান করুন।';
  } else if (err.name === 'ValidationError') {
    friendlyBanglaMessage = 'প্রদত্ত তথ্যে অসামঞ্জস্য রয়েছে।';
    recoverySuggestion = 'ইনপুট ফিল্ডের তথ্য পুনরায় যাচাই করুন।';
  }

  res.status(statusCode).json({
    success: false,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.customMessage || friendlyBanglaMessage,
    recoverySuggestion: err.recoverySuggestion || recoverySuggestion,
    timestamp: new Date().toISOString(),
  });
};
