"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Ban as Banknote,
  Loader2,
  Tag,
  Image as ImageIcon,
  ChevronDown,
} from "lucide-react";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.id;
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    eventType: "Conference",
    description: "",
    date: "",
    location: "",
    price: 0,
    capacity: 100,
    status: "upcoming",
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, "events", eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Verify ownership for organizer
          if (
            profile?.role === "organizer" &&
            data.organizerId !== profile.id
          ) {
            toast.error("Unauthorized");
            router.push("/events");
            return;
          }

          // Format date for datetime-local input
          const eventDate = new Date(data.date);
          const localDateTime = new Date(
            eventDate.getTime() - eventDate.getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16);

          // Handle Image Initialization
          if (data.imageUrl) {
            setExistingImageUrl(data.imageUrl);
            setImagePreview(data.imageUrl);
          }

          setFormData({
            title: data.title,
            eventType: data.eventType || "Conference",
            description: data.description,
            date: localDateTime,
            location: data.location,
            price: data.price,
            capacity: data.capacity,
            status: data.status,
          });
        } else {
          toast.error("Event not found");
          router.push("/events");
        }
      } catch (error) {
        toast.error("Error fetching event details");
      } finally {
        setLoading(false);
      }
    };
    if (profile && (profile.role === "admin" || profile.role === "organizer")) {
      fetchEvent();
    }
  }, [eventId, profile, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Basic validation
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalImageUrl = existingImageUrl;

      // Only upload a new image if the user selected a new file
      if (imageFile) {
        const fileExtension = imageFile.name.split(".").pop();
        const fileName = `events/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        title: formData.title,
        eventType: formData.eventType,
        imageUrl: finalImageUrl,
        description: formData.description,
        date: new Date(formData.date).getTime(),
        location: formData.location,
        price: Number(formData.price),
        capacity: Number(formData.capacity),
        status: formData.status,
        updatedAt: Date.now(),
      });
      toast.success("Event updated successfully");
      router.push("/events");
    } catch (error: any) {
      toast.error(error.message || "Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  if (!profile || (profile.role !== "organizer" && profile.role !== "admin")) {
    return (
      <DashboardLayout title="Unauthorized">
        <div className="p-8 text-center text-slate-500">
          Only organizers and admins can edit events.
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout title="Edit Event" badges={[]}>
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Event" badges={["Editing"]}>
      <div className="max-w-3xl mx-auto pb-12">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-8"
        >
          {/* Cover Image Upload Section */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Event Cover Image
            </label>
            <div
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors ${imagePreview ? "border-purple-300 bg-purple-50/30" : "border-slate-300 bg-slate-50 hover:border-purple-400"}`}
            >
              <div className="space-y-2 text-center w-full">
                {imagePreview ? (
                  <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg"
                      >
                        Change Image
                      </label>
                    </div>
                  </div>
                ) : (
                  <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                )}

                {!imagePreview && (
                  <>
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-semibold text-purple-600 hover:text-purple-500 focus-within:outline-none px-2 py-1"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1 py-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      PNG, JPG, WEBP up to 5MB
                    </p>
                  </>
                )}

                {imagePreview && (
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageChange}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Event Title
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors font-medium"
                />
              </div>

              {/* Event Type Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Event Category
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    required
                    value={formData.eventType}
                    onChange={(e) =>
                      setFormData({ ...formData, eventType: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-10 py-3.5 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors appearance-none font-medium cursor-pointer"
                  >
                    <option value="Conference">Conference</option>
                    <option value="Workshop">Workshop & Training</option>
                    <option value="Concert">Concert & Music</option>
                    <option value="Meetup">Meetup & Networking</option>
                    <option value="Festival">Festival</option>
                    <option value="Sports">Sports & Fitness</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors resize-none font-medium"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date & Time */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Date & Time
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    required
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors font-medium"
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Price (FCFA)
                </label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors font-medium"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Capacity
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors font-medium"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors h-[48px] font-medium cursor-pointer"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              type="submit"
              className="px-8 py-2.5 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-lg shadow-purple-600/20 disabled:opacity-70 flex items-center gap-2"
            >
              {saving && (
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
