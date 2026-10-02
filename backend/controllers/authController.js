import db from '../dataStore.js';

export const login = (req, res) => {
  const { phone, pin } = req.body;

  if (!phone || !pin) {
    return res.status(400).json({
      success: false,
      message: 'মোবাইল নম্বর এবং পিন আবশ্যক।',
    });
  }

  // Demo user Imran verification
  const users = db.getAll('users');
  const user = users.find(u => u.pin === pin);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'ভুল পিন কোড দেওয়া হয়েছে। ডেমো পিন: 1234',
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
