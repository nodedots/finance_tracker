import { prisma } from '@/lib/prisma';

export const defaultCategories = [
  { name: 'Shopping', icon: 'shopping_bag', color: '#4854bb' },
  { name: 'Food', icon: 'restaurant', color: '#e65100' },
  { name: 'Transport', icon: 'directions_car', color: '#1565c0' },
  { name: 'Utility', icon: 'bolt', color: '#f9a825' },
  { name: 'Subscription', icon: 'subscriptions', color: '#6a1b9a' },
  { name: 'Income', icon: 'account_balance_wallet', color: '#009844' },
  { name: 'Entertainment', icon: 'movie', color: '#c62828' },
  { name: 'Health', icon: 'health_and_safety', color: '#00897b' },
  { name: 'Markets', icon: 'local_grocery_store', color: '#2e7d32' },
  { name: 'Rent', icon: 'home', color: '#37474f' },
];

export async function ensureDefaultCategories(userId: string) {
  await Promise.all(
    defaultCategories.map(category =>
      prisma.category.upsert({
        where: {
          userId_name: {
            userId,
            name: category.name,
          },
        },
        update: {},
        create: {
          ...category,
          userId,
        },
      })
    )
  );
}
