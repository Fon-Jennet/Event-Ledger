"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useState, use, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Camera,
  StopCircle,
} from "lucide-react";
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";

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
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{
    status: "success" | "error";
    message: string;
    ticket?: any;
  } | null>(null);

  // Reusable verification logic
  const verifyTicket = useCallback(
    async (id: string) => {
      if (!id.trim()) return;

      setLoading(true);
      setResult(null);
      try {
        const ticketRef = doc(db, "tickets", id.trim());
        const ticketSnap = await getDoc(ticketRef);

        if (!ticketSnap.exists()) {
          setResult({
            status: "error",
            message: "Ticket not found in system.",
          });
          return;
        }

        const ticketData = ticketSnap.data();

        if (ticketData.eventId !== eventId) {
          setResult({
            status: "error",
            message: "Ticket belongs to a different event.",
          });
          return;
        }

        if (ticketData.status === "scanned") {
          setResult({
            status: "error",
            message: "Ticket has already been scanned!",
            ticket: ticketData,
          });
          return;
        }

        if (ticketData.status === "cancelled") {
          setResult({
            status: "error",
            message: "Ticket was cancelled.",
            ticket: ticketData,
          });
          return;
        }

        // Update ticket status in Firebase
        await updateDoc(ticketRef, {
          status: "scanned",
          scannedAt: new Date().toISOString(),
        });

        setResult({
          status: "success",
          message: "Ticket verified and scanned successfully!",
          ticket: ticketData,
        });

        // If camera was on, stop scanning after success to prevent multiple scans
        setIsScanning(false);
      } catch (error: any) {
        console.error(error);
        setResult({ status: "error", message: "Error verifying ticket." });
      } finally {
        setLoading(false);
        setTicketId("");
      }
    },
    [eventId],
  );

  // Handle manual form submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyTicket(ticketId);
  };

  // QR Scanner Effect
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false,
      );

      scanner.render(
        (decodedText) => {
          // Success callback
          verifyTicket(decodedText);
          if (scanner) scanner.clear();
        },
        (error) => {
          // Warning/Error callback (usually ignored to avoid spamming console)
        },
      );
    }

    return () => {
      if (scanner) {
        scanner
          .clear()
          .catch((err) => console.error("Failed to clear scanner", err));
      }
    };
  }, [isScanning, verifyTicket]);

  if (!profile || (profile.role !== "organizer" && profile.role !== "admin")) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">Unauthorized.</div>
        <Link
          href="/"
          className="text-purple-600 hover:underline font-bold text-center block"
        >
          Go back home
        </Link>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ticket Scanner" badges={["Scanner Mode"]}>
      <div className="max-w-md mx-auto space-y-6">
        {/* Scanner Control Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Scan Ticket</h2>
          <p className="text-sm text-slate-500 mb-6">
            Use your camera to scan the QR code or enter the ID manually.
          </p>

          {/* Camera Viewport */}
          {isScanning && (
            <div
              id="reader"
              className="mb-6 overflow-hidden rounded-xl border-2 border-purple-100"
            ></div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsScanning(!isScanning)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                isScanning
                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                  : "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
              }`}
            >
              {isScanning ? (
                <>
                  {" "}
                  <StopCircle className="w-5 h-5" /> Stop Camera{" "}
                </>
              ) : (
                <>
                  {" "}
                  <Camera className="w-5 h-5" /> Open QR Scanner{" "}
                </>
              )}
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">
                  Or manual entry
                </span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="Ticket ID..."
                  className="w-full pl-12 pr-4 py-3 text-center font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                />
              </div>
              <button
                disabled={loading || !ticketId.trim()}
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Verify Manually"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Status Feedback */}
        {result && (
          <div
            className={`p-6 rounded-xl border animate-in fade-in zoom-in duration-300 flex flex-col items-center text-center ${
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
              className={`text-xl font-bold mb-2 ${result.status === "success" ? "text-green-800" : "text-red-800"}`}
            >
              {result.status === "success" ? "Access Granted" : "Access Denied"}
            </h3>
            <p
              className={
                result.status === "success" ? "text-green-600" : "text-red-600"
              }
            >
              {result.message}
            </p>
            {result.ticket && (
              <div className="mt-4 pt-4 border-t border-black/5 w-full text-left text-sm">
                <p>
                  <strong>Name:</strong> {result.ticket.userName || "N/A"}
                </p>
                <p>
                  <strong>Type:</strong>{" "}
                  {result.ticket.ticketType || "General Admission"}
                </p>
              </div>
            )}
            {result.status === "error" && (
              <button
                onClick={() => setResult(null)}
                className="mt-4 text-sm font-semibold text-red-700 underline"
              >
                Clear Error
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}