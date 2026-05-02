import React from 'react';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';
import FAB from '@/components/FAB';

export default function Dashboard() {
  return (
    <>
      <TopAppBar title="Fintrack" />
      
      <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
        {/* Status Indicators (Sync Status) */}
        <section className="mb-8 opacity-0 animate-[fade-in-up_0.5s_ease-out_forwards]" style={{ animationDelay: '50ms' }}>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f3f4f5] border border-[#c7c6ca]/30">
              <span className="w-2 h-2 rounded-full bg-[#009844] animate-pulse"></span>
              <span className="font-label-md text-[14px] text-[#46464a]">SMS Sync Active</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f3f4f5] border border-[#c7c6ca]/30">
              <span className="w-2 h-2 rounded-full bg-[#009844] animate-pulse"></span>
              <span className="font-label-md text-[14px] text-[#46464a]">Email Scanning</span>
            </div>
          </div>
        </section>

        {/* Financial Snapshot Hero */}
        <section className="mb-10 opacity-0 animate-[fade-in-up_0.5s_ease-out_forwards]" style={{ animationDelay: '150ms' }}>
          <div className="bg-black rounded-3xl p-8 text-white shadow-2xl shadow-black/20 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <p className="font-label-md text-[14px] opacity-70 mb-1">Total Balance</p>
            <h1 className="mb-6 text-[48px] font-semibold leading-[1.2] tracking-[-0.02em] font-manrope">$12,480.50</h1>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm">arrow_downward</span>
                  <span className="font-label-md text-[12px] uppercase tracking-wider opacity-70">Income</span>
                </div>
                <p className="font-headline-md text-[20px] font-semibold font-manrope">$4,250.00</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm">arrow_upward</span>
                  <span className="font-label-md text-[12px] uppercase tracking-wider opacity-70">Expenses</span>
                </div>
                <p className="font-headline-md text-[20px] font-semibold font-manrope">$2,180.40</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Insights */}
        <section className="mb-10 opacity-0 animate-[fade-in-up_0.5s_ease-out_forwards]" style={{ animationDelay: '250ms' }}>
          <h2 className="font-manrope text-[24px] font-semibold mb-4">Financial Insights</h2>
          <div className="bento-grid">
            <div className="col-span-1 bg-[#8692fd] rounded-3xl p-5 flex flex-col justify-between aspect-square">
              <span className="material-symbols-outlined text-[#16238e] text-3xl">savings</span>
              <div>
                <p className="font-label-md text-[#16238e] text-[12px] uppercase mb-1">Savings Goal</p>
                <p className="font-manrope font-semibold text-[18px] text-[#16238e]">84% reached</p>
              </div>
            </div>
            <div className="col-span-1 bg-[#e1e3e4] rounded-3xl p-5 flex flex-col justify-between aspect-square">
              <span className="material-symbols-outlined text-[#191c1d] text-3xl">auto_awesome</span>
              <div>
                <p className="font-label-md text-[#46464a] text-[12px] uppercase mb-1">Smart Tip</p>
                <p className="font-manrope font-semibold text-[16px] leading-tight text-[#191c1d]">Reduce dining by $50 this week</p>
              </div>
            </div>
          </div>
        </section>

        {/* Transaction Feed */}
        <section className="mb-6 opacity-0 animate-[fade-in-up_0.5s_ease-out_forwards]" style={{ animationDelay: '350ms' }}>
          <div className="flex justify-between items-end mb-6">
            <h2 className="font-manrope font-semibold text-[24px]">Recent Activity</h2>
            <button className="text-[#4854bb] font-label-md text-[14px] font-semibold">View All</button>
          </div>
          <div className="space-y-4">
            
            {/* Transaction Item */}
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#edeeef] flex items-center justify-center">
                  <span className="material-symbols-outlined text-zinc-600">shopping_bag</span>
                </div>
                <div>
                  <p className="font-manrope font-semibold text-[16px] text-zinc-900">Apple Store</p>
                  <p className="font-inter text-[13px] text-zinc-500">Subscription • 2h ago</p>
                </div>
              </div>
              <p className="font-manrope font-semibold text-[16px] text-zinc-900">-$12.99</p>
            </div>
            
            {/* Transaction Item */}
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#009844]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#009844]">account_balance_wallet</span>
                </div>
                <div>
                  <p className="font-manrope font-semibold text-[16px] text-zinc-900">Monthly Salary</p>
                  <p className="font-inter text-[13px] text-zinc-500">Income • 5h ago</p>
                </div>
              </div>
              <p className="font-manrope font-semibold text-[16px] text-[#009844]">+$3,200.00</p>
            </div>

          </div>
        </section>
      </main>

      <FAB />
      <BottomNavBar />
    </>
  );
}
