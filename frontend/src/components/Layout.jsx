import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import VoiceCommand from './VoiceCommand';
import NetworkStatusBanner from './NetworkStatusBanner';

/**
 * Layout: Master layout wrapper for all authenticated application routes
 */
export default function Layout({
  children,
  title = 'ড্যাশবোর্ড',
  isStrictMode = false,
  onToggleStrictMode,
  userName = 'ইমরান',
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Skip to Main Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-emerald-700 focus:text-white focus:font-semibold focus:rounded-xl focus:shadow-lg focus:ring-2 focus:ring-emerald-400"
      >
        সরাসরি মূল কনটেন্টে যান
      </a>

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all">
        {/* Offline Connectivity Resilience Banner */}
        <NetworkStatusBanner />

        {/* Top Navbar */}
        <Navbar
          title={title}
          userName={userName}
          isStrictMode={isStrictMode}
          onToggleStrictMode={onToggleStrictMode}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main id="main-content" tabIndex="-1" className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto outline-none">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="py-4 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
          UPKOTHA (উপকথা) • সহজ ভাষায়, বুদ্ধিমানভাবে, নিরাপদে ডিজিটাল ফাইন্যান্স
        </footer>
      </div>

      {/* Omnipresent Floating Voice Assistant Mic */}
      <VoiceCommand floating={true} />
    </div>
  );
}
