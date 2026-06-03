// components/payment-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  updateDoc,
  increment,
  collection,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function PaymentForm({
  amount,
  eventTitle,
  eventId,
  organizerId,
}: {
  amount: number;
  eventTitle: string;
  eventId: string;
  organizerId: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // 2. The Polling Function: Checks the status every 3 seconds
  const checkPaymentStatus = async (reference: string) => {
    try {
      const res = await fetch("/api/payment/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();

      if (data.status === "SUCCESSFUL") {
        setStatusMessage("Payment Successful! Generating ticket...");
        await handleFinalizeTicket();
      } else if (data.status === "FAILED") {
        setLoading(false);
        setStatusMessage("");
        toast.error("Payment failed or was cancelled by the user.");
      } else {
        // If PENDING, wait 3 seconds and check again
        setTimeout(() => checkPaymentStatus(reference), 3000);
      }
    } catch (error) {
      console.error("Error checking status:", error);
      setTimeout(() => checkPaymentStatus(reference), 3000);
    }
  };

  // 3. The Ticket Generation Logic (Runs ONLY after successful payment)
  const handleFinalizeTicket = async () => {
    if (!user) return;

    try {
      // Create the ticket
      const ticketRef = collection(db, "tickets");
      const newTicket = await addDoc(ticketRef, {
        eventId,
        userId: user.uid,
        purchasedAt: Date.now(),
        status: "valid",
        price: amount,
      });

      // Increment event sold count
      await updateDoc(doc(db, "events", eventId), {
        soldCount: increment(1),
        updatedAt: Date.now(),
      });

      // Optional: Call your WhatsApp API route here
      // await fetch('/api/whatsapp', { method: 'POST', body: JSON.stringify({ phone, eventTitle, ticketId: newTicket.id }) });

      toast.success("Ticket purchased successfully!");
      router.push("/tickets");
    } catch (error) {
      console.error("Error finalizing ticket:", error);
      toast.error(
        "Payment received, but ticket generation failed. Contact support.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 1. Initiates the payment using your existing route
  const handlePayment = async () => {
    if (!user) {
      toast.error("Please sign in to buy tickets.");
      return;
    }

    setLoading(true);
    setStatusMessage("Check your phone to confirm payment...");

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          phoneNumber: phone,
          description: eventTitle,
        }),
      });
      const data = await res.json();

      if (data.reference) {
        // Start checking the status
        checkPaymentStatus(data.reference);
      } else {
        throw new Error("No reference returned");
      }
    } catch (error) {
      setLoading(false);
      setStatusMessage("");
      toast.error("Failed to initiate payment.");
    }
  };

  return (
    <div className="mt-6 p-6 border border-purple-100 bg-purple-50 rounded-xl">
      <h3 className="font-bold text-lg mb-2 text-slate-800">
        Buy Ticket via Mobile Money
      </h3>
      <p className="text-sm text-slate-600 mb-4">
        Enter your MTN or Orange Money number.
      </p>

      <input
        type="text"
        placeholder="e.g., 2376XXXXXXXX"
        onChange={(e) => setPhone(e.target.value)}
        disabled={loading}
        className="border border-slate-300 p-3 rounded-lg w-full mb-3 focus:outline-none focus:border-purple-500"
      />

      <button
        onClick={handlePayment}
        disabled={loading || phone.length < 9}
        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold px-4 py-3 rounded-lg w-full transition-colors flex justify-center items-center gap-2"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        {loading ? "Processing..." : `Pay FCFA ${amount.toLocaleString()}`}
      </button>

      {statusMessage && (
        <p className="text-center text-sm text-purple-700 font-semibold mt-4 animate-pulse">
          {statusMessage}
        </p>
      )}
    </div>
  );
}
