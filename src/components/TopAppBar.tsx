import React from 'react';

interface TopAppBarProps {
  title?: string;
}

export default function TopAppBar({ title = "Fintrack" }: TopAppBarProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center px-6 h-16">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-200">
          <img className="w-full h-full object-cover" alt="User Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAe_iz8BO76IuA6r6jBfmwtMzmIpSB9I_-lEbA_I42PZWLI__-zF9kjI12W1xuTNxnUCxyF9X9y6Eoo3keuSI9_BaPJu8WqDFxs-nXrG3AlnNMJJ7q3YjZpd_7Cy33LEC65Pt8bWqwHbJ2o_6guiUKSOqTrQQHIF8m3rO0B5RLw1sEdNC3xF3nBSVqaaiMPjucMfJMAxNyk3oVLVFWIfa1EzU_Pku_BsRwx2h2gKWZnLhhl2FcMmpl558HyCykCzN1WfXGtAkNx795Z" />
        </div>
        <span className="text-lg font-black tracking-tighter text-zinc-900 dark:text-zinc-50 font-headline-md">{title}</span>
      </div>
      <button className="text-zinc-900 dark:text-zinc-50 hover:opacity-70 transition-opacity active:scale-95 duration-200">
        <span className="material-symbols-outlined">notifications</span>
      </button>
    </header>
  );
}
