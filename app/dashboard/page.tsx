"use client";

import { useAuth } from "@/lib/auth-context";
import { AdminDashboard } from "@/components/admin-dashboard";
import { OrganizerDashboard } from "@/components/organizer-dashboard";
import { AttendeeDashboard } from "@/components/attendee-dashboard";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function Home() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout title="Loading..." badges={[]}>
        <div className="flex items-center justify-center p-12 h-full w-full">
          <div className="animate-pulse w-10 h-10 bg-purple-600 rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || profile?.role === "attendee") {
    return <AttendeeDashboard />;
  }

  if (profile?.role === "admin") {
    return <AdminDashboard />;
  }

  if (profile?.role === "organizer") {
    return <OrganizerDashboard />;
  }

  return (
    <DashboardLayout title="Welcome" badges={[]}>
      <div className="text-center p-8 text-slate-500">Unknown role</div>
    </DashboardLayout>
  );
}
