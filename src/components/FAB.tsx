'use client';
import React from 'react';

export default function FAB() {
  return (
    <button 
      onClick={() => alert('Transaction modal opened!')}
      className="fixed bottom-28 right-6 w-14 h-14 bg-black text-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 z-40 group"
    >
      <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-300">add</span>
    </button>
  );
}
