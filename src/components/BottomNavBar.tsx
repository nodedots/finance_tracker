import React from 'react';
import Link from 'next/link';

export default function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex justify-around items-center h-20 px-4">
      <Link href="/dashboard" className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 opacity-60 hover:text-zinc-900 dark:hover:text-zinc-50 active:scale-90 transition-transform duration-300 ease-out">
        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>grid_view</span>
        <span className="font-manrope text-[10px] font-bold uppercase tracking-widest mt-1">Dashboard</span>
      </Link>
      <Link href="/transactions" className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 opacity-60 hover:text-zinc-900 dark:hover:text-zinc-50 active:scale-90 transition-transform duration-300 ease-out">
        <span className="material-symbols-outlined">receipt_long</span>
        <span className="font-manrope text-[10px] font-bold uppercase tracking-widest mt-1">Activity</span>
      </Link>
      <Link href="/scan" className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 opacity-60 hover:text-zinc-900 dark:hover:text-zinc-50 active:scale-90 transition-transform duration-300 ease-out">
        <span className="material-symbols-outlined">photo_camera</span>
        <span className="font-manrope text-[10px] font-bold uppercase tracking-widest mt-1">Scan</span>
      </Link>
      <Link href="/settings" className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 opacity-60 hover:text-zinc-900 dark:hover:text-zinc-50 active:scale-90 transition-transform duration-300 ease-out">
        <span className="material-symbols-outlined">more_horiz</span>
        <span className="font-manrope text-[10px] font-bold uppercase tracking-widest mt-1">More</span>
      </Link>
    </nav>
  );
}
