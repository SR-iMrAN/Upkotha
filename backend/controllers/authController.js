import db from '../dataStore.js';

function normalizeDigits(str) {
  if (!str) return '';
  const bnToEn = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };
  return String(str).replace(/[০-৯]/g, (d) => bnToEn[d] || d);
}

function normalizePhone(str) {
  if (!str) return '';
  const normalized = normalizeDigits(str).replace(/\D/g, '');
  if (normalized.startsWith('880')) return normalized.slice(2);
  if (normalized.startsWith('88')) return normalized.slice(2);
  return normalized;
}

export const login = (req, res) => {
  const { phone, pin } = req.body;

  if (!phone || !pin) {
    return res.status(400).json({
      success: false,
      message: 'মোবাইল নম্বর এবং পিন আবশ্যক।',
    });
  }

  // Find user by normalized phone and PIN
  const users = db.getAll('users');
  const cleanPhone = normalizePhone(phone);
  const cleanPin = normalizeDigits(pin).trim();
  
  let user = null;
  if (cleanPhone) {
    user = users.find(u => {
      const userPhone = normalizePhone(u.phone);
      const userPin = normalizeDigits(u.pin).trim();
      return userPhone === cleanPhone && userPin === cleanPin;
    });
  } else {
    user = users.find(u => normalizeDigits(u.pin).trim() === cleanPin);
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

  const cleanPhone = normalizePhone(phone);
  const cleanPin = normalizeDigits(pin).trim();
  const users = db.getAll('users');

  // Check if an existing account with this phone already exists
  const existingUser = users.find(u => normalizePhone(u.phone) === cleanPhone);
  if (existingUser) {
    existingUser.name = name.trim();
    existingUser.pin = cleanPin;
    db.save('users');
    return res.json({
      success: true,
      message: `স্বাগতম, ${name.trim()}! আপনার অ্যাকাউন্ট সফলভাবে সংরক্ষিত হয়েছে।`,
      user: {
        ...existingUser,
        contacts: db.getAll('contacts').filter(c => c.userId === existingUser.id),
      },
    });
  }

  const userId = `usr_${Date.now()}`;

  // New registered user gets ৳15,000 available balance, ৳0 locked balance
  const newUser = {
    id: userId,
    name: name.trim(),
    phone: cleanPhone,
    pin: cleanPin,
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
