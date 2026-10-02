/**
 * Centralized API client for UPKOTHA Frontend.
 * Communicates with Express Backend (http://localhost:5000/api).
 * Automatically handles JSON parsing, headers, and friendly error propagation.
 */

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'usr_imran_001',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();

    if (!res.ok || data.success === false) {
      const error = new Error(data.message || 'অনুরোধটি সম্পন্ন করা যায়নি।');
      error.status = res.status;
      error.code = data.error;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.warn('[API WARNING] Backend server unreachable, falling back to local simulation mode');
      // Simulated fallback error with clear instruction
      const offlineErr = new Error('ব্যাকএন্ড সার্ভারের সাথে যোগাযোগ করা যায়নি। অনুগ্রহ করে ব্যাকএন্ড চালু করুন (npm start)।');
      offlineErr.code = 'BACKEND_OFFLINE';
      throw offlineErr;
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (phone, pin) => request('/auth/login', { method: 'POST', body: JSON.stringify({ phone, pin }) }),
  getProfile: () => request('/auth/profile'),

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Transactions
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/transactions${query ? `?${query}` : ''}`);
  },
  getTransactionById: (id) => request(`/transactions/${id}`),
  validateTransaction: (payload) => request('/transactions/validate', { method: 'POST', body: JSON.stringify(payload) }),
  sendMoney: (payload) => request('/transactions/send', { method: 'POST', body: JSON.stringify(payload) }),
  cashOut: (payload) => request('/transactions/cashout', { method: 'POST', body: JSON.stringify(payload) }),
  explainTransaction: (id) => request(`/transactions/${id}/explain`, { method: 'POST' }),

  // Locks
  getLocks: () => request('/lock'),
  createLock: (payload) => request('/lock', { method: 'POST', body: JSON.stringify(payload) }),
  unlockMoney: (id, payload = {}) => request(`/lock/${id}/unlock`, { method: 'POST', body: JSON.stringify(payload) }),

  // Reminders
  getReminders: () => request('/reminders'),
  completeReminder: (id, payload = {}) => request(`/reminders/${id}/complete`, { method: 'POST', body: JSON.stringify(payload) }),

  // AI & Voice
  extractIntent: (userText, page, action) => request('/ai/intent', { method: 'POST', body: JSON.stringify({ userText, page, action }) }),
  getInsights: () => request('/ai/insights', { method: 'POST' }),
  verifyVoice: (payload) => request('/voice/verify', { method: 'POST', body: JSON.stringify(payload) }),
};

export default api;
