import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-[#f0f1f2]">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        {children}
      </main>
    </div>
  );
}
