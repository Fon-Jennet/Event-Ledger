"use client";

import { Bell, Plus, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useRef } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppNotification } from "@/lib/types";

export function Header({ title = "Overview", badges = [] }: { title?: string, badges?: string[] }) {
  const { profile, logOut, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      setNotifications(notifs);
    }, (error) => {
      console.error("Error fetching notifications", error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string, read: boolean) => {
    if (read) return;
    try {
       await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (e) {
       console.error("Failed to mark as read", e);
    }
  };

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-50">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {badges.map((b, i) => (
          <div key={i} className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{b}</div>
        ))}
      </div>
      <div className="flex items-center gap-6">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)} 
            className="relative p-2 -m-2 focus:outline-none"
          >
            <Bell className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-purple-600 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                 {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden py-2">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                 {unreadCount > 0 && <span className="text-[10px] text-purple-600 font-bold uppercase tracking-widest">{unreadCount} New</span>}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                 {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">No notifications yet.</div>
                 ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markAsRead(n.id, n.read)}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!n.read ? 'bg-purple-50/50' : ''}`}
                      >
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'sale' ? 'bg-green-100 text-green-600' : n.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                           {n.type === 'sale' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                         </div>
                         <div>
                            <h4 className={`text-sm ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{n.title}</h4>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.createdAt).toLocaleDateString()}</span>
                         </div>
                      </div>
                    ))
                 )}
              </div>
            </div>
          )}
        </div>
        
        {profile && (profile.role === 'admin' || profile.role === 'organizer') && (
          <Link href="/events/new" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        )}
        
        <button onClick={logOut} className="text-slate-400 hover:text-red-500 transition-colors" title="Log Out">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
