import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client/index.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __seedDir = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__seedDir, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: 'Alex Thompson',
      email: 'alex.thompson@prime.com',
      plan: 'pro',
      currency: 'USD',
      pushNotifications: true,
      gmailLinked: true,
      smsActive: true,
      cameraEnabled: true,
    },
  });

  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Shopping', icon: 'shopping_bag', color: '#4854bb', userId: user.id } }),
    prisma.category.create({ data: { name: 'Dining', icon: 'restaurant', color: '#e65100', userId: user.id } }),
    prisma.category.create({ data: { name: 'Transport', icon: 'directions_car', color: '#1565c0', userId: user.id } }),
    prisma.category.create({ data: { name: 'Utility', icon: 'bolt', color: '#f9a825', userId: user.id } }),
    prisma.category.create({ data: { name: 'Subscription', icon: 'subscriptions', color: '#6a1b9a', userId: user.id } }),
    prisma.category.create({ data: { name: 'Income', icon: 'account_balance_wallet', color: '#009844', userId: user.id } }),
    prisma.category.create({ data: { name: 'Entertainment', icon: 'movie', color: '#c62828', userId: user.id } }),
    prisma.category.create({ data: { name: 'Health', icon: 'health_and_safety', color: '#00897b', userId: user.id } }),
    prisma.category.create({ data: { name: 'Groceries', icon: 'local_grocery_store', color: '#2e7d32', userId: user.id, budget: 400 } }),
    prisma.category.create({ data: { name: 'Housing', icon: 'home', color: '#37474f', userId: user.id, budget: 1500 } }),
  ]);

  const catMap = Object.fromEntries(categories.map(c => [c.name, c.id]));

  const now = new Date();
  const txns = [
    { merchant: 'Apple Store', amount: 149.00, type: 'expense', source: 'email', status: 'approved', categoryId: catMap['Shopping'], hoursAgo: 2 },
    { merchant: 'Blue Bottle Coffee', amount: 6.50, type: 'expense', source: 'receipt', status: 'matched', categoryId: catMap['Dining'], hoursAgo: 6 },
    { merchant: 'Uber', amount: 24.30, type: 'expense', source: 'sms', status: 'verified', categoryId: catMap['Transport'], hoursAgo: 28 },
    { merchant: 'Monthly Salary', amount: 4250.00, type: 'income', source: 'email', status: 'approved', categoryId: catMap['Income'], hoursAgo: 5 },
    { merchant: 'Netflix', amount: 15.99, type: 'expense', source: 'email', status: 'approved', categoryId: catMap['Subscription'], hoursAgo: 48 },
    { merchant: 'Whole Foods', amount: 87.43, type: 'expense', source: 'sms', status: 'approved', categoryId: catMap['Groceries'], hoursAgo: 52 },
    { merchant: 'Electric Company', amount: 128.00, type: 'expense', source: 'email', status: 'verified', categoryId: catMap['Utility'], hoursAgo: 72 },
    { merchant: 'Spotify', amount: 12.99, type: 'expense', source: 'email', status: 'approved', categoryId: catMap['Subscription'], hoursAgo: 96 },
    { merchant: 'Target', amount: 63.21, type: 'expense', source: 'receipt', status: 'matched', categoryId: catMap['Shopping'], hoursAgo: 120 },
    { merchant: 'Shell Gas', amount: 45.00, type: 'expense', source: 'sms', status: 'approved', categoryId: catMap['Transport'], hoursAgo: 144 },
    { merchant: 'AMC Theaters', amount: 32.00, type: 'expense', source: 'receipt', status: 'approved', categoryId: catMap['Entertainment'], hoursAgo: 168 },
    { merchant: 'CVS Pharmacy', amount: 19.50, type: 'expense', source: 'sms', status: 'verified', categoryId: catMap['Health'], hoursAgo: 192 },
    { merchant: 'Freelance Payment', amount: 800.00, type: 'income', source: 'email', status: 'approved', categoryId: catMap['Income'], hoursAgo: 200 },
    { merchant: 'Rent Payment', amount: 1450.00, type: 'expense', source: 'manual', status: 'approved', categoryId: catMap['Housing'], hoursAgo: 240 },
    { merchant: 'Chipotle', amount: 14.25, type: 'expense', source: 'sms', status: 'approved', categoryId: catMap['Dining'], hoursAgo: 260 },
    { merchant: 'Amazon', amount: 34.99, type: 'expense', source: 'email', status: 'approved', categoryId: catMap['Shopping'], hoursAgo: 288 },
    { merchant: 'Gym Membership', amount: 49.99, type: 'expense', source: 'email', status: 'approved', categoryId: catMap['Health'], hoursAgo: 312 },
    { merchant: 'Starbucks', amount: 5.75, type: 'expense', source: 'receipt', status: 'matched', categoryId: catMap['Dining'], hoursAgo: 336 },
    { merchant: 'Water Bill', amount: 42.00, type: 'expense', source: 'email', status: 'verified', categoryId: catMap['Utility'], hoursAgo: 360 },
    { merchant: 'Side Project Income', amount: 350.00, type: 'income', source: 'manual', status: 'approved', categoryId: catMap['Income'], hoursAgo: 400 },
  ];

  for (const txn of txns) {
    const createdAt = new Date(now.getTime() - txn.hoursAgo * 60 * 60 * 1000);
    await prisma.transaction.create({
      data: {
        merchant: txn.merchant,
        amount: txn.amount,
        type: txn.type,
        source: txn.source,
        status: txn.status,
        categoryId: txn.categoryId,
        userId: user.id,
        createdAt,
      },
    });
  }

  console.log('Seeded database with user, categories, and transactions.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
