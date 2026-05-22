import { prisma } from '@/lib/prisma';
import SettingsContent from '@/components/SettingsContent';

export default async function SettingsPage() {
  const user = await prisma.user.findFirst();
  if (!user) return <p className="p-8">No user found.</p>;

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="bg-white border-b border-zinc-100 px-6 py-5 md:px-10 md:py-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-['Manrope'] font-bold text-2xl md:text-3xl text-zinc-900">Settings</h1>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-6">
        <SettingsContent initialUser={JSON.parse(JSON.stringify(user))} />
      </div>
    </div>
  );
}
