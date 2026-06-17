import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export function DashboardLayout({
  children,
  title,
  badges = [],
}: {
  children: React.ReactNode;
  title?: string;
  badges?: string[];
}) {
  return (
    <div className="w-full h-screen bg-slate-50 flex overflow-hidden font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <Header title={title} badges={badges} />

        {/* Responsive padding: phone/tablet/laptop */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6 sm:space-y-8">
          {children}
        </div>

        <Footer />
      </div>
    </div>
  );
}
