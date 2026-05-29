import { prisma } from '@/lib/prisma';
import OnboardingFlow from '@/components/OnboardingFlow';

export default async function OnboardingPage() {
  const user = await prisma.user.findFirst();

  return <OnboardingFlow initialUser={user ? JSON.parse(JSON.stringify(user)) : null} />;
}
