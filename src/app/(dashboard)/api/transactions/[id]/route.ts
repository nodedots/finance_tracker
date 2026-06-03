import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type TransactionRouteContext = {
  params: Promise<{ id: string }>;
};

async function getCurrentUser() {
  return prisma.user.findFirst();
}

export async function PATCH(request: Request, { params }: TransactionRouteContext) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'No user found' }, { status: 404 });
  }

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  const body = await request.json();

  if (body.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: body.categoryId, userId: user.id },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      merchant: String(body.merchant || '').trim(),
      amount,
      type: body.type,
      source: body.source || 'manual',
      status: body.status || 'approved',
      note: body.note || null,
      categoryId: body.categoryId,
    },
    include: { category: true },
  });

  return NextResponse.json(transaction);
}

export async function DELETE(_request: Request, { params }: TransactionRouteContext) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'No user found' }, { status: 404 });
  }

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
