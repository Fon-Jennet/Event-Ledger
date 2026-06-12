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
  query,
  where,
  getDocs,
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
  UploadCloud,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// IMPORT THE PAYMENT FORM
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

  // State for chat initialization
  const [startingChat, setStartingChat] = useState(false);

  // States for Trade Fare custom requirements
  const [ageCategory, setAgeCategory] = useState<"child" | "adult" | null>(
    null,
  );
  const [proofDocument, setProofDocument] = useState<File | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofDocument(e.target.files[0]);
    }
  };

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
        price: currentPrice,
        ...(proofDocument &&
          ageCategory && { ageCategory, hasProofDocument: true }),
      });

      await updateDoc(doc(db, "events", event.id), {
        soldCount: increment(1),
        updatedAt: Date.now(),
      });

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

  // Chat initiation logic
  const handleMessageOrganizer = async () => {
    if (!profile) {
      toast.error("Please sign in to message the organizer.");
      return;
    }
    if (!event) return;

    // FIX 1: Verify the event actually has an organizer ID before querying
    if (!event.organizerId) {
      toast.error("This event is missing an organizer ID.");
      return;
    }

    if (profile.id === event.organizerId) {
      toast.error("You cannot message yourself!");
      return;
    }

    setStartingChat(true);
    try {
      const chatsRef = collection(db, "chats");

      // Sort IDs alphabetically so the participants array is consistent
      const sortedParticipants = [profile.id, event.organizerId].sort();

      // Check if conversation already exists
      const q = query(
        chatsRef,
        where("participants", "==", sortedParticipants),
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Chat exists, route to it
        const existingChatId = querySnapshot.docs[0].id;
        router.push(`/chat/${existingChatId}`);
      } else {
        // Create new chat and include all metadata needed for the Organizer Inbox
        const newChatRef = await addDoc(chatsRef, {
          participants: sortedParticipants,
          eventId: event.id,
          eventTitle: event.title,
          organizerId: event.organizerId,
          attendeeId: profile.id,
          attendeeName: profile.name,
          updatedAt: Date.now(),
          lastMessage: "Chat started",
        });
        router.push(`/chat/${newChatRef.id}`);
      }
    } catch (error: any) {
      // FIX 2: Expose the actual error message to the toast
      console.error("Error starting chat:", error);
      toast.error(`Failed to open chat: ${error.message}`);
    } finally {
      setStartingChat(false);
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

  const isTradeFare = event.title?.toLowerCase().includes("trade");

  let currentPrice = event.price;
  let displayPrice: string | number = event.price;

  if (isTradeFare) {
    if (ageCategory === "child") {
      currentPrice = 10;
      displayPrice = 10;
    } else if (ageCategory === "adult") {
      currentPrice = 11;
      displayPrice = 11;
    } else {
      displayPrice = "10 - 11";
    }
  }

  const isVerificationComplete =
    !isTradeFare || (isTradeFare && ageCategory && proofDocument);

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
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="min-w-0">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                    Ticket Price
                  </p>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                    {typeof displayPrice === "string"
                      ? `FCFA ${displayPrice}`
                      : displayPrice === 0
                        ? "Free"
                        : `FCFA ${displayPrice.toLocaleString()}`}
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

            {/* AGE SELECTION AND DOCUMENT UPLOAD UI */}
            {isTradeFare && !isSoldOut && (
              <div className="mb-6 p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-800 block mb-2">
                    Select Age Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAgeCategory("child")}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        ageCategory === "child"
                          ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Child (1-18)
                    </button>
                    <button
                      onClick={() => setAgeCategory("adult")}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        ageCategory === "adult"
                          ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Adult (19+)
                    </button>
                  </div>
                </div>

                {ageCategory && (
                  <div className="space-y-2 pt-2 border-t border-purple-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-sm font-bold text-slate-800 block">
                      Verification Document
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                      Upload a{" "}
                      {ageCategory === "child"
                        ? "Birth Certificate"
                        : "National ID Card"}{" "}
                      to continue.
                    </p>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-purple-200 rounded-lg cursor-pointer bg-white hover:bg-purple-50/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud
                          className={`w-6 h-6 mb-2 ${proofDocument ? "text-purple-600" : "text-slate-400"}`}
                        />
                        <p className="text-xs font-medium text-center px-4 truncate w-full">
                          {proofDocument ? (
                            <span className="text-purple-700">
                              {proofDocument.name}
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              Click to upload document
                            </span>
                          )}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* PAYMENT LOGIC */}
            {isSoldOut ? (
              <div className="w-full h-12 bg-slate-200 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2">
                <Ticket className="w-5 h-5" /> Sold Out
              </div>
            ) : !isVerificationComplete ? (
              <div className="w-full h-12 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl font-bold flex items-center justify-center text-sm">
                Complete verification to purchase
              </div>
            ) : currentPrice > 0 ? (
              <PaymentForm
                amount={currentPrice}
                eventTitle={event.title}
                eventId={event.id}
                organizerId={event.organizerId}
              />
            ) : (
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {purchasing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Ticket className="w-5 h-5" />
                )}
                Get Free Ticket
              </button>
            )}

            {/* MESSAGE ORGANIZER BUTTON */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={handleMessageOrganizer}
                disabled={startingChat}
                className="w-full h-12 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {startingChat ? (
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                )}
                Message Organiser
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
