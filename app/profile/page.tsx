"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    photoUrl: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        photoUrl: profile.photoUrl || "",
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    if (!file.type.startsWith("image/")) {
      setStatus({
        type: "error",
        message: "Please upload a valid image file.",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus({ type: "error", message: "Image must be less than 5MB." });
      return;
    }

    setIsUploading(true);
    setStatus({ type: null, message: "" });

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", `avatars/${profile.id}`);

      const res = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      const secureUrl = data.secureUrl as string;

      setFormData((prev) => ({ ...prev, photoUrl: secureUrl }));

      const userRef = doc(db, "users", profile.id);
      await updateDoc(userRef, { photoUrl: secureUrl });

      setStatus({
        type: "success",
        message: "Profile photo updated successfully!",
      });
    } catch (error) {
      console.error("Upload error:", error);
      setStatus({
        type: "error",
        message: "Failed to upload image. Try again.",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setStatus({ type: null, message: "" }), 4000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setIsSaving(true);
    setStatus({ type: null, message: "" });

    try {
      const userRef = doc(db, "users", profile.id);
      await updateDoc(userRef, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      });

      setStatus({
        type: "success",
        message: "Profile saved! Redirecting to dashboard...",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Save error:", error);
      setStatus({
        type: "error",
        message: "Failed to save profile. Please try again.",
      });
      setIsSaving(false);
      setTimeout(() => setStatus({ type: null, message: "" }), 4000);
    }
  };

  if (!profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-purple-500">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
              Account Settings
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Manage your personal information and application preferences
              securely.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/50">
            <div className="h-32 w-full bg-gradient-to-r from-purple-900/40 to-slate-900 border-b border-slate-800"></div>

            <form onSubmit={handleSubmit} className="px-6 md:px-10 pb-10">
              <div className="relative flex justify-between items-end -mt-16 mb-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden relative shadow-xl">
                    {isUploading ? (
                      <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                      </div>
                    ) : null}

                    {formData.photoUrl ? (
                      <img
                        src={formData.photoUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-slate-500 uppercase">
                        {formData.name ? formData.name.substring(0, 2) : "US"}
                      </span>
                    )}

                    <label
                      htmlFor="avatar-upload"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white z-20"
                    >
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Upload</span>
                    </label>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </div>

                  <div
                    className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full"
                    title="Online"
                  ></div>
                </div>

                {status.message && (
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium animate-in fade-in ${
                      status.type === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {status.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {status.message}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">
                    Personal Information
                  </h3>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-purple-500 transition-colors" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <Phone className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-purple-500 transition-colors" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">
                      Physical Address
                    </label>
                    <div className="relative group">
                      <MapPin className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-purple-500 transition-colors" />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter your full address"
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">
                    System Credentials
                  </h3>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500 ml-1 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        disabled
                        value={profile.email}
                        className="w-full bg-slate-900 border border-slate-800/50 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500 ml-1 block">
                      Platform Role
                    </label>
                    <div className="relative">
                      <Shield className="w-5 h-5 text-purple-600/50 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        disabled
                        value={profile.role.toUpperCase()}
                        className="w-full bg-slate-900 border border-slate-800/50 rounded-xl pl-12 pr-4 py-3.5 text-sm text-purple-400/70 font-bold cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10 mt-6 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 border border-purple-500/50"
                >
                  {isSaving ? "saving..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
