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
  getDoc,
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

  const createNotification = async (payload: {
    userId: string;
    title: string;
    message: string;
    type: "sale" | "alert" | "system" | "message";
    read?: boolean;
  }) => {
    const notifRef = collection(db, "notifications");
    await addDoc(notifRef, {
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      read: payload.read ?? false,
      createdAt: Date.now(),
    });
  };

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

        // Campay may return various failure reasons. We map common insufficient-funds cases.
        const rawFailureText = JSON.stringify(data ?? {}).toLowerCase();
        const hasInsufficientFunds =
          rawFailureText.includes("insufficient") ||
          rawFailureText.includes("not enough") ||
          rawFailureText.includes("low balance") ||
          rawFailureText.includes("balance") ||
          rawFailureText.includes("funds");

        if (hasInsufficientFunds) {
          toast.error(
            "Insufficient funds. Please check your balance and try again.",
          );
        } else {
          toast.error("Payment failed or was cancelled by the user.");
        }

        if (user) {
          await createNotification({
            userId: user.uid,
            title: "Payment Failed",
            message: `Your payment for ${eventTitle} failed or was cancelled.`,
            type: "alert",
            read: false,
          });
        }
      } else {
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
      const now = Date.now();

      // Create the ticket
      const ticketRef = collection(db, "tickets");
      const newTicket = await addDoc(ticketRef, {
        eventId,
        userId: user.uid,
        purchasedAt: now,
        status: "valid",
        price: amount,
      });

      // Read current event snapshot so we can detect sell-out
      const eventSnap = await getDoc(doc(db, "events", eventId));
      const eventData: any = eventSnap.exists() ? eventSnap.data() : null;

      const previousSoldCount: number = eventData?.soldCount ?? 0;
      const capacity: number = eventData?.capacity ?? 0;

      // Increment event sold count
      await updateDoc(doc(db, "events", eventId), {
        soldCount: increment(1),
        updatedAt: now,
      });

      const newSoldCount = previousSoldCount + 1;
      const isSoldOutNow = capacity > 0 && newSoldCount >= capacity;

      // Organizer notification (paid flow)
      if (isSoldOutNow && organizerId) {
        await createNotification({
          userId: organizerId,
          title: "Event Sold Out!",
          message: `Congratulations! ${eventTitle} is now fully sold out!`,
          type: "system",
          read: false,
        });
      }

      // Attendee notification (paid success)
      await createNotification({
        userId: user.uid,
        title: "Ticket Purchased",
        message: `Your ticket for ${eventTitle} was purchased successfully. Ticket ID: ${newTicket.id}`,
        type: "sale",
        read: false,
      });

      toast.success("Ticket purchased successfully!");
      router.push("/tickets");
    } catch (error) {
      console.error("Error finalizing ticket:", error);
      toast.error(
        "Payment received, but ticket generation failed. Contact support.",
      );

      if (user) {
        await createNotification({
          userId: user.uid,
          title: "Ticket Purchase Failed",
          message: `We received your payment for ${eventTitle}, but ticket generation failed. Please contact support.`,
          type: "alert",
          read: false,
        });
      }
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
    setStatusMessage("Check your phone to confirm payment");

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
        checkPaymentStatus(data.reference);
      } else {
        throw new Error("No reference returned");
      }
    } catch (error) {
      setLoading(false);
      setStatusMessage("");
      toast.error("Failed to initiate payment.");

      if (user) {
        await createNotification({
          userId: user.uid,
          title: "Payment Initiation Failed",
          message: `We couldn't start the payment for ${eventTitle}. Please try again.`,
          type: "alert",
          read: false,
        });
      }
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
