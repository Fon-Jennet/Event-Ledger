"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
// 1. Import 'use' from react
import { useEffect, useState, useRef, use } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: number;
}

// 2. Change params type to a Promise
export default function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 3. Unwrap the params using React.use()
  const unwrappedParams = use(params);
  const chatId = unwrappedParams.chatId;

  useEffect(() => {
    if (!profile || !chatId) return;

    // Mark this chat as read as soon as the user enters the chat
    const markRead = async () => {
      try {
        const chatRef = doc(db, "chats", chatId);
        const ts = Date.now();
        await updateDoc(chatRef, {
          [`lastReadBy.${profile.id}`]: ts,
        });
      } catch (e) {
        // It's okay if the document doesn't have the field yet
        console.error("Failed to mark chat as read", e);
      }
    };

    markRead();

    // TODO: enforce access control via Firestore rules.
    // UI-level guards are optional, but Firestore rules are required for security.

    // 1. Point to the specific chat's messages sub-collection
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[];

        setMessages(msgs.reverse());
        setLoading(false);
        setTimeout(() => scrollToBottom(), 100);
      },
      (error) => {
        console.error("Chat error", error);
        toast.error("Failed to load chat messages.");
      },
    );

    return () => unsubscribe();
  }, [profile, chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile || !chatId) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      // 2. Add the message to the sub-collection
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: messageText,
        senderId: profile.id,
        senderName: profile.name,
        senderRole: profile.role,
        createdAt: Date.now(),
      });

      // 3. Update the parent chat document for the organizer's inbox
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        lastMessage: messageText,
        updatedAt: Date.now(),
      });

      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message.");
      // Optional: restore the message text if the upload fails
      setNewMessage(messageText);
    }
  };

  if (!profile) {
    return (
      <DashboardLayout title="Chat Center">
        <div className="p-8 text-center text-slate-500">
          Unauthorized access.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Message Organizer" badges={["Private Chat"]}>
      <div className="max-w-4xl mx-auto h-[600px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-slate-400">
              No messages yet. Send a message to the organizer!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === profile.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-700">
                      {isMe ? "You" : msg.senderName}
                    </span>
                    {!isMe && (
                      <span
                        className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                          msg.senderRole === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : msg.senderRole === "organizer"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {msg.senderRole}
                      </span>
                    )}
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm shadow-sm ${
                      isMe
                        ? "bg-purple-600 text-white rounded-tr-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
