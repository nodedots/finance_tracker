import { prisma } from '@/lib/prisma';
import SettingsContent from '@/components/SettingsContent';
import Link from 'next/link';

export default async function SettingsPage() {
  const user = await prisma.user.findFirst();
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white border border-zinc-100 rounded-2xl p-8">
          <h1 className="font-['Manrope'] font-bold text-2xl text-zinc-900 mb-2">No account yet</h1>
          <p className="text-sm text-zinc-500 mb-6">Create your account to manage preferences and connections.</p>
          <Link href="/onboarding" className="inline-flex justify-center w-full bg-black text-white py-3 rounded-xl font-semibold">
            Start Setup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6 md:pb-8">
      <header className="bg-white border-b border-zinc-100 px-4 py-4 sm:px-6 md:px-10 md:py-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-['Manrope'] font-bold text-2xl md:text-3xl text-zinc-900">Settings</h1>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-10 py-5 md:py-6">
        <SettingsContent initialUser={JSON.parse(JSON.stringify(user))} />
      </div>
    </div>
  );
}
