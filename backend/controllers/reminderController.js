import db from '../dataStore.js';

export const getReminders = (req, res) => {
  const userId = req.user.id;
  const reminders = db.getReminders(userId);

  res.json({
    success: true,
    count: reminders.length,
    reminders,
  });
};

export const completeReminder = (req, res) => {
  const { id } = req.params;
  const reminder = db.getById('reminders', id);

  if (!reminder) {
    return res.status(404).json({
      success: false,
      error: 'REMINDER_NOT_FOUND',
      message: 'নির্দিষ্ট রিমাইন্ডারটি পাওয়া যায়নি।',
    });
  }

  const updated = db.update('reminders', id, {
    status: 'COMPLETED',
    statusBangla: 'সম্পন্ন',
    completedAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `${reminder.title} সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে।`,
    reminder: updated,
  });
};
