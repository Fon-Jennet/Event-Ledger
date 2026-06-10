"use client";

import { DashboardLayout } from "./dashboard-layout";
import { Plus, Users, Ticket, MapPin } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Event } from "@/lib/types";
import { DashboardCalendar } from "./dashboard-calendar";

export function OrganizerDashboard() {
  //... Wait this is a short update. Let me adjust carefully.
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchEvents = async () => {
      try {
        const q = query(
          collection(db, "events"),
          where("organizerId", "==", profile.id),
        );
        const querySnapshot = await getDocs(q);
        const fetchedEvents = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Event,
        );
        fetchedEvents.sort((a, b) => a.date - b.date);
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [profile]);

  const totalSales = events.reduce(
    (acc, event) => acc + event.soldCount * event.price,
    0,
  );
  const activeEventsCount = events.filter((e) => {
    const eventDate = new Date(e.date);
    return e.status === "upcoming" && eventDate.getTime() >= Date.now();
  }).length;

  const totalSoldCount = events.reduce(
    (acc, event) => acc + event.soldCount,
    0,
  );

  return (
    <DashboardLayout title="My Events" badges={["Organizer Mode"]}>
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            Total Sales
          </p>
          <h3 className="text-2xl font-black text-slate-900 font-mono">
            FCFA {totalSales.toLocaleString()}
          </h3>
          <div className="mt-2 text-green-600 text-xs flex items-center font-bold">
            From active events
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            Active Events
          </p>
          <h3 className="text-2xl font-black text-slate-900 font-mono">
            {activeEventsCount}
          </h3>
          <div className="mt-2 text-purple-600 text-xs flex items-center font-bold">
            Live right now
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            Tickets Sold
          </p>
          <h3 className="text-2xl font-black text-slate-900 font-mono">
            {totalSoldCount}
          </h3>
          <div className="mt-2 text-slate-400 text-xs flex items-center">
            Total across all events
          </div>
        </div>
        <div className="bg-purple-600 p-6 rounded-xl border border-purple-500 shadow-sm text-white flex flex-col justify-center items-center text-center">
          <Link
            href="/events/new"
            className="hover:scale-105 transition-transform flex flex-col items-center group"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30 transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-bold">Create New Event</span>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-[1fr_300px] gap-8">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">
            Manage Events
          </h3>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-pulse w-8 h-8 rounded-full bg-purple-600"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center p-8 bg-slate-100 rounded-xl border border-slate-200 text-slate-500">
              No events found. Start by creating one!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {events.map((event) => {
                const eventDate = new Date(event.date);
                const month = eventDate.toLocaleString("default", {
                  month: "short",
                });
                const day = eventDate.getDate().toString().padStart(2, "0");

                return (
                  <div
                    key={event.id}
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-purple-300 transition-all shadow-sm flex flex-col"
                  >
                    <div className="h-32 bg-slate-100 rounded-t-xl -mx-5 -mt-5 mb-4 relative overflow-hidden shrink-0 border-b border-slate-200">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 opacity-90 ${event.title.length % 2 === 0 ? "bg-gradient-to-br from-purple-500 to-indigo-600" : "bg-gradient-to-br from-blue-500 to-cyan-600"}`}
                        ></div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold uppercase shadow-sm ${
                            eventDate.getTime() < Date.now()
                              ? "bg-slate-100 text-slate-700"
                              : event.status === "upcoming"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {eventDate.getTime() < Date.now()
                            ? "completed"
                            : event.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex flex-col items-center justify-center border border-slate-200 shrink-0">
                          <span className="text-[10px] font-bold text-purple-600 uppercase">
                            {month}
                          </span>
                          <span className="text-lg font-black leading-none">
                            {day}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg line-clamp-1">
                            {event.title}
                          </h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[200px]">
                              {event.location}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-end mt-auto pt-4 border-t border-slate-100">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-medium">
                          Sales
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          FCFA{" "}
                          {(event.soldCount * event.price).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-xs text-slate-500 font-medium">
                          Attendees
                        </p>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-purple-500" />
                          <p className="text-sm font-bold text-slate-900">
                            {event.soldCount} / {event.capacity}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Link
                        href={`/events/${event.id}/edit`}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded text-sm font-medium transition-colors text-center inline-block"
                      >
                        Edit Details
                      </Link>
                      <Link
                        href={`/events/${event.id}/scan`}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 py-2 rounded text-sm font-medium transition-colors text-center inline-block"
                      >
                        Scan Tickets
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">
            Calendar
          </h3>
          <DashboardCalendar events={events} userRole="organizer" />
        </div>
      </div>
    </DashboardLayout>
  );
}
