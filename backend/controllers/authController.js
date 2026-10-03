import db from '../dataStore.js';

export const login = (req, res) => {
  const { phone, pin } = req.body;

  if (!phone || !pin) {
    return res.status(400).json({
      success: false,
      message: 'মোবাইল নম্বর এবং পিন আবশ্যক।',
    });
  }

  // Find user by phone and PIN
  const users = db.getAll('users');
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  
  let user = null;
  if (cleanPhone) {
    user = users.find(u => {
      const userClean = u.phone ? u.phone.replace(/\D/g, '') : '';
      return userClean === cleanPhone && String(u.pin) === String(pin);
    });
  } else {
    user = users.find(u => String(u.pin) === String(pin));
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'ভুল মোবাইল নম্বর বা গোপন পিন কোড দেওয়া হয়েছে।',
    });
  }

  const contacts = db.getAll('contacts').filter(c => c.userId === user.id);

  res.json({
    success: true,
    message: `স্বাগতম, ${user.name}!`,
    user: {
      ...user,
      contacts,
    },
  });
};

export const register = (req, res) => {
  const { name, phone, pin } = req.body;

  if (!name || !phone || !pin) {
    return res.status(400).json({
      success: false,
      message: 'নাম, মোবাইল নম্বর এবং পিন আবশ্যক।',
    });
  }

  const cleanPhone = phone.trim();
  const userId = `usr_${Date.now()}`;

  // New registered user gets ৳15,000 available balance, ৳0 locked balance
  const newUser = {
    id: userId,
    name: name.trim(),
    phone: cleanPhone,
    pin: pin.trim(),
    availableBalance: 15000,
    lockedBalance: 0,
    totalBalance: 15000,
    currency: 'BDT',
    isStrictMode: false,
    accountType: 'Personal',
    kycVerified: true,
    registeredAt: new Date().toISOString(),
    isNewAccount: true,
    voiceProfile: {
      isEnrolled: false,
      voiceprintId: `vp_${userId}`,
      primarySpeaker: name.trim(),
      fundamentalFrequencyHz: null,
      pitchRangeHz: [100, 260],
      spectralCentroidHz: 1800,
      speakingRateWpm: 130,
      sampleCount: 0,
      securityThreshold: 0.85,
      antiSpoofEnabled: true,
    },
  };

  db.insert('users', newUser);

  res.json({
    success: true,
    message: `স্বাগতম, ${name.trim()}! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।`,
    user: {
      ...newUser,
      contacts: [],
    },
  });
};

export const getProfile = (req, res) => {
  const user = req.user;
  const contacts = db.getAll('contacts').filter(c => c.userId === user.id);
  const activeLocks = db.getActiveLocks(user.id);

  res.json({
    success: true,
    user: {
      ...user,
      contacts,
      activeLocksCount: activeLocks.length,
    },
  });
};
