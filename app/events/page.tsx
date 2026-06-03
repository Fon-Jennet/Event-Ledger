"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Event } from "@/lib/types";
import {
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  Loader2,
  ArrowRight,
  QrCode,
  Tag,
  Plus,
  Image as ImageIcon,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EventsPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    let q;
    if (profile.role === "admin") {
      q = query(collection(db, "events"));
    } else if (profile.role === "organizer") {
      q = query(
        collection(db, "events"),
        where("organizerId", "==", profile.id),
      );
    } else {
      return;
    }

    // 🟢 REAL-TIME LISTENER
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedEvents = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Event,
        );
        fetchedEvents.sort((a, b) => b.date - a.date); // Sort newest first
        setEvents(fetchedEvents);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching events:", error);
        toast.error("Failed to sync events data.");
        setLoading(false);
      },
    );

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [profile]);

  const handleDelete = async (eventId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone.",
      )
    )
      return;
    try {
      await deleteDoc(doc(db, "events", eventId));
      toast.success("Event deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete event");
    }
  };

  if (!profile || (profile.role !== "admin" && profile.role !== "organizer")) {
    return (
      <DashboardLayout title="Events">
        <div className="p-8 text-center text-slate-500">
          Unauthorised access.
        </div>
      </DashboardLayout>
    );
  }

  // Format helper for dates
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      dateString: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      timeString: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  return (
    <DashboardLayout
      title={profile.role === "admin" ? "All Events" : "My Events"}
      badges={[`${events.length} Total`]}
    >
      {/* Top Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-slate-500">
          Manage and monitor your event portfolio.
        </p>
        <Link
          href="/events/new"
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 text-sm"
        >
          <Plus className="w-4 h-4" /> Create Event
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center p-16 bg-white rounded-2xl border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            No events found
          </h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            You haven't created any events yet. Get started by setting up your
            first event.
          </p>
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-purple-600/20"
          >
            Create Your First Event <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {events.map((event) => {
            const { dateString, timeString } = formatDate(event.date);
            const soldCount = event.soldCount || 0;
            const salesPercentage = Math.min(
              Math.round((soldCount / event.capacity) * 100),
              100,
            );

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 flex flex-col group"
              >
                {/* Event Image Header */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <ImageIcon className="w-10 h-10 text-slate-300" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                        event.status === "upcoming"
                          ? "bg-emerald-500/90 text-white"
                          : event.status === "cancelled"
                            ? "bg-red-500/90 text-white"
                            : "bg-slate-800/90 text-white"
                      }`}
                    >
                      {event.status}
                    </span>
                    {event.eventType && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/90 text-purple-700 shadow-sm backdrop-blur-md flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {event.eventType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Event Details Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-slate-900 mb-3 line-clamp-2 leading-tight group-hover:text-purple-600 transition-colors">
                    {event.title}
                  </h3>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
                      <span>
                        {dateString}{" "}
                        <span className="text-slate-400 mx-1">•</span>{" "}
                        {timeString}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-purple-500 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Banknote className="w-4 h-4 text-purple-500 shrink-0" />
                      <span className="font-semibold text-slate-900">
                        {event.price > 0
                          ? `FCFA ${event.price.toLocaleString()}`
                          : "Free Event"}
                      </span>
                    </div>
                  </div>

                  {/* Sales Progress */}
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {soldCount} / {event.capacity} Sold
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                        {salesPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${salesPercentage >= 100 ? "bg-emerald-500" : "bg-purple-500"}`}
                        style={{ width: `${salesPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50">
                  <Link
                    href={`/events/${event.id}/scan`}
                    className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-purple-600 hover:bg-purple-100 transition-colors"
                  >
                    <QrCode className="w-4 h-4" /> SCAN
                  </Link>
                  <Link
                    href={`/events/${event.id}/edit`}
                    className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" /> EDIT
                  </Link>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> DELETE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}