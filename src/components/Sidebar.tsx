'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'grid_view' },
  { href: '/transactions', label: 'Transactions', icon: 'receipt_long' },
  { href: '/scan', label: 'Capture', icon: 'photo_camera' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

type SidebarUser = {
  name: string;
  plan: string;
} | null;

export default function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-zinc-200 flex-col z-40">
        <Link href="/" className="p-6 flex items-center gap-3 border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
          </div>
          <span className="text-xl font-black tracking-tighter text-zinc-900 font-['Manrope']">Fintrack</span>
        </Link>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[15px] font-medium ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-zinc-900">{user?.name || 'Not set up'}</p>
              <p className="text-zinc-400 text-xs">{user ? `${user.plan === 'pro' ? 'Pro' : 'Free'} Account` : 'Create account'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex items-center h-[72px] px-1 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-black'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {item.icon}
              </span>
              <span className="font-['Manrope'] text-[9px] font-bold uppercase tracking-[0.16em] text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
