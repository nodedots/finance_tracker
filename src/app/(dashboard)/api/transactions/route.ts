import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json([]);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      ...(search && {
        merchant: { contains: search },
      }),
      ...(category && {
        category: { name: category },
      }),
    },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: 'No user found' }, { status: 404 });

  const transaction = await prisma.transaction.create({
    data: {
      merchant: body.merchant,
      amount: body.amount,
      type: body.type,
      source: body.source || 'manual',
      status: body.status || 'approved',
      note: body.note || null,
      categoryId: body.categoryId,
      userId: user.id,
    },
    include: { category: true },
  });

  return NextResponse.json(transaction, { status: 201 });
}
