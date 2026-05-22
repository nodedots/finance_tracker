import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json([]);

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(categories);
}
