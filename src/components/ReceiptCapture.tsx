'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AddTransactionForm from '@/components/AddTransactionForm';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Props {
  categories: Category[];
}

type CaptureMode = 'receipt' | 'manual';

type ExtractedReceipt = {
  merchant: string;
  amount: number;
  categoryName: string;
  note: string;
  confidence: number;
  provider: 'gemini' | 'local';
};

function categoryIdForName(categories: Category[], categoryName: string) {
  return categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase())?.id ||
    categories.find(cat => cat.name !== 'Income')?.id ||
    categories[0]?.id ||
    '';
}

export default function ReceiptCapture({ categories }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<CaptureMode>('receipt');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [merchant, setMerchant] = useState('Sahad Stores');
  const [amount, setAmount] = useState('18650');
  const [categoryId, setCategoryId] = useState(categories.find(cat => cat.name === 'Markets')?.id || categories[0]?.id || '');
  const [note, setNote] = useState('Receipt captured');
  const [reader, setReader] = useState<ExtractedReceipt['provider'] | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'ready' | 'saving'>('idle');

  async function handleFile(file: File) {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setStatus('scanning');
    setError(null);
    setReader(null);
    setConfidence(null);

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await fetch('/api/receipt/extract', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Receipt reader failed');

      const extracted = await res.json() as ExtractedReceipt;
      setMerchant(extracted.merchant);
      setAmount(String(extracted.amount || ''));
      setCategoryId(categoryIdForName(categories, extracted.categoryName));
      setNote(extracted.note);
      setReader(extracted.provider);
      setConfidence(extracted.confidence);
      setStatus('ready');
    } catch {
      setError('Could not read this receipt. Enter the details manually or try a clearer image.');
      setStatus('ready');
    }
  }

  async function saveReceiptTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!merchant || !amount || !categoryId) return;

    setStatus('saving');
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant,
        amount: Number(amount),
        type: 'expense',
        categoryId,
        source: 'receipt',
        status: 'verified',
        note,
      }),
    });

    if (res.ok) {
      router.push('/transactions');
      router.refresh();
    } else {
      setStatus('ready');
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-100 p-1 flex">
        <button
          type="button"
          onClick={() => setMode('receipt')}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${mode === 'receipt' ? 'bg-black text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          Receipt Capture
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${mode === 'manual' ? 'bg-black text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          Manual Entry
        </button>
      </div>

      {mode === 'manual' ? (
        <AddTransactionForm categories={categories} />
      ) : (
        <form onSubmit={saveReceiptTransaction} className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-100 p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center overflow-hidden"
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="Receipt preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center px-6">
                  <span className="material-symbols-outlined text-5xl text-zinc-300 mb-3 block">photo_camera</span>
                  <p className="font-semibold text-zinc-900">Snap or upload receipt</p>
                  <p className="text-sm text-zinc-500 mt-1">Use this for market, fuel, restaurant, pharmacy, or utility receipts.</p>
                </div>
              )}
            </button>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-400">
                {status === 'scanning'
                  ? 'Reading receipt fields...'
                  : reader === 'gemini'
                    ? `Read by Gemini${confidence !== null ? ` · ${Math.round(confidence * 100)}% confidence` : ''}`
                    : reader === 'local'
                      ? 'Local fallback draft'
                      : 'Upload a clear receipt to extract fields.'}
              </p>
              <span className={`text-xs font-black uppercase tracking-widest ${status === 'ready' ? 'text-[#009844]' : 'text-zinc-400'}`}>
                {status === 'scanning' ? 'Scanning' : status === 'ready' ? 'Ready' : 'Draft'}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Merchant</span>
              <input value={merchant} onChange={e => setMerchant(e.target.value)} className="mt-2 w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Amount</span>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg font-semibold">₦</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black" />
              </div>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Category</span>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-2 w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black">
              {categories.filter(cat => cat.name !== 'Income').map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Note</span>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="mt-2 w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black resize-none" />
          </label>

          <button disabled={status === 'saving' || !merchant || !amount || !categoryId} className="w-full bg-black text-white py-4 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">{status === 'saving' ? 'progress_activity' : 'receipt_long'}</span>
            {status === 'saving' ? 'Recording...' : 'Record Receipt'}
          </button>
        </form>
      )}
    </div>
  );
}
