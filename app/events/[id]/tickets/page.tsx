"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEffect, useState, use } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Loader2,
  ArrowLeft,
  Phone,
  Clock,
  MessageSquare,
  QrCode,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TicketData {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userPhoto: string;
  ageCategory: string;
  purchasedAt: number;
}

export default function TicketRosterPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;
  const { profile } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      try {
        // Fetch Event Details (for the background banner)
        const eventSnap = await getDoc(doc(db, "events", eventId));
        if (eventSnap.exists()) setEvent(eventSnap.data());

        // Fetch Tickets
        const q = query(
          collection(db, "tickets"),
          where("eventId", "==", eventId),
        );
        const ticketSnap = await getDocs(q);
        const fetchedTickets = ticketSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as TicketData,
        );
        setTickets(
          fetchedTickets.sort((a, b) => b.purchasedAt - a.purchasedAt),
        );
      } catch (error) {
        console.error("Error fetching roster:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId, profile]);

  if (loading)
    return (
      <DashboardLayout title="Loading Roster..." badges={[]}>
        <Loader2 className="w-8 h-8 animate-spin mx-auto mt-20" />
      </DashboardLayout>
    );

  return (
    <DashboardLayout
      title={`Attendees: ${event?.title || "Event"}`}
      badges={[`${tickets.length} Sold`]}
    >
      <Link
        href="/events"
        className="text-sm text-purple-600 flex items-center gap-1 font-semibold hover:underline mb-6 w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Events
      </Link>

      {tickets.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          No tickets sold yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black group"
            >
              {/* Event Banner Background with dark overlay */}
              <div className="absolute inset-0 z-0">
                {event?.imageUrl && (
                  <img
                    src={event.imageUrl}
                    alt="banner"
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-30 transition-opacity"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/40" />
              </div>

              {/* Roster Card Content */}
              <div className="relative z-10 p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {/* Attendee Photo */}
                    <div className="w-12 h-12 rounded-full border-2 border-purple-500 overflow-hidden bg-slate-800 shrink-0">
                      {ticket.userPhoto ? (
                        <img
                          src={ticket.userPhoto}
                          alt="attendee"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                          {ticket.userName.substring(0, 2)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white leading-tight">
                        {ticket.userName}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {ticket.ageCategory}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-300 mt-auto pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />{" "}
                    {ticket.userPhone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {new Date(ticket.purchasedAt).toLocaleString()}
                  </div>
                </div>

                {/* Message Attendee Integration (From Phase 2.2) */}
                <button className="mt-4 w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 backdrop-blur-md transition-colors">
                  <MessageSquare className="w-4 h-4" /> Message Attendee
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
