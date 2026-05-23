"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // 1. Import useRouter
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Users,
  LineChart,
  Ticket,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Sidebar() {
  // 2. Destructure logOut (capital O) to match your AuthContext
  const { profile, logOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter(); // 3. Initialize router
  const [isOpen, setIsOpen] = useState(false);

  const getLinkClasses = (path: string) => {
    const isActive = pathname === path || pathname.startsWith(path + "/");
    return `py-2 px-4 rounded-lg flex items-center gap-3 font-medium transition-all duration-200 ${
      isActive
        ? "bg-purple-600/20 text-purple-400 border border-purple-500/20"
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
    }`;
  };

  const closeSidebar = () => setIsOpen(false);
  const isProfileActive = pathname === "/profile";

  // 4. Create a dedicated async handler for logging out
  const handleSignOut = async () => {
    try {
      closeSidebar();
      await logOut(); // Clears the Firebase session
      router.push("/login"); // Redirects user to the login screen (change to "/" if your login is on the home page)
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-lg"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col h-full shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="p-6 flex items-center gap-3 mt-10 md:mt-0">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-white font-black italic">E</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Event Ledger</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {/* ... (Your existing navigation links remain exactly the same) ... */}
          <Link
            href="/dashboard"
            onClick={closeSidebar}
            className={getLinkClasses("/dashboard")}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
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

          <Link
            href="/chat"
            onClick={closeSidebar}
            className={getLinkClasses("/chat")}
          >
            <MessageSquare className="w-5 h-5" /> Chat Center
          </Link>

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
        </nav>

        {profile && (
          <div className="p-4 mt-auto border-t border-slate-800 space-y-2 bg-slate-900/50">
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 ${isProfileActive ? "border-purple-400" : "border-slate-600"}`}
                >
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-white uppercase bg-slate-700 w-full h-full flex items-center justify-center">
                      {profile.name.substring(0, 2)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-semibold truncate max-w-[100px] transition-colors ${isProfileActive ? "text-purple-400" : "group-hover:text-purple-300"}`}
                  >
                    {profile.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    {profile.role}
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${isProfileActive ? "text-purple-400 translate-x-1" : "text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1"}`}
              />
            </Link>

            {/* 5. Attach the handleSignOut function here */}
          </div>
        )}
      </aside>
    </>
  );
}
