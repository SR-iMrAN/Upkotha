import db from '../dataStore.js';

/**
 * Authentication middleware for demo prototype.
 * Resolves active user from 'x-user-id' header or defaults to demo user Imran.
 */
export const requireAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'] || 'usr_imran_001';
  const user = db.getUser(userId);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'অননুমোদিত অনুরোধ। অনুগ্রহ করে প্রথমে লগইন করুন।',
    });
  }

  req.user = user;
  next();
};
