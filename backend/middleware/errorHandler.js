/**
 * Centralized error handling middleware for UPKOTHA Backend.
 * Ensures security: never exposes internal stack traces or API keys to the client.
 * Returns user-friendly Bangla messages for common failure scenarios.
 */

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `অনুরোধকৃত পথটি পাওয়া যায়নি: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error(`[UPKOTHA ERROR] ${req.method} ${req.url}:`, err.message || err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Friendly Bangla error resolution based on error type
  let friendlyBanglaMessage = 'একটি অনাকাঙ্ক্ষিত সমস্যা দেখা দিয়েছে। কিছুক্ষণ পর পুনরায় চেষ্টা করুন।';

  if (err.message && err.message.includes('INSUFFICIENT_BALANCE')) {
    friendlyBanglaMessage = 'আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।';
  } else if (err.message && err.message.includes('LOCKED_MONEY_CONFLICT')) {
    friendlyBanglaMessage = 'এই পরিমাণ টাকা আপনার জরুরি সঞ্চয়ে লক করা রয়েছে। অন্য ব্যালেন্স ব্যবহার করুন।';
  } else if (err.message && err.message.includes('INVALID_PIN')) {
    friendlyBanglaMessage = 'ভুল পিন কোড দেওয়া হয়েছে। অনুগ্রহ করে সঠিক ৪ ডিজিটের পিন দিন।';
  } else if (err.message && err.message.includes('INVALID_RECIPIENT')) {
    friendlyBanglaMessage = 'প্রাপকের তথ্য সঠিক নয় অথবা পাওয়া যায়নি।';
  } else if (err.message && err.message.includes('INVALID_AGENT')) {
    friendlyBanglaMessage = 'উক্ত এজেন্ট পাওয়া যায়নি। সঠিক এজেন্ট নির্বাচন করুন।';
  } else if (err.name === 'ValidationError') {
    friendlyBanglaMessage = 'প্রদত্ত তথ্যে ভুল রয়েছে। অনুগ্রহ করে তথ্য পুনরায় যাচাই করুন।';
  }

  res.status(statusCode).json({
    success: false,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.customMessage || friendlyBanglaMessage,
    timestamp: new Date().toISOString(),
  });
};
