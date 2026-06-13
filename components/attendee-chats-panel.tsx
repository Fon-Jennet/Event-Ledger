"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Clock } from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

type ChatSummary = {
  id: string;
  eventTitle?: string;
  attendeeName?: string;
  organizerName?: string;
  lastMessage?: string;
  updatedAt?: number;
};

export function AttendeeChatsPanel() {
  const { profile } = useAuth();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", profile.id),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ChatSummary, "id">),
        }));

        setChats(fetched);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching attendee chats:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [profile?.id]);

  const topChats = useMemo(() => chats.slice(0, 6), [chats]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-sm truncate">
              My Chats
            </h3>
            <p className="text-[11px] text-slate-500">Replies from organiser</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-1 rounded-full">
          {chats.length}
        </span>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="py-6 flex justify-center">
            <div className="animate-pulse w-8 h-8 bg-purple-600 rounded-full" />
          </div>
        ) : topChats.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No chats yet.
          </div>
        ) : (
          <div className="space-y-2">
            {topChats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="block p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {chat.eventTitle ?? "Event"}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-1">
                      {chat.lastMessage ?? "No messages yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] text-slate-400">
                      {chat.updatedAt
                        ? new Date(chat.updatedAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
