"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile } from "./types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (role?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string,
    
    role?: string,
  ) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const profileRef = doc(db, "users", currentUser.uid);

        // 🟢 REAL-TIME LISTENER: Replaces getDoc()
        // Automatically updates the 'profile' state whenever the Firestore document changes
        unsubscribeSnapshot = onSnapshot(profileRef, async (profileSnap) => {
          if (profileSnap.exists()) {
            setProfile({
              id: profileSnap.id,
              ...profileSnap.data(),
            } as UserProfile);
            setLoading(false);
          } else {
            // Profile doesn't exist yet, initialize it (preserves your localStorage logic)
            let role = "attendee";
            if (typeof window !== "undefined") {
              const storedRole = localStorage.getItem("signupRole");
              if (storedRole) {
                role = storedRole;
                localStorage.removeItem("signupRole");
              }
            }

            const newProfile: Omit<UserProfile, "id"> = {
              email: currentUser.email || "",
              name: currentUser.displayName || "Unknown Attendee",
              role: role as any,
              createdAt: Date.now(),
              // Note: If your UserProfile type has optional fields like photoURL or phone,
              // you can initialize them as empty strings here if desired.
            };

            await setDoc(profileRef, newProfile);
            // We don't necessarily need to call setProfile manually here because
            // setDoc will trigger the onSnapshot listener again immediately,
            // but setting it ensures no UI flash.
            setProfile({ id: currentUser.uid, ...newProfile } as UserProfile);
            setLoading(false);
          }
        });
      } else {
        setProfile(null);
        setLoading(false);
        // Clean up snapshot listener if user logs out
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    // Clean up all listeners on component unmount
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const signIn = async (role?: string) => {
    if (role && typeof window !== "undefined") {
      localStorage.setItem("signupRole", role);
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string,
    role: string = "attendee",
  ) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("signupRole", role);
    }
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const profileRef = doc(db, "users", res.user.uid);
    const newProfile: Omit<UserProfile, "id"> = {
      email: res.user.email || email,
      name: name || "Unknown Attendee",
      role: role as any,
      createdAt: Date.now(),
    };
    await setDoc(profileRef, newProfile);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signInWithEmail,
        signUpWithEmail,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
