"use client";

import { useAuth } from "@/lib/auth-context";
import AuthLayout from "@/app/auth-layout";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

function SignupForm() {
  const { user, loading, signIn, signUpWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("attendee");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      const redirectPath = searchParams.get("redirect") || "/dashboard";
      router.push(redirectPath);
    }
  }, [user, loading, router, searchParams]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      toast.error("Image is too large. Please select an image under 800KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      setImageBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn(role);
    } catch {
      toast.error("Failed to sign up. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.error("Please enter your name, email, and password");
      return;
    }

    if (role === "attendee" && !ageRange) {
      toast.error("Please select your age range");
      return;
    }

    setIsSigningIn(true);
    try {
      await signUpWithEmail(
        email,
        password,
        name,
        role,
        ageRange,
        imageBase64,
        phone,
        address,
      );
      toast.success("Account created successfully!");
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to create account. Please try again.",
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="w-full max-w-md mx-auto">
          <Link
            href="/"
            className="flex justify-center mb-6 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-black text-xl italic shadow-sm">
                E
              </div>
              <span className="font-bold text-2xl tracking-tight text-slate-900">
                EventLedger
              </span>
            </div>
          </Link>

          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              Sign in here
            </Link>
          </p>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
              <form className="space-y-6 mb-6" onSubmit={handleEmailSignUp}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    I want to...
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole("attendee")}
                      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                        role === "attendee"
                          ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      Attend Events
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("organizer")}
                      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                        role === "organizer"
                          ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      Host Events
                    </button>
                  </div>
                </div>
              </form>

              {/* Image Upload Area */}
              {/* <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Profile Picture
              </label>
              <div className="mt-1 flex items-center gap-4 flex-wraps">
                <div className="w-32 h-32 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden relative shadow-xl">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <label className="cursor-pointer bg-white py-2 px-3 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
              </div>
            </div> */}
              <div className="mt-8">
                <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
                  <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-100 flex items-start gap-3">
                    <div>
                      <p className="text-sm text-purple-700 leading-relaxed font-medium">
                        Join thousands of users organizing and attending events.
                        One click is all it takes to get started.
                      </p>
                    </div>
                  </div>

                  <form className="space-y-6 mb-6" onSubmit={handleEmailSignUp}>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        I want to...
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setRole("attendee")}
                          className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                            role === "attendee"
                              ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          Attend Events
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole("organizer")}
                          className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                            role === "organizer"
                              ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          Host Events
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>

                    {role === "attendee" && (
                      <div className="transition-all duration-200">
                        <label className="block text-sm font-medium text-slate-700">
                          Age Range
                        </label>
                        <select
                          required={role === "attendee"}
                          value={ageRange}
                          onChange={(e) => setAgeRange(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-lg shadow-sm sm:text-sm text-slate-800"
                        >
                          <option value="" disabled>
                            Select your age group
                          </option>
                          <option value="under-18">Under 18</option>
                          <option value="18+">Adult</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="612345678"
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Physical Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your address"
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Full Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Email address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Email address
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSigningIn}
                      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isSigningIn ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Sign up"
                      )}
                    </button>
                  </form>
                  <div>
                    <button
                      type="submit"
                      disabled={isSigningIn}
                      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
                    >
                      {isSigningIn ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Sign up"
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-slate-500">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSigningIn}
                    className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                    Google
                  </button>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
