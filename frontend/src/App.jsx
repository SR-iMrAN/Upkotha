import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VoiceProvider } from './context/VoiceContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import SendMoney from './pages/SendMoney';
import CashOut from './pages/CashOut';
import Transactions from './pages/Transactions';
import Voice from './pages/Voice';
import DesignSystemShowcase from './pages/DesignSystemShowcase';
import Button from './components/Button';

function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="navbar bg-white border-b border-slate-200 px-6 sticky top-0 z-50 shadow-xs">
        <div className="flex-1 items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold text-xl shadow-md">
            উপ
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">UPKOTHA</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              উপকথা AI
            </span>
          </div>
        </div>

        <div className="flex-none gap-2 sm:gap-3">
          <Link to="/design-system">
            <Button variant="outline" size="sm">
              ডিজাইন সিস্টেম
            </Button>
          </Link>

          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button variant="primary" size="sm" icon={LayoutDashboard}>
                ড্যাশবোর্ড ({user?.name || 'ইমরান'})
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="secondary" size="sm" icon={LogIn}>
                  লগইন
                </Button>
              </Link>
              <Link to="/register" className="hidden sm:inline-flex">
                <Button variant="primary" size="sm" icon={UserPlus}>
                  নিবন্ধন
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>সহজ ভাষায়, বুদ্ধিমানভাবে, নিরাপদে ডিজিটাল ফাইন্যান্স</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
          আপনার ভয়েস ও এআই চালিত <br />
          <span className="text-emerald-700">স্মার্ট এমএফএস অ্যাসিস্ট্যান্ট</span>
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 font-normal">
          উপকথা আপনাকে অর্থ পাঠাতে, ক্যাশ আউট করতে, সঞ্চয় সুরক্ষিত রাখতে, এবং খরচের হিসাব সহজে বুঝতে সাহায্য করে।
        </p>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mb-10 text-left">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">01. PERFORM</span>
            <h4 className="font-semibold text-slate-800 mt-1">ভয়েসে লেনদেন</h4>
            <p className="text-xs text-slate-500 mt-0.5">সহজ বাংলা কথায় সেন্ড মানি ও ক্যাশ আউট</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">02. PROTECT</span>
            <h4 className="font-semibold text-slate-800 mt-1">মানি লক ও সুরক্ষা</h4>
            <p className="text-xs text-slate-500 mt-0.5">জরুরি টাকা আলাদা রাখুন এবং কড়া নিশ্চিতকরণ</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">03. UNDERSTAND</span>
            <h4 className="font-semibold text-slate-800 mt-1">লেনদেনের ব্যাখ্যা</h4>
            <p className="text-xs text-slate-500 mt-0.5">খরচ বিশ্লেষণ ও নির্ভুল বাংলা সারাংশ</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">04. REMEMBER</span>
            <h4 className="font-semibold text-slate-800 mt-1">বিল রিমাইন্ডার</h4>
            <p className="text-xs text-slate-500 mt-0.5">মাসিক নিয়মিত বিলের সময়মতো সতর্কতা</p>
          </div>
        </div>

        {/* Primary Call to Action */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button variant="primary" size="lg" icon={ArrowRight}>
                আপনার ড্যাশবোর্ডে প্রবেশ করুন
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="primary" size="lg" icon={ArrowRight}>
                  ডেমো ওয়ালেটে প্রবেশ করুন
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg">
                  নতুন অ্যাকাউন্ট নিবন্ধন
                </Button>
              </Link>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        UPKOTHA (উপকথা)
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <VoiceProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/design-system" element={<DesignSystemShowcase />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/send-money"
              element={
                <ProtectedRoute>
                  <SendMoney />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cash-out"
              element={
                <ProtectedRoute>
                  <CashOut />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lock-money"
              element={
                <ProtectedRoute>
                  <DesignSystemShowcase />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reminders"
              element={
                <ProtectedRoute>
                  <DesignSystemShowcase />
                </ProtectedRoute>
              }
            />
            <Route
              path="/strict-mode"
              element={
                <ProtectedRoute>
                  <DesignSystemShowcase />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voice"
              element={
                <ProtectedRoute>
                  <Voice />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </VoiceProvider>
    </AuthProvider>
  );
}
