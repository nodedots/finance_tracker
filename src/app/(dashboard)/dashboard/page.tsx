import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/format';
import Link from 'next/link';

function timeAgo(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Yesterday';
  return `${diffD}d ago`;
}

const sourceIcons: Record<string, { icon: string; color: string }> = {
  email: { icon: 'mail', color: 'text-[#4854bb]' },
  sms: { icon: 'sms', color: 'text-zinc-800' },
  receipt: { icon: 'receipt_long', color: 'text-[#009844]' },
  manual: { icon: 'edit', color: 'text-zinc-500' },
};

export default async function Dashboard() {
  const user = await prisma.user.findFirst();
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white border border-zinc-100 rounded-2xl p-8">
          <span className="material-symbols-outlined text-5xl text-zinc-300 mb-4 block">account_circle</span>
          <h1 className="font-['Manrope'] font-bold text-2xl text-zinc-900 mb-2">Create your account</h1>
          <p className="text-sm text-zinc-500 mb-6">Set up your profile and capture sources before recording transactions.</p>
          <Link href="/onboarding" className="inline-flex justify-center w-full bg-black text-white py-3 rounded-xl font-semibold">
            Start Setup
          </Link>
        </div>
      </div>
    );
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  const recentTransactions = transactions.slice(0, 5);

  const categorySpending = transactions
    .filter(t => t.type === 'expense')
    .reduce<Record<string, { name: string; total: number; icon: string; color: string }>>((acc, t) => {
      const key = t.category.name;
      if (!acc[key]) acc[key] = { name: key, total: 0, icon: t.category.icon, color: t.category.color };
      acc[key].total += t.amount;
      return acc;
    }, {});

  const topCategories = Object.values(categorySpending).sort((a, b) => b.total - a.total).slice(0, 4);

  return (
    <div className="min-h-screen pb-6 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-zinc-100 px-4 py-4 sm:px-6 md:px-10 md:py-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-zinc-500 text-sm font-medium">Welcome back,</p>
            <h1 className="font-['Manrope'] font-black text-2xl sm:text-3xl md:text-4xl text-zinc-900 tracking-tight break-words">{user.name}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {user.smsActive && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 border border-zinc-100">
                <span className="w-2 h-2 rounded-full bg-[#009844]" />
                <span className="text-[11px] font-black font-['Manrope'] uppercase tracking-widest text-zinc-400">SMS</span>
              </div>
            )}
            {user.gmailLinked && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 border border-zinc-100">
                <span className="w-2 h-2 rounded-full bg-[#009844]" />
                <span className="text-[11px] font-black font-['Manrope'] uppercase tracking-widest text-zinc-400">Email</span>
              </div>
            )}
            <button className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-5 md:py-8 space-y-6 md:space-y-8">
        {/* Financial Snapshot */}
        <section className="opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="bg-black rounded-3xl p-5 sm:p-6 md:p-8 text-white shadow-2xl shadow-black/20 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <p className="text-sm opacity-70 mb-1 font-semibold">Total Balance</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold font-['Manrope'] tracking-tight mb-5 md:mb-6 break-words">
              {formatCurrency(balance, user.currency)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm">arrow_downward</span>
                  <span className="text-[12px] uppercase tracking-wider opacity-70 font-semibold">Income</span>
                </div>
                <p className="font-['Manrope'] font-semibold text-xl">{formatCurrency(totalIncome, user.currency)}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm">arrow_upward</span>
                  <span className="text-[12px] uppercase tracking-wider opacity-70 font-semibold">Expenses</span>
                </div>
                <p className="font-['Manrope'] font-semibold text-xl">{formatCurrency(totalExpenses, user.currency)}</p>
              </div>
              <div className="hidden md:block bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm">savings</span>
                  <span className="text-[12px] uppercase tracking-wider opacity-70 font-semibold">Savings Rate</span>
                </div>
                <p className="font-['Manrope'] font-semibold text-xl">{savingsRate}%</p>
              </div>
            </div>
          </div>
        </section>

        {/* Insights + Top Spending - Bento Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="bg-[#8692fd] rounded-[32px] p-5 md:p-6 flex min-h-[168px] flex-col justify-between md:h-48 group hover:scale-[1.02] transition-transform duration-500">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-[#16238e] text-2xl">savings</span>
            </div>
            <div>
              <p className="text-[#16238e] text-[11px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">Savings Rate</p>
              <p className="font-['Manrope'] font-black text-3xl text-[#16238e]">{savingsRate}%</p>
            </div>
          </div>
          <div className="bg-zinc-900 rounded-[32px] p-5 md:p-6 flex min-h-[168px] flex-col justify-between md:h-48 group hover:scale-[1.02] transition-transform duration-500">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-white text-2xl">auto_awesome</span>
            </div>
            <div>
              <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em] mb-1">Total Logs</p>
              <p className="font-['Manrope'] font-black text-3xl text-white">{transactions.length}</p>
            </div>
          </div>
          {topCategories.slice(0, 2).map((cat) => (
            <div key={cat.name} className="bg-white rounded-[32px] p-5 md:p-6 border border-zinc-100 flex min-h-[168px] flex-col justify-between md:h-48 group hover:scale-[1.02] transition-transform duration-500 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                <span className="material-symbols-outlined text-2xl" style={{ color: cat.color }}>{cat.icon}</span>
              </div>
              <div>
                <p className="text-zinc-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1">{cat.name}</p>
                <p className="font-['Manrope'] font-black text-2xl text-zinc-900">{formatCurrency(cat.total, user.currency)}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Recent Activity */}
        <section className="opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="font-['Manrope'] font-semibold text-xl md:text-2xl">Recent Activity</h2>
            <Link href="/transactions" className="text-[#4854bb] font-semibold text-sm">
              View All
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-100">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-5xl text-zinc-300 mb-3 block">receipt_long</span>
                <p className="font-semibold text-zinc-900">No transactions yet</p>
                <p className="text-sm text-zinc-500 mt-1 mb-5">Capture a receipt or add your first transaction manually.</p>
                <Link href="/scan" className="inline-flex px-5 py-3 bg-black text-white rounded-xl font-semibold text-sm">
                  Capture Transaction
                </Link>
              </div>
            ) : recentTransactions.map((txn) => {
              const src = sourceIcons[txn.source] || sourceIcons['manual'];
              return (
                <div key={txn.id} className="flex items-start justify-between gap-3 p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center relative" style={{ backgroundColor: `${txn.category.color}15` }}>
                      <span className="material-symbols-outlined" style={{ color: txn.category.color }}>{txn.category.icon}</span>
                      <div className="absolute -top-1 -right-1 bg-white p-0.5 rounded-full shadow-sm border border-zinc-50">
                        <span className={`material-symbols-outlined text-[12px] ${src.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{src.icon}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-zinc-900 truncate">{txn.merchant}</p>
                      <p className="text-xs text-zinc-400 break-words">{txn.category.name} &middot; {timeAgo(txn.createdAt)}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-semibold text-sm sm:text-base ${txn.type === 'income' ? 'text-[#009844]' : 'text-zinc-900'}`}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, user.currency)}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{txn.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
