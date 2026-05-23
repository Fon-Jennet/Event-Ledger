"use client";

import { DashboardLayout } from "./dashboard-layout";
import { Search, MapPin, Calendar, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Event } from "@/lib/types";
import { DashboardCalendar } from "./dashboard-calendar";

export function AttendeeDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(
          collection(db, "events"),
          where("status", "==", "upcoming"),
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
  }, []);

  return (
    <DashboardLayout title="Discover Events" badges={[]}>
      <div className="flex gap-4 items-center mb-8">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search events, organizers, or locations..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          />
        </div>
        <button className="bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-50 flex items-center gap-2 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-500" />
          Pick Date
        </button>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-8">
        <div>
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-4">
            Upcoming Events
          </h3>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-pulse w-8 h-8 bg-purple-600 rounded-full"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center p-8 text-slate-500 bg-white rounded-xl border border-slate-200">
              No upcoming events found. Please check back later!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {events.map((event) => {
                const eventDate = new Date(event.date);
                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-purple-300 transition-all group flex flex-col"
                  >
                    <div className="h-40 bg-slate-200 relative overflow-hidden shrink-0">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 opacity-90 group-hover:scale-105 transition-transform duration-500 ${event.title.length % 2 === 0 ? "bg-gradient-to-br from-purple-500 to-indigo-600" : "bg-gradient-to-br from-blue-500 to-cyan-600"}`}
                        ></div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-700 uppercase tracking-widest leading-none truncate max-w-[120px]">
                        Event
                      </div>
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
                        {event.price === 0
                          ? "Free"
                          : `FCFA ${event.price.toLocaleString()}`}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h4 className="font-bold text-lg text-slate-900 leading-tight mb-2 line-clamp-2">
                        {event.title}
                      </h4>
                      <div className="space-y-1.5 text-xs text-slate-500 font-medium mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>
                            {eventDate.toLocaleString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                      <Link
                        href={`/events/${event.id}`}
                        className="mt-auto w-full bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-100"
                      >
                        View Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-4">
            Calendar Map
          </h3>
          <DashboardCalendar events={events} userRole="attendee" />
        </div>
      </div>
    </DashboardLayout>
  );
}
