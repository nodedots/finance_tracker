import { prisma } from '@/lib/prisma';
import TransactionsList from '@/components/TransactionsList';

export default async function TransactionsPage() {
  const user = await prisma.user.findFirst();
  if (!user) return <p className="p-8">No user found.</p>;

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="bg-white border-b border-zinc-100 px-6 py-5 md:px-10 md:py-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-['Manrope'] font-bold text-2xl md:text-3xl text-zinc-900">Transactions</h1>
          <p className="text-zinc-500 text-sm mt-1">{transactions.length} transactions total</p>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-6">
        <TransactionsList
          initialTransactions={JSON.parse(JSON.stringify(transactions))}
          categories={JSON.parse(JSON.stringify(categories))}
          currency={user.currency}
        />
      </div>
    </div>
  );
}
