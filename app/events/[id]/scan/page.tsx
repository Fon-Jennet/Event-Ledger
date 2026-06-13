"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useState, use } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { Loader2, CheckCircle, XCircle, QrCode, Search } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const QrReader = dynamic(
  // @ts-expect-error - react-qr-reader exports vary by build
  () => import("react-qr-reader").then((m) => m.default || m.QrReader),
  { ssr: false },
);

export default function TicketScannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.id;
  const { profile } = useAuth();
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: "success" | "error";
    message: string;
    ticket?: any;
  } | null>(null);

  const [lastTicketProcessed, setLastTicketProcessed] = useState<string | null>(
    null,
  );

  const validateAndScanTicket = async (rawTicketId: string) => {
    const tid = rawTicketId.trim();
    if (!tid) return;

    // Debounce rapid re-scans of the same QR
    if (lastTicketProcessed === tid) return;
    setLastTicketProcessed(tid);

    setLoading(true);
    setResult(null);

    try {
      const ticketRef = doc(db, "tickets", tid);
      const ticketSnap = await getDoc(ticketRef);

      if (!ticketSnap.exists()) {
        setResult({ status: "error", message: "Invalid Ticket" });
        return;
      }

      const ticketData: any = ticketSnap.data();

      if (ticketData.eventId !== eventId) {
        setResult({ status: "error", message: "Invalid Ticket" });
        return;
      }

      if (ticketData.status === "scanned") {
        setResult({
          status: "error",
          message: "This ticket has already been scanned",
        });
        return;
      }

      // If cancelled, treat as invalid
      if (ticketData.status === "cancelled") {
        setResult({ status: "error", message: "Invalid Ticket" });
        return;
      }

      // Atomic update + message building with transaction
      const scanned = await runTransaction(db, async (tx) => {
        const fresh = await tx.get(ticketRef);
        if (!fresh.exists())
          return { ok: false as const, type: "invalid" as const };

        const freshData: any = fresh.data();

        if (freshData.eventId !== eventId) {
          return { ok: false as const, type: "invalid" as const };
        }

        if (freshData.status === "scanned") {
          return {
            ok: false as const,
            type: "already" as const,
            ticket: freshData,
          };
        }

        if (freshData.status === "cancelled") {
          return { ok: false as const, type: "invalid" as const };
        }

        // Mark scanned (you can also store scannedAt/scannedBy)
        tx.update(ticketRef, {
          status: "scanned",
          scannedAt: Date.now(),
        });

        return { ok: true as const, ticket: freshData };
      });

      if (!scanned.ok) {
        if (scanned.type === "already") {
          setResult({
            status: "error",
            message: "This ticket has already been scanned",
          });
        } else {
          setResult({ status: "error", message: "Invalid Ticket" });
        }
        return;
      }

      // Fetch username and event name for the success message
      const [ticketData2, eventSnap] = await Promise.all([
        getDoc(doc(db, "tickets", tid)),
        getDoc(doc(db, "events", eventId)),
      ]);

      const finalTicket: any = ticketData2.data();
      const eventData: any = eventSnap.data();

      // Validity window: ticket is valid until 24h AFTER event dateline (event.date)
      // If the event's dateline is missing, we consider it valid to avoid locking out tickets.
      const eventDateMs: number | undefined =
        typeof eventData?.date === "number" ? eventData.date : undefined;

      if (eventDateMs) {
        const expiresAtMs = eventDateMs + 24 * 60 * 60 * 1000;
        if (Date.now() > expiresAtMs) {
          setResult({
            status: "error",
            message: "Invalid Ticket: event dateline has passed by 24 hours.",
          });
          return;
        }
      }

      const userId = finalTicket?.userId;
      const userSnap = userId ? await getDoc(doc(db, "users", userId)) : null;
      const username = userSnap?.exists()
        ? (userSnap.data() as any)?.name
        : "User";
      const eventName = eventSnap.exists()
        ? (eventData?.title as string) || "Event"
        : "Event";

      setResult({
        status: "success",
        message: `${username} has paid for ${eventName} and the ticket is still valid.`,
        ticket: finalTicket,
      });
    } catch (error) {
      console.error(error);
      setResult({ status: "error", message: "Invalid Ticket" });
    } finally {
      setLoading(false);
      setTimeout(() => setLastTicketProcessed(null), 2000);
      setTicketId("");
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    await validateAndScanTicket(ticketId);
  };

  if (!profile || (profile.role !== "organizer" && profile.role !== "admin")) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">Unauthorized.</div>{" "}
        <Link href="/" className="text-purple-600 hover:underline font-bold">
          Go back home
        </Link>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ticket Scanner" badges={["Scanner Mode"]}>
      <div className="w-full max-w-6xl mx-auto p-2 md:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-8 shadow-sm text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              Scan Ticket
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mb-4">
              Scan the QR code with your camera. (Fallback: paste Ticket ID.)
            </p>

            <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 mb-4">
              <div className="relative w-full aspect-[4/3]">
                <QrCode className="absolute left-4 top-4 w-6 h-6 text-slate-400" />
                <div className="absolute inset-0 p-2">
                  <QrReader />
                </div>
              </div>
            </div>

            <form onSubmit={handleScan} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="Ticket ID..."
                  className="w-full pl-12 pr-4 py-3.5 text-center tracking-widest font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-sm sm:text-base"
                />
              </div>
              <button
                disabled={loading || !ticketId.trim()}
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Verify Ticket"
                )}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {result && (
              <div
                className={`p-6 rounded-xl border flex flex-col items-center text-center ${
                  result.status === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                {result.status === "success" ? (
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-500 mb-4" />
                )}
                <h3
                  className={`text-xl font-bold mb-2 ${
                    result.status === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {result.status === "success"
                    ? "Valid Ticket"
                    : "Invalid Ticket"}
                </h3>
                <p
                  className={
                    result.status === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {result.message}
                </p>
              </div>
            )}

            {!result && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Ready</h3>
                <p className="text-sm text-slate-500">
                  Point your camera at the QR code to scan.
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-2">Rules</h4>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                <li>Scans only work for tickets that match this event.</li>
                <li>
                  Already-scanned tickets show: “This ticket has already been
                  scanned”.
                </li>
                <li>Invalid tickets show: “Invalid Ticket”.</li>
                <li>
                  Valid scans show: “{`{Username}`} has paid for {`{eventname}`}{" "}
                  and the ticket is still valid.”
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
