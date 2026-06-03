'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  categoryId: string;
  createdAt: string;
  category: Category;
}

type EditableTransaction = Pick<Transaction, 'id' | 'merchant' | 'type' | 'source' | 'status' | 'categoryId'> & {
  amount: string;
  note: string;
};

const sourceIcons: Record<string, { icon: string; color: string }> = {
  email: { icon: 'mail', color: 'text-[#4854bb]' },
  sms: { icon: 'sms', color: 'text-zinc-800' },
  receipt: { icon: 'receipt_long', color: 'text-[#009844]' },
  manual: { icon: 'edit', color: 'text-zinc-500' },
};

const transactionTypes = ['expense', 'income'];
const transactionSources = ['manual', 'sms', 'email', 'receipt'];
const transactionStatuses = ['approved', 'pending', 'matched', 'verified'];

function groupByDate(txns: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  for (const txn of txns) {
    const key = formatDate(txn.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(txn);
  }
  return groups;
}

function createDraft(txn: Transaction): EditableTransaction {
  return {
    id: txn.id,
    merchant: txn.merchant,
    amount: String(txn.amount),
    type: txn.type,
    source: txn.source,
    status: txn.status,
    categoryId: txn.categoryId || txn.category.id,
    note: txn.note || '',
  };
}

interface Props {
  initialTransactions: Transaction[];
  categories: Category[];
  currency: string;
}

export default function TransactionsList({ initialTransactions, categories, currency }: Props) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSource, setActiveSource] = useState('All');
  const [editing, setEditing] = useState<EditableTransaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter(txn => {
      const term = search.toLowerCase();
      const matchSearch = !term ||
        txn.merchant.toLowerCase().includes(term) ||
        txn.category.name.toLowerCase().includes(term) ||
        (txn.note || '').toLowerCase().includes(term);
      const matchCategory = activeCategory === 'All' || txn.category.name === activeCategory;
      const matchSource = activeSource === 'All' || txn.source === activeSource;
      return matchSearch && matchCategory && matchSource;
    });
  }, [transactions, search, activeCategory, activeSource]);

  const grouped = groupByDate(filtered);

  async function saveTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !editing.merchant.trim() || !editing.amount || !editing.categoryId) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/transactions/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: editing.merchant,
          amount: Number(editing.amount),
          type: editing.type,
          categoryId: editing.categoryId,
          source: editing.source,
          status: editing.status,
          note: editing.note || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Could not save transaction');
      }

      const updated = await res.json();
      setTransactions(current => current.map(txn => txn.id === updated.id ? updated : txn));
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save transaction');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTransaction(txn: Transaction) {
    const confirmed = window.confirm(`Remove "${txn.merchant}" from your transactions?`);
    if (!confirmed) return;

    setDeletingId(txn.id);
    setError(null);

    try {
      const res = await fetch(`/api/transactions/${txn.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Could not delete transaction');
      }

      setTransactions(current => current.filter(item => item.id !== txn.id));
      if (editing?.id === txn.id) setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete transaction');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
          <input
            className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-black focus:border-transparent text-zinc-900 placeholder-zinc-400 transition-all text-sm"
            placeholder="Search merchants, categories, notes..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={activeSource}
          onChange={(e) => setActiveSource(e.target.value)}
          className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-700 focus:ring-2 focus:ring-black"
        >
          <option value="All">All sources</option>
          {transactionSources.map(source => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        <button
          type="button"
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
            type="button"
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

      {(search || activeCategory !== 'All' || activeSource !== 'All') && (
        <p className="text-sm text-zinc-400">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {search && <> for &ldquo;{search}&rdquo;</>}
          {activeCategory !== 'All' && <> in {activeCategory}</>}
          {activeSource !== 'All' && <> from {activeSource}</>}
        </p>
      )}

      {Object.entries(grouped).map(([date, txns]) => (
        <div key={date}>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">{date}</p>
          <div className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-100 overflow-hidden">
            {txns.map(txn => {
              const src = sourceIcons[txn.source] || sourceIcons.manual;
              return (
                <div key={txn.id} className="grid gap-3 p-4 transition-colors hover:bg-zinc-50 sm:grid-cols-[1fr_auto]">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center relative" style={{ backgroundColor: `${txn.category.color}15` }}>
                      <span className="material-symbols-outlined" style={{ color: txn.category.color }}>{txn.category.icon}</span>
                      <div className="absolute -top-1 -right-1 bg-white p-0.5 rounded-full shadow-sm border border-zinc-50">
                        <span className={`material-symbols-outlined text-[12px] ${src.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{src.icon}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-zinc-900 truncate">{txn.merchant}</p>
                      <p className="text-xs text-zinc-400 break-words">{txn.category.name} &middot; {formatTime(txn.createdAt)}</p>
                      {txn.note && <p className="mt-1 line-clamp-1 text-xs text-zinc-500">{txn.note}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="shrink-0 text-left sm:text-right">
                      <p className={`font-semibold text-sm ${txn.type === 'income' ? 'text-[#009844]' : 'text-zinc-900'}`}>
                        {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, currency)}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{txn.status}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setEditing(createDraft(txn));
                        }}
                        className="w-9 h-9 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
                        aria-label={`Edit ${txn.merchant}`}
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTransaction(txn)}
                        disabled={deletingId === txn.id}
                        className="w-9 h-9 rounded-lg border border-red-100 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50"
                        aria-label={`Delete ${txn.merchant}`}
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[18px]">{deletingId === txn.id ? 'progress_activity' : 'delete'}</span>
                      </button>
                    </div>
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 px-4 py-4 sm:items-center sm:justify-center">
          <form onSubmit={saveTransaction} className="w-full max-w-2xl rounded-2xl border border-zinc-100 bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Manage</p>
                <h2 className="font-['Manrope'] text-2xl font-bold text-zinc-900">Edit transaction</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                aria-label="Close editor"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Merchant / Description</span>
                <input
                  value={editing.merchant}
                  onChange={e => setEditing({ ...editing, merchant: e.target.value })}
                  className="mt-2 w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Amount</span>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg font-semibold">₦</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editing.amount}
                    onChange={e => setEditing({ ...editing, amount: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Category</span>
                <select
                  value={editing.categoryId}
                  onChange={e => setEditing({ ...editing, categoryId: e.target.value })}
                  className="mt-2 w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Type</span>
                <select
                  value={editing.type}
                  onChange={e => setEditing({ ...editing, type: e.target.value })}
                  className="mt-2 w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black"
                >
                  {transactionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Status</span>
                <select
                  value={editing.status}
                  onChange={e => setEditing({ ...editing, status: e.target.value })}
                  className="mt-2 w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black"
                >
                  {transactionStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Source</span>
                <select
                  value={editing.source}
                  onChange={e => setEditing({ ...editing, source: e.target.value })}
                  className="mt-2 w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black"
                >
                  {transactionSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Note</span>
                <textarea
                  value={editing.note}
                  onChange={e => setEditing({ ...editing, note: e.target.value })}
                  rows={3}
                  className="mt-2 w-full resize-none bg-white border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex-1 rounded-xl bg-zinc-100 py-3 font-semibold text-zinc-700 hover:bg-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !editing.merchant.trim() || !editing.amount || !editing.categoryId}
                className="flex-1 rounded-xl bg-black py-3 font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
