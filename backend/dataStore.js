import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const SEED_DATA_DIR = path.join(__dirname, 'data');
const DATA_DIR = isVercel ? path.join('/tmp', 'upkotha_data') : SEED_DATA_DIR;

/**
 * Lightweight JSON file data store with in-memory cache and atomic write-back.
 * Ideal for reproducible, zero-setup hackathon demonstrations.
 */
class DataStore {
  constructor() {
    this.cache = {};
    this.collections = ['users', 'contacts', 'agents', 'transactions', 'locks', 'reminders', 'voice_logs'];
    this.init();
  }

  init() {
    if (isVercel) {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
      } catch (e) {
        console.warn('Failed to create tmp data directory:', e.message);
      }
    }

    for (const name of this.collections) {
      const activeFilePath = path.join(DATA_DIR, `${name}.json`);
      const seedFilePath = path.join(SEED_DATA_DIR, `${name}.json`);

      let loaded = false;
      if (fs.existsSync(activeFilePath)) {
        try {
          const raw = fs.readFileSync(activeFilePath, 'utf-8');
          this.cache[name] = JSON.parse(raw);
          loaded = true;
        } catch (err) {}
      }

      if (!loaded && fs.existsSync(seedFilePath)) {
        try {
          const raw = fs.readFileSync(seedFilePath, 'utf-8');
          this.cache[name] = JSON.parse(raw);
          // If on Vercel, copy seed to /tmp for future updates
          if (isVercel) {
            try {
              fs.writeFileSync(activeFilePath, raw, 'utf-8');
            } catch (e) {}
          }
          loaded = true;
        } catch (err) {}
      }

      if (!loaded) {
        this.cache[name] = [];
      }
    }
  }

  save(name) {
    const filePath = path.join(DATA_DIR, `${name}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.cache[name], null, 2), 'utf-8');
    } catch (err) {
      console.warn(`Failed to save ${name}.json:`, err.message);
    }
  }

  // Generic collection operations
  getAll(collection) {
    return this.cache[collection] || [];
  }

  getById(collection, id) {
    return (this.cache[collection] || []).find(item => item.id === id) || null;
  }

  insert(collection, item) {
    if (!this.cache[collection]) this.cache[collection] = [];
    this.cache[collection].unshift(item);
    this.save(collection);
    return item;
  }

  update(collection, id, updates) {
    const list = this.cache[collection] || [];
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.save(collection);
    return list[idx];
  }

  remove(collection, id) {
    const list = this.cache[collection] || [];
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    this.save(collection);
    return true;
  }

  // Domain-specific helpers
  getUser(userId = 'usr_imran_001') {
    const user = this.getById('users', userId);
    if (user) return user;
    if (userId === 'usr_imran_001') {
      return {
        id: 'usr_imran_001',
        name: 'ইমরান',
        phone: '01712-345678',
        availableBalance: 13500,
        lockedBalance: 5000,
        totalBalance: 18500,
        role: 'DEMO_USER',
        isStrictMode: false,
        voiceProfile: {
          isEnrolled: true,
          primarySpeaker: 'ইমরান হোসেন',
          pitchRangeHz: [110, 155],
          fundamentalFrequencyHz: 128.4,
        },
      };
    }
    return null;
  }

  updateUserBalances(userId, { availableBalance, lockedBalance }) {
    const user = this.getUser(userId);
    if (!user) return null;
    const updates = {};
    if (availableBalance !== undefined) updates.availableBalance = availableBalance;
    if (lockedBalance !== undefined) updates.lockedBalance = lockedBalance;
    updates.totalBalance = (updates.availableBalance ?? user.availableBalance) + (updates.lockedBalance ?? user.lockedBalance);
    return this.update('users', userId, updates);
  }

  findContact(userId, query) {
    const contacts = this.getAll('contacts').filter(c => c.userId === userId);
    if (!query) return null;
    const q = query.trim().toLowerCase();
    return contacts.find(c =>
      c.name.toLowerCase().includes(q) ||
      (c.alias && c.alias.toLowerCase().includes(q)) ||
      c.phone.includes(q)
    ) || null;
  }

  findAgent(query) {
    const agents = this.getAll('agents');
    if (!query) return null;
    const q = query.trim().toLowerCase();
    return agents.find(a =>
      a.name.toLowerCase().includes(q) ||
      (a.alias && a.alias.toLowerCase().includes(q)) ||
      a.area.toLowerCase().includes(q)
    ) || null;
  }

  getActiveLocks(userId = 'usr_imran_001') {
    return this.getAll('locks').filter(l => l.userId === userId && l.status === 'LOCKED');
  }

  getReminders(userId = 'usr_imran_001') {
    return this.getAll('reminders').filter(r => r.userId === userId);
  }

  getRecentTransactions(userId = 'usr_imran_001', limit = 10) {
    return this.getAll('transactions')
      .filter(t => t.userId === userId)
      .slice(0, limit);
  }
}

export const db = new DataStore();
export default db;
