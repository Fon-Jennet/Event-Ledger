"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { MessageSquare, Clock, ChevronRight } from "lucide-react";

export default function InboxPage() {
  const { profile } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    let q;
    const chatsRef = collection(db, "chats");

    // Filter based on user role
    if (profile.role === "admin") {
      // Admins see EVERYTHING
      q = query(chatsRef, orderBy("updatedAt", "desc"));
    } else if (profile.role === "organizer") {
      // Organizers only see chats directed to them
      q = query(chatsRef, where("organizerId", "==", profile.id), orderBy("updatedAt", "desc"));
    } else {
      // Regular attendees only see their own outgoing chats
      q = query(chatsRef, where("attendeeId", "==", profile.id), orderBy("updatedAt", "desc"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(fetchedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  // ... handle loading states ...

  return (
    <DashboardLayout title="Inbox" badges={[`${chats.length} conversations`]}>
      <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
        {chats.map(chat => (
          <Link 
            key={chat.id} 
            href={`/chats/${chat.id}`}
            className="flex items-center p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mr-4">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-slate-900 truncate">
                  {profile?.role === 'organizer' || profile?.role === 'admin' 
                    ? chat.attendeeName 
                    : "Event Organizer"}
                </h3>
                <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 ml-2">
                  <Clock className="w-3 h-3" />
                  {new Date(chat.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-purple-600 font-medium mb-1 truncate">
                Event: {chat.eventTitle}
              </p>
              <p className="text-sm text-slate-500 truncate">
                {chat.lastMessage}
              </p>
            </div>
            
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-600 ml-4 shrink-0 transition-colors" />
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}