"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEffect, useState, use } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { Event } from "@/lib/types";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 1. IMPORT THE PAYMENT FORM
import { PaymentForm } from "@/components/payment-form";

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.id;
  const { user, profile } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, "events", eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() } as Event);
        }
      } catch (error) {
        console.error("Error fetching event", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  // This function is now primarily for FREE events
  const handlePurchase = async () => {
    if (!user) {
      toast.error("Please sign in to purchase tickets");
      return;
    }
    if (!event) return;

    if (event.soldCount >= event.capacity) {
      toast.error("This event is sold out!");
      return;
    }

    setPurchasing(true);
    try {
      const ticketRef = collection(db, "tickets");
      await addDoc(ticketRef, {
        eventId: event.id,
        userId: user.uid,
        purchasedAt: Date.now(),
        status: "valid",
        price: event.price,
      });

      await updateDoc(doc(db, "events", event.id), {
        soldCount: increment(1),
        updatedAt: Date.now(),
      });

      // Notification for Organizer
      const notifRef = collection(db, "notifications");
      await addDoc(notifRef, {
        userId: event.organizerId,
        title: "New Ticket Sold",
        message: `Someone just got a ticket for ${event.title}!`,
        type: "sale",
        read: false,
        createdAt: Date.now(),
      });

      const newSoldCount = event.soldCount + 1;
      if (newSoldCount === event.capacity) {
        await addDoc(notifRef, {
          userId: event.organizerId,
          title: "Event Sold Out!",
          message: `Congratulations! ${event.title} is now fully sold out!`,
          type: "system",
          read: false,
          createdAt: Date.now(),
        });
      } else if (
        newSoldCount === Math.floor(event.capacity * 0.9) ||
        event.capacity - newSoldCount === 5
      ) {
        await addDoc(notifRef, {
          userId: event.organizerId,
          title: "Almost Sold Out!",
          message: `${event.title} is reaching max capacity. Only ${event.capacity - newSoldCount} spots remaining.`,
          type: "alert",
          read: false,
          createdAt: Date.now(),
        });
      }

      toast.success("Ticket acquired successfully!");
      setEvent({ ...event, soldCount: newSoldCount });
      router.push("/tickets");
    } catch (error: any) {
      toast.error(error.message || "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Loading Event..." badges={[]}>
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout title="Event Not Found" badges={[]}>
        <div className="p-8 text-center text-slate-500">
          The event could not be found.
        </div>
      </DashboardLayout>
    );
  }

  const eventDate = new Date(event.date);
  const isSoldOut = event.soldCount >= event.capacity;

  return (
    <DashboardLayout title={event.title} badges={[event.status]}>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-purple-600 flex items-center gap-1 font-semibold hover:underline w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Discover
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-56 sm:h-72 md:h-80 bg-slate-200 rounded-2xl relative overflow-hidden shadow-sm">
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-90" />
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
              About the Event
            </h3>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
              {event.description}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* On phones, avoid sticky causing cramped/overlapping layout */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="min-w-0">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                    Ticket Price
                  </p>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                    {event.price === 0
                      ? "Free"
                      : `FCFA ${event.price.toLocaleString()}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {eventDate.toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-slate-500">
                    {eventDate.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {event.location}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {event.capacity - event.soldCount} spots left
                  </p>
                  <p className="text-sm text-slate-500">
                    Out of {event.capacity} total
                  </p>
                </div>
              </div>
            </div>

            {/* 2. RENDER PAYMENT FORM OR FREE TICKET BUTTON */}
            {isSoldOut ? (
              <div className="w-full h-12 bg-slate-200 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2">
                <Ticket className="w-5 h-5" /> Sold Out
              </div>
            ) : event.price > 0 ? (
              <PaymentForm
                amount={event.price}
                eventTitle={event.title}
                eventId={event.id}
                organizerId={event.organizerId}
              />
            ) : (
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {purchasing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Ticket className="w-5 h-5" />
                )}
                Get Free Ticket
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
