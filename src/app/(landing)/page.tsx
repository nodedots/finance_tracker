'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthModal from '@/components/AuthModal';

export default function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <span className="text-xl font-black font-['Manrope'] tracking-tighter">Fintrack</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-bold font-['Manrope'] uppercase tracking-widest text-zinc-500 hover:text-black transition-colors">Features</Link>
            <Link href="#security" className="text-sm font-bold font-['Manrope'] uppercase tracking-widest text-zinc-500 hover:text-black transition-colors">Security</Link>
            <Link href="/dashboard" className="text-sm font-bold font-['Manrope'] uppercase tracking-widest text-zinc-500 hover:text-black transition-colors">Dashboard</Link>
          </div>
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="px-6 py-2.5 bg-black text-white rounded-full font-bold font-['Manrope'] text-sm hover:bg-zinc-800 transition-all shadow-lg shadow-black/10"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 md:pt-56 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 border border-zinc-200 mb-8">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-[11px] font-black font-['Manrope'] uppercase tracking-[0.2em] text-zinc-500">Finance Management</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black font-['Manrope'] tracking-tight leading-[0.9] mb-8">
              Your money records, <br />
              <span className="text-zinc-300">handled automatically.</span>
            </h1>
            <p className="text-xl text-zinc-500 leading-relaxed mb-10 max-w-lg">
              Fintrack automatically captures transactions from bank alerts, email receipts, SMS, and scanned receipts. No manual entry, just clear insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="px-10 py-5 bg-black text-white rounded-2xl font-bold font-['Manrope'] text-lg hover:bg-zinc-800 transition-all shadow-2xl shadow-black/20"
              >
                Get Started Now
              </button>
              <Link 
                href="/onboarding"
                className="px-10 py-5 bg-zinc-100 text-black rounded-2xl font-bold font-['Manrope'] text-lg hover:bg-zinc-200 transition-all text-center"
              >
                Set Up Capture
              </Link>
            </div>
          </div>
          <div className="relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="absolute -inset-4 bg-gradient-to-tr from-zinc-200 to-transparent rounded-[40px] blur-2xl opacity-50 -z-10"></div>
            <div className="bg-zinc-900 rounded-[40px] p-4 shadow-2xl shadow-black/40">
              <div className="bg-zinc-100 rounded-[32px] overflow-hidden aspect-[9/16] relative border-4 border-zinc-800">
                {/* Mock dashboard content */}
                <div className="p-6 space-y-6">
                  <div className="w-full h-40 bg-black rounded-3xl p-6 text-white">
                    <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest mb-1">Balance</p>
                    <p className="text-3xl font-black font-['Manrope']">₦1,245,000</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Recent Activity</p>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100"></div>
                          <div className="space-y-1">
                            <div className="w-20 h-3 bg-zinc-200 rounded"></div>
                            <div className="w-12 h-2 bg-zinc-100 rounded"></div>
                          </div>
                        </div>
                        <div className="w-12 h-3 bg-zinc-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Scanner animation overlay */}
                <div className="absolute inset-x-0 h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan z-10" style={{ animation: 'scan 3s linear infinite' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="features" className="py-24 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-black font-['Manrope'] mb-2">99.9%</p>
            <p className="text-sm font-bold font-['Manrope'] uppercase tracking-widest text-zinc-400">Accuracy Rate</p>
          </div>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-black font-['Manrope'] mb-2">₦</p>
            <p className="text-sm font-bold font-['Manrope'] uppercase tracking-widest text-zinc-400">Multi-source Capture</p>
          </div>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-black font-['Manrope'] mb-2">24/7</p>
            <p className="text-sm font-bold font-['Manrope'] uppercase tracking-widest text-zinc-400">AI Monitoring</p>
          </div>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-black font-['Manrope'] mb-2">0</p>
            <p className="text-sm font-bold font-['Manrope'] uppercase tracking-widest text-zinc-400">Manual Entry</p>
          </div>
        </div>
      </section>

      <section id="security" className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
          <Link href="/onboarding" className="bg-white border border-zinc-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-zinc-200/60 transition-all">
            <span className="material-symbols-outlined text-3xl text-zinc-900 mb-4 block">hub</span>
            <h2 className="font-['Manrope'] font-bold text-xl mb-2">Onboarding</h2>
            <p className="text-sm text-zinc-500">Set profile, email, SMS, and camera capture preferences.</p>
          </Link>
          <Link href="/scan" className="bg-white border border-zinc-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-zinc-200/60 transition-all">
            <span className="material-symbols-outlined text-3xl text-zinc-900 mb-4 block">photo_camera</span>
            <h2 className="font-['Manrope'] font-bold text-xl mb-2">Capture</h2>
            <p className="text-sm text-zinc-500">Snap or upload receipts and turn them into records.</p>
          </Link>
          <Link href="/dashboard" className="bg-white border border-zinc-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-zinc-200/60 transition-all">
            <span className="material-symbols-outlined text-3xl text-zinc-900 mb-4 block">grid_view</span>
            <h2 className="font-['Manrope'] font-bold text-xl mb-2">Dashboard</h2>
            <p className="text-sm text-zinc-500">Review your financial snapshot and recent activity.</p>
          </Link>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-32 px-6 text-center">
        <h2 className="text-4xl md:text-6xl font-black font-['Manrope'] tracking-tight mb-8">Ready to reclaim <br />your time?</h2>
        <button 
          onClick={() => setIsAuthModalOpen(true)}
          className="px-12 py-6 bg-black text-white rounded-2xl font-bold font-['Manrope'] text-xl hover:bg-zinc-800 transition-all shadow-2xl shadow-black/20"
        >
          Get Started Now
        </button>
        <p className="mt-8 text-zinc-400 font-medium">Free to use. Open source prototype.</p>
        <div className="mt-20 pt-10 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto gap-6">
          <p className="text-sm text-zinc-400">© 2026 Fintrack Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <Link
              href="https://github.com/sgukobong/fintrack_app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-zinc-400 hover:text-black transition-colors"
            >
              GitHub
            </Link>
            <Link href="/legal" className="text-sm font-bold text-zinc-400 hover:text-black transition-colors">Legal</Link>
          </div>
        </div>
      </footer>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
