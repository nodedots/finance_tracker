import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: 'No user found' }, { status: 404 });

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;
  const recentTransactions = transactions.slice(0, 5);

  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
    : 0;

  const categorySpending = transactions
    .filter(t => t.type === 'expense')
    .reduce<Record<string, { name: string; total: number; icon: string; color: string }>>((acc, t) => {
      const key = t.category.name;
      if (!acc[key]) acc[key] = { name: key, total: 0, icon: t.category.icon, color: t.category.color };
      acc[key].total += t.amount;
      return acc;
    }, {});

  const topCategories = Object.values(categorySpending)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return NextResponse.json({
    user: {
      name: user.name,
      plan: user.plan,
      currency: user.currency,
      location: user.location,
    },
    balance,
    totalIncome,
    totalExpenses,
    savingsRate,
    recentTransactions,
    topCategories,
    syncStatus: {
      sms: user.smsActive,
      email: user.gmailLinked,
    },
  });
}
