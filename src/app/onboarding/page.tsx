import { prisma } from '@/lib/prisma';
import OnboardingFlow from '@/components/OnboardingFlow';

export default async function OnboardingPage() {
  const user = await prisma.user.findFirst();
  if (!user) return <p className="p-8">No user found. Please seed the database.</p>;

  return <OnboardingFlow initialUser={JSON.parse(JSON.stringify(user))} />;
}
