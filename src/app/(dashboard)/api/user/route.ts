import { prisma } from '@/lib/prisma';
import { ensureDefaultCategories } from '@/lib/categories';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: 'No user found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = typeof body.email === 'string' && body.email.trim()
    ? body.email.trim().toLowerCase()
    : null;

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: body.name || inferNameFromEmail(email),
      location: body.location || 'Nigeria',
      currency: body.currency || 'NGN',
    },
    create: {
      name: body.name || inferNameFromEmail(email),
      email,
      location: body.location || 'Nigeria',
      currency: body.currency || 'NGN',
      plan: 'free',
    },
  });

  await ensureDefaultCategories(user.id);
  return NextResponse.json(user, { status: 201 });
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

function inferNameFromEmail(email: string) {
  const localPart = email.split('@')[0] || 'User';
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
