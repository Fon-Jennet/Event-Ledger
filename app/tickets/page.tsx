"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ticket, Event } from "@/lib/types";
import { Calendar, MapPin, Loader2, ArrowRight, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

interface TicketWithEvent extends Ticket {
  event?: Event;
}

export default function TicketsPage() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<TicketWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  // NEW: State to manage the open dialog
  const [selectedTicket, setSelectedTicket] = useState<TicketWithEvent | null>(
    null,
  );

  useEffect(() => {
    if (!user) return;
    const fetchTickets = async () => {
      try {
        const q = query(
          collection(db, "tickets"),
          where("userId", "==", user.uid),
        );
        const querySnapshot = await getDocs(q);

        const fetchedTickets: TicketWithEvent[] = [];
        for (const ticketDoc of querySnapshot.docs) {
          const ticketData = {
            id: ticketDoc.id,
            ...ticketDoc.data(),
          } as TicketWithEvent;

          const eventRef = doc(db, "events", ticketData.eventId);
          const eventSnap = await getDoc(eventRef);
          if (eventSnap.exists()) {
            ticketData.event = {
              id: eventSnap.id,
              ...eventSnap.data(),
            } as Event;
          }
          fetchedTickets.push(ticketData);
        }

        fetchedTickets.sort(
          (a, b) => (a.event?.date || 0) - (b.event?.date || 0),
        );
        setTickets(fetchedTickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [user]);

  if (!profile || profile.role !== "attendee") {
    return (
      <DashboardLayout title="My Tickets">
        <div className="p-8 text-center text-slate-500">
          Only attendees can purchase and view tickets.
        </div>
      </DashboardLayout>
    );
  }

  // Helper component to render the ticket structure to avoid code duplication
  const TicketCard = ({
    ticket,
    isLarge = false,
  }: {
    ticket: TicketWithEvent;
    isLarge?: boolean;
  }) => {
    const isScanned = ticket.status === "scanned";
    return (
      <div
        className={`bg-white rounded-xl border flex flex-col overflow-hidden shadow-sm transition-all w-full h-full ${isScanned ? "border-slate-200 opacity-60" : "border-purple-200"} ${isLarge ? "md:flex-row" : ""}`}
      >
        {ticket.event?.imageUrl && (
          <div
            className={`${isLarge ? "md:w-2/5 md:h-auto h-48" : "h-24 w-full"} bg-slate-200 shrink-0 border-b md:border-b-0 md:border-r border-slate-200`}
          >
            <img
              src={ticket.event.imageUrl}
              alt="Event Banner"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className={`flex flex-1 ${isLarge ? "flex-col md:flex-row" : ""}`}>
          <div
            className={`p-6 flex-1 border-r border-dashed border-slate-300 relative flex flex-col justify-between ${isLarge ? "md:p-10" : ""}`}
          >
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-4 h-4 bg-slate-50 rounded-full border-b border-l border-slate-300"></div>
            <div className="absolute bottom-0 right-0 -mb-2 -mr-2 w-4 h-4 bg-slate-50 rounded-full border-t border-l border-slate-300"></div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${isScanned ? "bg-slate-100 text-slate-500" : "bg-purple-100 text-purple-700"}`}
                >
                  {ticket.status}
                </span>
              </div>
              <h3
                className={`${isLarge ? "text-3xl" : "text-lg"} font-bold text-slate-900 mb-1`}
              >
                {ticket.event?.title || "Unknown Event"}
              </h3>
              <p
                className={`${isLarge ? "text-sm" : "text-xs"} text-slate-500 font-medium`}
              >
                FCFA {ticket.price} Paid
              </p>
            </div>

            <div
              className={`space-y-2 mt-4 font-medium text-slate-600 ${isLarge ? "text-lg mt-8" : "text-sm"}`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                {ticket.event
                  ? new Date(ticket.event.date).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "TBA"}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-400" />
                <span className="truncate">
                  {ticket.event?.location || "TBA"}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`p-6 bg-slate-50 flex flex-col items-center justify-center relative ${isLarge ? "md:w-72 w-full py-12" : "w-48 flex-shrink-0"}`}
          >
            <div className="absolute top-0 left-0 -mt-2 -ml-2 w-4 h-4 bg-slate-50 rounded-full border-b border-r border-slate-300"></div>
            <div className="absolute bottom-0 left-0 -mb-2 -ml-2 w-4 h-4 bg-slate-50 rounded-full border-t border-r border-slate-300"></div>

            <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 mb-3">
              <QRCodeSVG
                value={ticket.id}
                size={isLarge ? 200 : 100}
                className={isScanned ? "opacity-50" : ""}
              />
            </div>
            <p
              className={`${isLarge ? "text-sm" : "text-[10px]"} font-mono text-slate-400 select-all`}
            >
              {ticket.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="My Tickets" badges={[`${tickets.length} Total`]}>
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 mb-4">
            You haven't purchased any tickets yet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            Discover Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="cursor-zoom-in hover:scale-[1.02] transition-transform"
            >
              <TicketCard ticket={ticket} />
            </div>
          ))}
        </div>
      )}

      {/* NEW: Dialog Overlay for Selected Ticket */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => {
              // Allows clicking the ticket to close it too, as requested
              e.stopPropagation();
              setSelectedTicket(null);
            }}
          >
            <TicketCard ticket={selectedTicket} isLarge={true} />
          </div>
          <button
            onClick={() => setSelectedTicket(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
