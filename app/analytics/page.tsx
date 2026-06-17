"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Event, Ticket } from "@/lib/types";
import { Loader2, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    upcomingEvents: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!profile || (profile.role !== "admin" && profile.role !== "organizer"))
      return;

    const fetchAnalytics = async () => {
      try {
        let eventsQuery;
        if (profile.role === "admin") {
          eventsQuery = query(collection(db, "events"));
        } else {
          eventsQuery = query(
            collection(db, "events"),
            where("organizerId", "==", profile.id),
          );
        }

        const eventsSnapshot = await getDocs(eventsQuery);
        const events = eventsSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Event,
        );

        let totalTickets = 0;
        let totalRev = 0;
        let upcoming = 0;
        const dataForChart: any[] = [];

        events.forEach((evt) => {
          totalTickets += evt.soldCount;
          totalRev += evt.soldCount * evt.price;
          if (evt.status === "upcoming") upcoming++;

          dataForChart.push({
            name:
              evt.title.substring(0, 15) + (evt.title.length > 15 ? "..." : ""),
            sales: evt.soldCount * evt.price,
            tickets: evt.soldCount,
          });
        });

        // Get top 5 events by sales
        dataForChart.sort((a, b) => b.sales - a.sales);

        setStats({
          totalEvents: events.length,
          totalTicketsSold: totalTickets,
          totalRevenue: totalRev,
          upcomingEvents: upcoming,
        });
        setChartData(dataForChart.slice(0, 5));
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [profile]);

  if (!profile || (profile.role !== "admin" && profile.role !== "organizer")) {
    return (
      <DashboardLayout title="Analytics">
        <div className="p-8 text-center text-slate-500">
          Unauthorised access. Only organizers and admins can view analytics.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Analytics & Reports" badges={["Live Data"]}>
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Total Events
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {stats.totalEvents}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tickets Sold
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {stats.totalTicketsSold}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Revenue
                </div>
                <div className="text-2xl font-black text-slate-900">
                  FCFA {stats.totalRevenue}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Upcoming
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {stats.upcomingEvents}
                </div>
              </div>
            </div>
          </div>

          
        </div>
      )}
    </DashboardLayout>
  );
}
