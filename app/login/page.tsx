"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const { user, loading, signIn, signInWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showGoogleRoleSelect, setShowGoogleRoleSelect] = useState(false);
  const [selectedRole, setSelectedRole] = useState("attendee");

  useEffect(() => {
    if (user && !loading) {
      const redirectPath = searchParams.get("redirect") || "/dashboard";
      router.push(redirectPath);
    }
  }, [user, loading, router, searchParams]);

  const handleGoogleSignInClick = () => {
    setShowGoogleRoleSelect(true);
  };

  const proceedWithGoogleSignIn = async () => {
    setShowGoogleRoleSelect(false);
    setIsSigningIn(true);
    try {
      await signIn(selectedRole);
    } catch (error) {
      toast.error("Failed to sign in. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setIsSigningIn(true);
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in. Please check your credentials.");
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center mb-6 hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-black text-xl italic shadow-sm">
              E
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">EventLedger</span>
          </div>
        </Link>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Or{" "}
          <Link href="/signup" className="font-medium text-purple-600 hover:text-purple-500">
            create a new account for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          <form className="space-y-6 mb-6" onSubmit={handleEmailSignIn}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
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
              <label className="block text-sm font-medium text-slate-700">Password</label>
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

            <div>
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
              >
                {isSigningIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>

            {showGoogleRoleSelect ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <p className="text-sm font-medium text-slate-700 text-center">Select your account type (if new):</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("attendee")}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      selectedRole === "attendee"
                        ? "border-purple-600 bg-purple-100 text-purple-700 shadow-sm"
                        : "border-slate-300 bg-white text-slate-600"
                    }`}
                  >
                    Attendee
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("organizer")}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      selectedRole === "organizer"
                        ? "border-purple-600 bg-purple-100 text-purple-700 shadow-sm"
                        : "border-slate-300 bg-white text-slate-600"
                    }`}
                  >
                    Organizer
                  </button>
                </div>
                <button
                  type="button"
                  onClick={proceedWithGoogleSignIn}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition shadow-sm"
                >
                  Proceed with Google
                </button>
                <button
                   type="button"
                   onClick={() => setShowGoogleRoleSelect(false)}
                   className="w-full py-2 text-slate-500 text-xs text-center hover:underline"
                >
                   Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignInClick}
                disabled={isSigningIn}
                className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Google
              </button>
            )}

            <div className="text-center text-sm text-slate-500 mt-4">
              Note: Email/Password login might need to be enabled in Firebase settings.
            </div>
          </div>
          
          <div className="mt-8 border-t border-slate-100 pt-6">
            <Link href="/" className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
