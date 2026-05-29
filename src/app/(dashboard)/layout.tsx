import Sidebar from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await prisma.user.findFirst();

  return (
    <div className="flex min-h-screen bg-[#f0f1f2]">
      <Sidebar user={user ? JSON.parse(JSON.stringify(user)) : null} />
      <main className="flex-1 pb-20 md:ml-64 md:pb-0">
        {children}
      </main>
    </div>
  );
}
