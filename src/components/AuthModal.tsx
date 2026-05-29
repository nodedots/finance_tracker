'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    onClose();
    router.push('/dashboard');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <Link href="/" onClick={onClose} className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
              <span className="material-symbols-outlined text-[28px]">account_balance_wallet</span>
            </Link>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <h2 className="text-3xl font-black font-['Manrope'] tracking-tight mb-2">Welcome back</h2>
          <p className="text-zinc-500 mb-8">Enter your email to sign in to your account.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold font-['Manrope'] uppercase tracking-wider text-zinc-400 mb-2 px-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-5 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-black focus:bg-white outline-none transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold font-['Manrope'] text-lg hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Continue with Email'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-400">
            Don&apos;t have an account? <Link href="/onboarding" onClick={onClose} className="text-black font-bold">Set up Fintrack</Link>
          </p>
        </div>
        
        <div className="bg-zinc-50 p-6 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-400 leading-relaxed px-4">
            By continuing, you agree to Fintrack&apos;s <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
