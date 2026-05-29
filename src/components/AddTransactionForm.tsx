'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Props {
  categories: Category[];
}

export default function AddTransactionForm({ categories }: Props) {
  const router = useRouter();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [source, setSource] = useState('manual');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!merchant || !amount || !categoryId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant,
          amount: parseFloat(amount),
          type,
          categoryId,
          source,
          note: note || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setMerchant('');
        setAmount('');
        setCategoryId('');
        setNote('');
        setTimeout(() => {
          setSuccess(false);
          router.push('/transactions');
          router.refresh();
        }, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="bg-[#009844]/10 border border-[#009844]/20 text-[#009844] px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          Transaction added successfully! Redirecting...
        </div>
      )}

      {/* Type Toggle */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-1 flex">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
            type === 'expense' ? 'bg-black text-white' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
            type === 'income' ? 'bg-[#009844] text-white' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Income
        </button>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xl font-semibold">₦</span>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl py-4 pl-10 pr-4 text-2xl font-['Manrope'] font-semibold text-zinc-900 focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Merchant */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Merchant / Description</label>
        <input
          type="text"
          required
          value={merchant}
          onChange={e => setMerchant(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black focus:border-transparent"
          placeholder="e.g., Sahad Stores, Monthly Salary"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Category</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center ${
                categoryId === cat.id
                  ? 'border-black bg-zinc-900 text-white'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={categoryId === cat.id ? undefined : { color: cat.color }}>
                {cat.icon}
              </span>
              <span className="text-[11px] font-semibold truncate w-full">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Source */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Source</label>
        <div className="flex gap-2 flex-wrap">
          {['manual', 'sms', 'email', 'receipt'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize ${
                source === s ? 'bg-black text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Note (optional)</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black focus:border-transparent resize-none"
          rows={3}
          placeholder="Add a note..."
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !merchant || !amount || !categoryId}
        className="w-full bg-black text-white py-4 rounded-xl font-semibold text-base hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            Saving...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Add Transaction
          </>
        )}
      </button>
    </form>
  );
}
