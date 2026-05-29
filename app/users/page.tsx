"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/lib/types";
import { Users, Mail, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== "admin") return;

    const fetchUsers = async () => {
      try {
        const q = query(collection(db, "users"));
        const querySnapshot = await getDocs(q);
        const fetchedUsers = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as UserProfile,
        );
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [profile]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (
      !confirm(
        `Are you sure you want to change this user's role to ${newRole}?`,
      )
    )
      return;

    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: newRole as any } : u,
        ),
      );
      toast.success("User role updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update user role");
    }
  };

  if (!profile || profile.role !== "admin") {
    return (
      <DashboardLayout title="User Management">
        <div className="p-8 text-center text-slate-500">
          Unauthorised access. Admins only.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Management" badges={[`${users.length} Total`]}>
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const joinedDate = new Date(u.createdAt);
                const isSuperAdmin = u.email === "fonjennet56@gmail.com"; // Assuming the creator is super admin
                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 uppercase">
                          {u.name ? u.name.substring(0, 2) : "UN"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 mb-0.5 flex items-center gap-2">
                            {u.name}
                            {isSuperAdmin && (
                              <span title="Super Admin">
                                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 flex items-center gap-1 text-xs">
                            <Mail className="w-3 h-3" />
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : u.role === "organizer"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {joinedDate.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isSuperAdmin && (
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value)
                          }
                          className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="attendee">Attendee</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                      {isSuperAdmin && (
                        <span className="text-xs text-slate-400 font-medium">
                          Protected Role
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
