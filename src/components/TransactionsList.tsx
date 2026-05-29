'use client';

import { useState, useMemo } from 'react';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  merchant: string;
  note: string | null;
  source: string;
  status: string;
  createdAt: string;
  category: Category;
}

const sourceIcons: Record<string, { icon: string; color: string }> = {
  email: { icon: 'mail', color: 'text-[#4854bb]' },
  sms: { icon: 'sms', color: 'text-zinc-800' },
  receipt: { icon: 'receipt_long', color: 'text-[#009844]' },
  manual: { icon: 'edit', color: 'text-zinc-500' },
};

function groupByDate(txns: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  for (const txn of txns) {
    const key = formatDate(txn.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(txn);
  }
  return groups;
}

interface Props {
  initialTransactions: Transaction[];
  categories: Category[];
  currency: string;
}

export default function TransactionsList({ initialTransactions, categories, currency }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    return initialTransactions.filter(txn => {
      const matchSearch = !search || txn.merchant.toLowerCase().includes(search.toLowerCase()) ||
        txn.category.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory === 'All' || txn.category.name === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [initialTransactions, search, activeCategory]);

  const grouped = groupByDate(filtered);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
        <input
          className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-black focus:border-transparent text-zinc-900 placeholder-zinc-400 transition-all text-sm"
          placeholder="Search merchants, categories..."
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all active:scale-95 ${
            activeCategory === 'All'
              ? 'bg-black text-white'
              : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          All
        </button>
        {categories.filter(c => c.name !== 'Income').map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all active:scale-95 ${
              activeCategory === cat.name
                ? 'bg-black text-white'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results count */}
      {(search || activeCategory !== 'All') && (
        <p className="text-sm text-zinc-400">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {search && <> for &ldquo;{search}&rdquo;</>}
          {activeCategory !== 'All' && <> in {activeCategory}</>}
        </p>
      )}

      {/* Grouped transactions */}
      {Object.entries(grouped).map(([date, txns]) => (
        <div key={date}>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">{date}</p>
          <div className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-100">
            {txns.map(txn => {
              const src = sourceIcons[txn.source] || sourceIcons['manual'];
              return (
                <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center relative" style={{ backgroundColor: `${txn.category.color}15` }}>
                      <span className="material-symbols-outlined" style={{ color: txn.category.color }}>{txn.category.icon}</span>
                      <div className="absolute -top-1 -right-1 bg-white p-0.5 rounded-full shadow-sm border border-zinc-50">
                        <span className={`material-symbols-outlined text-[12px] ${src.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{src.icon}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-zinc-900">{txn.merchant}</p>
                      <p className="text-xs text-zinc-400">{txn.category.name} &middot; {formatTime(txn.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${txn.type === 'income' ? 'text-[#009844]' : 'text-zinc-900'}`}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, currency)}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{txn.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-zinc-300 mb-3 block">search_off</span>
          <p className="text-zinc-500">No transactions found</p>
        </div>
      )}
    </div>
  );
}
