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
      name: 'Amina Bello',
      email: 'amina.bello@example.ng',
      plan: 'pro',
      currency: 'NGN',
      location: 'Abuja, Nigeria',
      pushNotifications: true,
      gmailLinked: true,
      smsActive: true,
      cameraEnabled: true,
    },
  });

  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Shopping', icon: 'shopping_bag', color: '#4854bb', userId: user.id } }),
    prisma.category.create({ data: { name: 'Food', icon: 'restaurant', color: '#e65100', userId: user.id } }),
    prisma.category.create({ data: { name: 'Transport', icon: 'directions_car', color: '#1565c0', userId: user.id } }),
    prisma.category.create({ data: { name: 'Utility', icon: 'bolt', color: '#f9a825', userId: user.id } }),
    prisma.category.create({ data: { name: 'Subscription', icon: 'subscriptions', color: '#6a1b9a', userId: user.id } }),
    prisma.category.create({ data: { name: 'Income', icon: 'account_balance_wallet', color: '#009844', userId: user.id } }),
    prisma.category.create({ data: { name: 'Entertainment', icon: 'movie', color: '#c62828', userId: user.id } }),
    prisma.category.create({ data: { name: 'Health', icon: 'health_and_safety', color: '#00897b', userId: user.id } }),
    prisma.category.create({ data: { name: 'Markets', icon: 'local_grocery_store', color: '#2e7d32', userId: user.id, budget: 180000 } }),
    prisma.category.create({ data: { name: 'Rent', icon: 'home', color: '#37474f', userId: user.id, budget: 450000 } }),
  ]);

  const catMap = Object.fromEntries(categories.map(c => [c.name, c.id]));

  const now = new Date();
  const txns = [
    { merchant: 'Jabi Lake Mall', amount: 74500, type: 'expense', source: 'email', status: 'approved', categoryId: catMap['Shopping'], hoursAgo: 2 },
    { merchant: 'BluCab Cafe, Wuse 2', amount: 8200, type: 'expense', source: 'receipt', status: 'matched', categoryId: catMap['Food'], hoursAgo: 6 },
    { merchant: 'Bolt Abuja', amount: 6200, type: 'expense', source: 'sms', status: 'verified', categoryId: catMap['Transport'], hoursAgo: 28 },
    { merchant: 'Monthly Salary', amount: 850000, type: 'income', source: 'email', status: 'approved', categoryId: catMap['Income'], hoursAgo: 5 },
    { merchant: 'Netflix Nigeria', amount: 5500, type: 'expense', source: 'email', status: 'approved', categoryId: catMap['Subscription'], hoursAgo: 48 },
    { merchant: 'Wuse Market', amount: 48200, type: 'expense', source: 'sms', status: 'approved', categoryId: catMap['Markets'], hoursAgo: 52 },
    { merchant: 'Abuja Electricity Distribution', amount: 32500, type: 'expense', source: 'email', status: 'verified', categoryId: catMap['Utility'], hoursAgo: 72 },
    { merchant: 'MTN Data Bundle', amount: 12000, type: 'expense', source: 'sms', status: 'approved', categoryId: catMap['Subscription'], hoursAgo: 96 },
    { merchant: 'Sahad Stores', amount: 38650, type: 'expense', source: 'receipt', status: 'matched', categoryId: catMap['Shopping'], hoursAgo: 120 },
    { merchant: 'NNPC Fuel Station, Garki', amount: 45000, type: 'expense', source: 'sms', status: 'approved', categoryId: catMap['Transport'], hoursAgo: 144 },
    { merchant: 'Silverbird Cinemas Abuja', amount: 18000, type: 'expense', source: 'receipt', status: 'approved', categoryId: catMap['Entertainment'], hoursAgo: 168 },
    { merchant: 'H-Medix Pharmacy', amount: 19500, type: 'expense', source: 'sms', status: 'verified', categoryId: catMap['Health'], hoursAgo: 192 },
    { merchant: 'Consulting Retainer', amount: 220000, type: 'income', source: 'email', status: 'approved', categoryId: catMap['Income'], hoursAgo: 200 },
    { merchant: 'Maitama Apartment Rent', amount: 450000, type: 'expense', source: 'manual', status: 'approved', categoryId: catMap['Rent'], hoursAgo: 240 },
    { merchant: 'Kilishi Hub, Area 11', amount: 7300, type: 'expense', source: 'sms', status: 'approved', categoryId: catMap['Food'], hoursAgo: 260 },
    { merchant: 'Konga Order', amount: 24900, type: 'expense', source: 'email', status: 'approved', categoryId: catMap['Shopping'], hoursAgo: 288 },
    { merchant: 'Fitness Central Abuja', amount: 35000, type: 'expense', source: 'email', status: 'approved', categoryId: catMap['Health'], hoursAgo: 312 },
    { merchant: 'Cafe de Vie, Wuse', amount: 6800, type: 'expense', source: 'receipt', status: 'matched', categoryId: catMap['Food'], hoursAgo: 336 },
    { merchant: 'FCT Water Board', amount: 18000, type: 'expense', source: 'email', status: 'verified', categoryId: catMap['Utility'], hoursAgo: 360 },
    { merchant: 'Side Project Income', amount: 150000, type: 'income', source: 'manual', status: 'approved', categoryId: catMap['Income'], hoursAgo: 400 },
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
