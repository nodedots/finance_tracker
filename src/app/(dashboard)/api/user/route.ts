import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: 'No user found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: 'No user found' }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: body,
  });
  return NextResponse.json(updated);
}
