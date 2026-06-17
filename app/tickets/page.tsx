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
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ticket, Event } from "@/lib/types";
import {
  Calendar,
  MapPin,
  Loader2,
  ArrowRight,
  X,
  MoreVertical,
  Trash2,
  Download,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

interface TicketWithEvent extends Ticket {
  event?: Event;
}

export default function TicketsPage() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<TicketWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithEvent | null>(
    null,
  );
  const [printingId, setPrintingId] = useState<string | null>(null);

  const fetchTickets = async () => {
    if (!user) return;
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
          ticketData.event = { id: eventSnap.id, ...eventSnap.data() } as Event;
        }
        fetchedTickets.push(ticketData);
      }
      setTickets(
        fetchedTickets.sort(
          (a, b) => (a.event?.date || 0) - (b.event?.date || 0),
        ),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const handleDelete = async (ticketId: string) => {
    if (!confirm("Delete this ticket permanently?")) return;
    try {
      await deleteDoc(doc(db, "tickets", ticketId));
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setSelectedTicket(null);
    } catch (e) {
      alert("Error deleting ticket");
    }
  };

  const handleDownload = (id: string) => {
    setPrintingId(id);
    // Give state a moment to update before opening print dialog
    setTimeout(() => {
      window.print();
      setPrintingId(null);
    }, 100);
  };

  const TicketCard = ({
    ticket,
    isLarge = false,
  }: {
    ticket: TicketWithEvent;
    isLarge?: boolean;
  }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const isScanned = ticket.status === "scanned";

    // Dynamic Status Colors (Type safe)
    const statusConfig: Record<string, string> = {
      valid: "bg-emerald-100 text-emerald-700 border-emerald-200",
      scanned: "bg-slate-100 text-slate-500 border-slate-200",
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };

    const currentStatus = statusConfig[ticket.status] || statusConfig.valid;

    return (
      <div
        id={ticket.id}
        className={`relative bg-white rounded-3xl border-2 transition-all duration-300 ${
          printingId === ticket.id ? "print-target" : ""
        } ${isLarge ? "shadow-2xl" : "shadow-sm hover:shadow-xl hover:-translate-y-1"} 
        ${isScanned ? "grayscale-[0.5] opacity-80" : "border-purple-100 hover:border-purple-400"} 
        flex flex-col overflow-hidden w-full h-full ${isLarge ? "md:flex-row" : ""}`}
      >
        {/* MENU - Hidden on Print */}
        <div className="absolute top-4 right-4 z-30 print:hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-2 bg-white/90 backdrop-blur-md shadow-md hover:bg-purple-600 hover:text-white rounded-xl transition-all"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    handleDownload(ticket.id);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-purple-50 flex items-center gap-3 transition-colors"
                >
                  <Download className="w-4 h-4 text-purple-600" /> Download PDF
                </button>
                <hr className="my-1 border-slate-50" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(ticket.id);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete Ticket
                </button>
              </div>
            </>
          )}
        </div>

        {/* IMAGE SECTION */}
        <div
          className={`${isLarge ? "md:w-2/5 h-64 md:h-auto" : "h-32"} relative overflow-hidden bg-slate-200 shrink-0`}
        >
          <img
            src={ticket.event?.imageUrl}
            className="w-full h-full object-cover"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div
            className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5 ${currentStatus}`}
          >
            {ticket.status === "scanned" ? (
              <Clock className="w-3 h-3" />
            ) : ticket.status === "cancelled" ? (
              <AlertCircle className="w-3 h-3" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            {ticket.status}
          </div>
        </div>

        {/* CONTENT SECTION */}
        <div className="flex flex-1 flex-col md:flex-row">
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-between border-r border-dashed border-slate-200 relative">
            {/* Notch Decorations */}
            <div className="absolute -top-3 -right-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-200 print:hidden" />
            <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-200 print:hidden" />

            <div>
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <User className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-widest">
                  Pass Holder
                </span>
              </div>
              <h2
                className={`${isLarge ? "text-3xl" : "text-xl"} font-extrabold text-slate-900 mb-4`}
              >
                {ticket.userName || profile?.name}
              </h2>
              <h3
                className={`${isLarge ? "text-2xl" : "text-lg"} font-bold text-slate-800 leading-tight mb-1`}
              >
                {ticket.event?.title}
              </h3>
              <p className="text-purple-600 font-black text-sm">
                FCFA {ticket.price.toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                  Date
                </p>
                <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  {ticket.event
                    ? new Date(ticket.event.date).toLocaleDateString()
                    : "TBA"}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                  Location
                </p>
                <div className="flex items-center gap-2 text-slate-700 text-xs font-bold truncate">
                  <MapPin className="w-3.5 h-3.5 text-purple-500" />
                  {ticket.event?.location}
                </div>
              </div>
            </div>
          </div>

          {/* QR SECTION */}
          <div
            className={`p-8 bg-slate-50/50 flex flex-col items-center justify-center gap-3 print:bg-white ${isLarge ? "md:w-72" : "w-44"}`}
          >
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
              <QRCodeSVG value={ticket.id} size={isLarge ? 180 : 120} />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-mono text-slate-400 uppercase">
                Verification ID
              </p>
              <p className="text-[10px] font-mono font-bold text-slate-600 uppercase">
                {ticket.id.slice(0, 14)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="My Tickets" badges={[`${tickets.length} Active`]}>
      <style>{`
        @media print {
          /* 1. Hide everything on the page */
          body * { visibility: hidden !important; shadow: none !important; }
          
          /* 2. Only show the ticket marked as print-target */
          .print-target, .print-target * { visibility: visible !important; }
          
          /* 3. Center the ticket perfectly in the PDF */
          .print-target { 
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 90% !important;
            max-width: 750px !important;
            border: 2px solid #e2e8f0 !important;
            display: flex !important;
            flex-direction: column !important;
            background: white !important;
            box-shadow: none !important;
          }

          /* Adjust layout for print to ensure the QR section is prominent */
          .print-target img { max-height: 250px !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#fcfcfd] -m-8 p-8">
        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="max-w-md mx-auto text-center p-12 bg-white rounded-3xl shadow-xl border border-slate-100 mt-10">
            <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Tickets</h2>
            <p className="text-slate-500 mb-8 text-sm">
              You haven't booked any events yet.
            </p>
            <Link
              href="/"
              className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
            >
              Browse Events <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="cursor-pointer"
              >
                <TicketCard ticket={ticket} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <TicketCard ticket={selectedTicket} isLarge={true} />
            <p className="text-white/40 text-center mt-6 text-sm">
              Click outside to close
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
