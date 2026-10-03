import db from '../dataStore.js';

/**
 * Authentication middleware for demo prototype.
 * Resolves active user from 'x-user-id' header or defaults to demo user Imran.
 */
export const requireAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'] || 'usr_imran_001';
  let user = db.getUser(userId);

  // In serverless environments (Vercel), stateless lambda containers may receive a valid client-registered user ID.
  // Resolve or initialize the session user in-memory so 401 never blocks the client.
  if (!user && userId) {
    const rawName = req.headers['x-user-name'];
    const clientName = rawName ? decodeURIComponent(rawName) : 'গ্রাহক';
    const clientPhone = req.headers['x-user-phone'] || '01700-000000';
    user = {
      id: userId,
      name: clientName,
      phone: clientPhone,
      availableBalance: 15000,
      lockedBalance: 0,
      totalBalance: 15000,
      role: 'USER',
      isStrictMode: false,
      voiceProfile: {
        isEnrolled: true,
        primarySpeaker: clientName,
        pitchRangeHz: [120, 180],
        fundamentalFrequencyHz: 145,
      },
    };
    db.insert('users', user);
  }

  if (!user) {
    user = db.getUser('usr_imran_001');
  }

  req.user = user;
  next();
};
