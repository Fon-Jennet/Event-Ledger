"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  LineChart,
  Ticket,
  Menu,
  X,
  LogOut,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

export function Sidebar() {
  const { profile, logOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const getLinkClasses = (path: string) => {
    const isActive = pathname === path || pathname.startsWith(path + "/");
    return `py-2 px-4 rounded-lg flex items-center gap-3 font-medium transition-all duration-200 ${
      isActive
        ? "bg-purple-600/20 text-purple-400 border border-purple-500/20"
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
    }`;
  };

  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  const closeSidebar = () => setIsOpen(false);

  const getLastReadTs = (chatDoc: any, userId: string) => {
    const lastReadBy = chatDoc?.lastReadBy || {};
    const v = lastReadBy[userId];
    return typeof v === "number" ? v : 0;
  };

  useEffect(() => {
    if (!profile?.id) {
      setUnreadChatsCount(0);
      return;
    }

    let q: any;
    const chatsRef = collection(db, "chats");

    // Mirror the inbox filters
    if (profile.role === "admin") {
      q = query(chatsRef, orderBy("updatedAt", "desc"));
    } else if (profile.role === "organizer") {
      q = query(
        chatsRef,
        where("organizerId", "==", profile.id),
        orderBy("updatedAt", "desc"),
      );
    } else {
      q = query(
        chatsRef,
        where("participants", "array-contains", profile.id),
        orderBy("updatedAt", "desc"),
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      let count = 0;
      snapshot.docs.forEach((docSnap: any) => {
        const data = docSnap.data() as any;
        const updatedAt =
          typeof data.updatedAt === "number" ? data.updatedAt : 0;
        const lastReadTs = getLastReadTs(data, profile.id);
        if (updatedAt > lastReadTs) count += 1;
      });
      setUnreadChatsCount(count);
    });

    return () => unsubscribe();
  }, [profile?.id, profile?.role]);

  const isProfileActive = pathname === "/profile";

  const handleSignOut = async () => {
    try {
      closeSidebar();
      await logOut();
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="fixed top-0 left-0 mt-4 ml-4 z-[60] p-2 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-lg md:hidden"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`
        fixed md:sticky inset-y-0 md:top-0 left-0 z-50
        w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col min-h-full shrink-0
        w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col h-screen shrink-0 bottom-0
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <span className="sr-only">Sidebar</span>

        {/* Logo Section */}
        <div className="p-6 flex items-center gap-3 mt-10 md:mt-0 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-white font-black italic">E</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Event Ledger</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {/* Unified Feed Route */}
          <Link
            href="/dashboard"
            onClick={closeSidebar}
            className={getLinkClasses("/dashboard")}
          >
            <LayoutDashboard className="w-5 h-5" /> Discover
          </Link>

          {profile?.role === "attendee" && (
            <Link
              href="/tickets"
              onClick={closeSidebar}
              className={getLinkClasses("/tickets")}
            >
              <Ticket className="w-5 h-5" /> My Tickets
            </Link>
          )}

          {/* Organizer/Admin Event Management */}
          {profile &&
            (profile.role === "admin" || profile.role === "organizer") && (
              <Link
                href="/events"
                onClick={closeSidebar}
                className={getLinkClasses("/events")}
              >
                <Calendar className="w-5 h-5" />{" "}
                {profile.role === "admin" ? "All Events" : "My Events"}
              </Link>
            )}

          {profile &&
            (profile.role === "admin" || profile.role === "organizer") && (
              <Link
                href="/analytics"
                onClick={closeSidebar}
                className={getLinkClasses("/analytics")}
              >
                <LineChart className="w-5 h-5" /> Analytics
              </Link>
            )}

          {profile?.role === "admin" && (
            <Link
              href="/users"
              onClick={closeSidebar}
              className={getLinkClasses("/users")}
            >
              <Users className="w-5 h-5" /> User Management
            </Link>
          )}

          {(profile?.role === "admin" ||
            profile?.role === "organizer" ||
            profile?.role === "attendee") && (
            <Link
              href="/chat"
              onClick={closeSidebar}
              className={getLinkClasses("/chat")}
            >
              <div className="flex items-center gap-3 w-full">
                <MessageSquare className="w-5 h-5" />
                <span>Chats</span>
                {unreadChatsCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                    {unreadChatsCount > 9 ? "9+" : unreadChatsCount}
                  </span>
                )}
              </div>
            </Link>
          )}
        </nav>

        {/* Profile Footer */}
        {profile && (
          <div className="p-4 shrink-0 border-t border-slate-800 space-y-2 bg-slate-900/50">
            <Link
              href="/profile"
              onClick={closeSidebar}
              className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 group cursor-pointer border ${
                isProfileActive
                  ? "bg-purple-600/10 border-purple-500/30"
                  : "hover:bg-slate-800 border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 ${
                    isProfileActive ? "border-purple-400" : "border-slate-600"
                  }`}
                >
                  {/* IMAGE MAPPING FIX: Using profile.profileImage */}
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-white uppercase bg-slate-700 w-full h-full flex items-center justify-center">
                      {profile.name ? profile.name.substring(0, 2) : "US"}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-semibold truncate max-w-[100px] transition-colors ${
                      isProfileActive
                        ? "text-purple-400"
                        : "group-hover:text-purple-300"
                    }`}
                  >
                    {profile.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    {profile.role}
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${
                  isProfileActive
                    ? "text-purple-400 translate-x-1"
                    : "text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1"
                }`}
              />
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center justify-between w-full hover:text-red-500 p-3 rounded-xl transition-all duration-200 hover:bg-slate-800 border border-transparent hover:border-red-700"
            >
              <span className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-slate-300 " />
                <span className="text-sm font-semibold text-slate-200 group-hover:text-red-500 transition-colors">
                  Sign out
                </span>
              </span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
