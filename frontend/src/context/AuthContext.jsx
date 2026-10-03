import React, { createContext, useContext, useState, useEffect } from 'react';
import { showToast } from '../utils/alert';

const AuthContext = createContext(null);

const DEFAULT_DEMO_USER = {
  id: 'usr_imran_001',
  name: 'ইমরান',
  phone: '01712-345678',
  availableBalance: 13500,
  lockedBalance: 5000,
  isStrictMode: false,
  role: 'DEMO_USER',
  contacts: [
    { id: 'c1', name: 'রাকিব', phone: '01798-765432', avatar: 'র' },
    { id: 'c2', name: 'সাকিব', phone: '01812-345678', avatar: 'স' },
    { id: 'c3', name: 'নাদিয়া', phone: '01934-567890', avatar: 'ন' },
    { id: 'c4', name: 'মা', phone: '01711-223344', avatar: 'ম' },
  ],
};

const STORAGE_KEY = 'upkotha_auth_session';
const REGISTRY_KEY = 'upkotha_registered_accounts';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_DEMO_USER;
    } catch {
      return DEFAULT_DEMO_USER;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('upkotha_is_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync any updates to registered accounts registry
  const syncToRegistry = (updatedUser) => {
    if (!updatedUser || !updatedUser.phone) return;
    try {
      const cleanPhone = updatedUser.phone.replace(/\D/g, '');
      const existing = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]');
      const filtered = existing.filter((a) => (a.phone ? a.phone.replace(/\D/g, '') : '') !== cleanPhone);
      localStorage.setItem(REGISTRY_KEY, JSON.stringify([...filtered, updatedUser]));
    } catch (e) {
      console.warn('Failed to sync user to registry', e);
    }
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem('upkotha_user', JSON.stringify(user));
    }
  }, [user]);

  // Account Login with true multi-account resolution
  const login = async (phone, pin) => {
    setIsLoading(true);
    const cleanInputPhone = phone ? phone.replace(/\D/g, '') : '';
    const cleanPin = pin ? String(pin).trim() : '';

    try {
      let loggedUser = null;

      // 1. Attempt server-side login
      try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, pin: cleanPin }),
        });
        const data = await res.json();
        if (data.success && data.user) {
          loggedUser = data.user;
        }
      } catch (backendErr) {
        console.warn('Backend login unavailable, checking local registry', backendErr);
      }

      // 2. Fallback to client-side registered accounts
      if (!loggedUser) {
        const localAccounts = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]');
        const matched = localAccounts.find((acc) => {
          const accPhoneClean = acc.phone ? acc.phone.replace(/\D/g, '') : '';
          return accPhoneClean === cleanInputPhone && String(acc.pin) === cleanPin;
        });
        if (matched) {
          loggedUser = matched;
        }
      }

      // 3. Fallback to default Imran demo account
      if (!loggedUser) {
        const imranPhoneClean = DEFAULT_DEMO_USER.phone.replace(/\D/g, '');
        if ((cleanInputPhone === imranPhoneClean || cleanInputPhone === '01712345678') && cleanPin === '1234') {
          loggedUser = { ...DEFAULT_DEMO_USER };
        }
      }

      if (!loggedUser) {
        showToast.error('ভুল মোবাইল নম্বর বা গোপন পিন কোড দেওয়া হয়েছে');
        throw new Error('অবৈধ ক্রেডেনশিয়াল');
      }

      setUser(loggedUser);
      setIsAuthenticated(true);
      localStorage.setItem('upkotha_is_logged_in', 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
      localStorage.setItem('upkotha_last_logged_phone', loggedUser.phone);
      showToast.success(`স্বাগতম, ${loggedUser.name}! সফলভাবে লগইন হয়েছে।`);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  // Register new account with clean initial state and isolated identity
  const register = async (name, phone, pin) => {
    setIsLoading(true);

    try {
      if (!name || !phone || !pin || pin.length !== 4) {
        showToast.error('অনুগ্রহ করে সঠিক নাম, মোবাইল নম্বর এবং ৪ ডিজিটের পিন দিন');
        throw new Error('তথ্য অসম্পূর্ণ');
      }

      let backendUser = null;
      try {
        const res = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, pin }),
        });
        const data = await res.json();
        if (data.success && data.user) {
          backendUser = data.user;
        }
      } catch (err) {
        console.warn('Backend register call failed, using client fallback', err);
      }

      const userId = backendUser?.id || `usr_${Date.now()}`;
      const newUser = {
        id: userId,
        name: name.trim(),
        phone: phone.trim(),
        pin: pin.trim(),
        availableBalance: 15000,
        lockedBalance: 0,
        totalBalance: 15000,
        isStrictMode: false,
        role: 'USER',
        isNewAccount: true,
        needsVoiceEnrollment: true,
        contacts: [],
        voiceProfile: backendUser?.voiceProfile || {
          isEnrolled: false,
          primarySpeaker: name.trim(),
          pitchRangeHz: [120, 180],
        },
      };

      // Initialize empty storage for this new user so history, reminders, locks are clean
      localStorage.setItem(`upkotha_transactions_${userId}`, JSON.stringify([]));
      localStorage.setItem(`upkotha_reminders_${userId}`, JSON.stringify([]));
      localStorage.setItem(`upkotha_locks_${userId}`, JSON.stringify([]));

      // Persist in accounts registry
      try {
        const localAccounts = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]');
        const cleanNewPhone = newUser.phone.replace(/\D/g, '');
        const updatedAccounts = [
          ...localAccounts.filter((a) => (a.phone ? a.phone.replace(/\D/g, '') : '') !== cleanNewPhone),
          newUser,
        ];
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(updatedAccounts));
        localStorage.setItem(
          'upkotha_last_registered_account',
          JSON.stringify({
            id: newUser.id,
            name: newUser.name,
            phone: newUser.phone,
            pin: newUser.pin,
          })
        );
        localStorage.setItem('upkotha_last_logged_phone', newUser.phone);
      } catch (e) {
        console.warn('Failed to update accounts registry in localStorage', e);
      }

      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem('upkotha_is_logged_in', 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      showToast.success(`অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! স্বাগতম ${name}`);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('upkotha_is_logged_in');
    showToast.info('আপনি সফলভাবে লগআউট হয়েছেন');
  };

  // Strict Mode Toggle
  const toggleStrictMode = () => {
    setUser((prev) => {
      const nextMode = !prev.isStrictMode;
      if (nextMode) {
        showToast.warning('স্ট্রিক্ট মোড সক্রিয় হয়েছে: প্রতিটি লেনদেনে অতিরিক্ত সুরক্ষা প্রযোজ্য');
      } else {
        showToast.info('স্ট্রিক্ট মোড নিষ্ক্রিয় করা হয়েছে');
      }
      const updated = {
        ...prev,
        isStrictMode: nextMode,
      };
      syncToRegistry(updated);
      return updated;
    });
  };

  // Update Balances
  const updateBalance = (newAvailable, newLocked) => {
    setUser((prev) => {
      const updated = {
        ...prev,
        availableBalance: newAvailable !== undefined ? newAvailable : prev.availableBalance,
        lockedBalance: newLocked !== undefined ? newLocked : prev.lockedBalance,
      };
      syncToRegistry(updated);
      return updated;
    });
  };

  // Update Voice Biometric Profile
  const updateVoiceProfile = (newProfile) => {
    setUser((prev) => {
      const updated = {
        ...prev,
        needsVoiceEnrollment: false,
        voiceProfile: {
          ...(prev?.voiceProfile || {}),
          ...newProfile,
          isEnrolled: true,
        },
      };
      syncToRegistry(updated);
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        toggleStrictMode,
        updateBalance,
        updateVoiceProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
