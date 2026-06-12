"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEffect, useState, useRef, use } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Loader2, Send, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";

// Define our types
interface ChatSession {
  id: string;
  eventId: string;
  eventTitle: string;
  organizerId: string;
  attendeeId: string;
  attendeeName: string;
  participants: string[];
  lastMessage: string;
  updatedAt: number;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: number;
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  // Next.js 15: Unwrap the promise in a client component using React.use()
  const unwrappedParams = use(params);
  const currentChatId = unwrappedParams.chatId;
  
  const { profile } = useAuth();

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatInfo, setCurrentChatInfo] = useState<ChatSession | null>(null);

  const [newMessage, setNewMessage] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 1. Fetch all chats for the sidebar
  useEffect(() => {
    if (!profile?.id) return;

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", profile.id),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedChats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatSession[];

        setChats(fetchedChats);

        // Update current chat info if it matches
        const current = fetchedChats.find((c) => c.id === currentChatId);
        setCurrentChatInfo(current || null);
        setLoadingChats(false);
      },
      (error) => {
        console.error("Error fetching chats:", error);
        setLoadingChats(false);
      },
    );

    return () => unsubscribe();
  }, [profile?.id, currentChatId]);

  // 2. Fetch messages for the specific chat
  useEffect(() => {
    if (!currentChatId || !profile?.id) return;

    const messagesRef = collection(db, "chats", currentChatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    setLoadingMessages(true);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];

        setMessages(fetchedMessages);
        setLoadingMessages(false);
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setLoadingMessages(false);
      },
    );

    return () => unsubscribe();
  }, [currentChatId, profile?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile?.id || !currentChatId) return;

    setSending(true);
    const messageText = newMessage.trim();
    
    // Clear input optimistically, but save the text in case we need to revert
    setNewMessage(""); 

    try {
      // 1. Add message to subcollection
      const messagesRef = collection(db, "chats", currentChatId, "messages");
      await addDoc(messagesRef, {
        text: messageText,
        senderId: profile.id,
        createdAt: Date.now(),
      });

      // 2. Update the parent chat document with last message and time
      const chatRef = doc(db, "chats", currentChatId);
      await updateDoc(chatRef, {
        lastMessage: messageText,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Revert the input field if the message failed to send
      setNewMessage(messageText); 
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Determine chat display name dynamically based on role
  const getChatTitle = (chat: ChatSession) => {
    if (profile?.role === "organizer" && chat.organizerId === profile?.id) {
      return `${chat.eventTitle} - ${chat.attendeeName}`;
    }
    return chat.eventTitle; 
  };

  if (!profile) return null;

  return (
    <DashboardLayout title="Messages" badges={[]}>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex h-[700px] md:h-[800px]">
        
        {/* SIDEBAR: Recent Chats */}
        <div className="w-full md:w-1/3 border-r border-slate-200 flex-col bg-slate-50/50 hidden md:flex">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="font-bold text-slate-800">Recent Conversations</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingChats ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No active conversations.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {chats.map((chat) => (
                  <Link
                    href={`/chat/${chat.id}`}
                    key={chat.id}
                    className={`block p-4 hover:bg-purple-50 transition-colors ${
                      currentChatId === chat.id 
                      ? "bg-purple-50 border-l-4 border-purple-600" 
                      : "border-l-4 border-transparent"
                    }`}
                  >
                    <h3 className="font-semibold text-slate-900 text-sm truncate">
                      {getChatTitle(chat)}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-1">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="w-full md:w-2/3 flex flex-col bg-white">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
            <Link
              href="/chat"
              className="md:hidden text-slate-500 hover:text-purple-600 p-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="font-bold text-slate-800">
                {currentChatInfo ? getChatTitle(currentChatInfo) : "Loading..."}
              </h2>
              {/* Fixed logic to check for "organizer" instead of "admin" */}
              {currentChatInfo && profile.role === "organizer" && (
                <p className="text-xs text-slate-500">
                  Attendee: {currentChatInfo.attendeeName}
                </p>
              )}
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {loadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                <MessageSquare className="w-12 h-12 opacity-20" />
                <p>No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === profile.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                        isMe
                          ? "bg-purple-600 text-white rounded-br-none"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <p
                        className={`text-[10px] mt-1 text-right ${
                          isMe ? "text-purple-200" : "text-slate-400"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {/* Invisible div to scroll to bottom */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl px-4 py-3 text-sm transition-all"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
          
        </div>
      </div>
    </DashboardLayout>
  );
}