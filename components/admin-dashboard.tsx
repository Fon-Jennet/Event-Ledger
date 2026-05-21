"use client";

import { DashboardLayout } from "./dashboard-layout";
import { MapPin, Send, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function AdminDashboard() {
  const [stats, setStats] = useState({ totalEvents: 0, totalUsers: 0, totalTickets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const eventsSnap = await getDocs(collection(db, "events"));
        const usersSnap = await getDocs(collection(db, "users"));
        const ticketsSnap = await getDocs(collection(db, "tickets"));
        
        setStats({
          totalEvents: eventsSnap.size,
          totalUsers: usersSnap.size,
          totalTickets: ticketsSnap.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
         setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <DashboardLayout title="Admin Overview" badges={["System Status: Nominal"]}>
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Users</p>
          <h3 className="text-2xl font-black text-slate-900 font-mono">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.totalUsers}
          </h3>
          <div className="mt-2 text-green-600 text-xs flex items-center font-bold">Platform Wide</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Events</p>
          <h3 className="text-2xl font-black text-slate-900 font-mono">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.totalEvents}
          </h3>
          <div className="mt-2 text-purple-600 text-xs flex items-center font-bold">Created</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Tickets Sold</p>
          <h3 className="text-2xl font-black text-slate-900 font-mono">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.totalTickets}
          </h3>
          <div className="mt-2 text-slate-400 text-xs flex items-center">System wide total</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Admin Status</p>
          <h3 className="text-2xl font-black text-purple-700 font-mono uppercase">Verified</h3>
          <div className="mt-2 text-slate-400 text-xs flex items-center">Permissions: All</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 pb-8 mt-8">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">System Events</h3>
          </div>
          <div className="space-y-3">
             <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                <p className="text-sm text-slate-700">Platform operational and analytics are tracking correctly.</p>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
