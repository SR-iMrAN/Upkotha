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

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }, [user]);

  // Demo Login
  const login = (phone, pin) => {
    setIsLoading(true);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        setIsLoading(false);
        // Clean phone string
        const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';

        // Allow demo login with default demo PIN '1234' or any valid 4-digit PIN for demo testing
        if (pin === '1234' || (cleanPhone.length >= 10 && pin && pin.length === 4)) {
          const activeUser = {
            ...DEFAULT_DEMO_USER,
            phone: phone || DEFAULT_DEMO_USER.phone,
          };
          setUser(activeUser);
          setIsAuthenticated(true);
          localStorage.setItem('upkotha_is_logged_in', 'true');
          showToast.success(`স্বাগতম, ${activeUser.name}! সফলভাবে লগইন হয়েছে।`);
          resolve(activeUser);
        } else {
          showToast.error('ভুল পিন কোড। ডেমো পিন: 1234 ব্যবহার করুন।');
          reject(new Error('অবৈধ ক্রেডেনশিয়াল'));
        }
      }, 500);
    });
  };

  // Demo Registration
  const register = (name, phone, pin) => {
    setIsLoading(true);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        setIsLoading(false);
        if (!name || !phone || !pin || pin.length !== 4) {
          showToast.error('অনুগ্রহ করে সঠিক নাম, মোবাইল নম্বর এবং ৪ ডিজিটের পিন দিন');
          reject(new Error('তথ্য অসম্পূর্ণ'));
          return;
        }

        const newUser = {
          id: `usr_${Date.now()}`,
          name,
          phone,
          availableBalance: 15000,
          lockedBalance: 3000,
          isStrictMode: false,
          role: 'DEMO_USER',
          contacts: DEFAULT_DEMO_USER.contacts,
        };

        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem('upkotha_is_logged_in', 'true');
        showToast.success(`অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! স্বাগতম ${name}`);
        resolve(newUser);
      }, 600);
    });
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
      return {
        ...prev,
        isStrictMode: nextMode,
      };
    });
  };

  // Update Balances
  const updateBalance = (newAvailable, newLocked) => {
    setUser((prev) => ({
      ...prev,
      availableBalance: newAvailable !== undefined ? newAvailable : prev.availableBalance,
      lockedBalance: newLocked !== undefined ? newLocked : prev.lockedBalance,
    }));
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
