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
    ageRange?: string,
    profileImage?: string | null,
    phone?: string,
    address?: string,
  ) => Promise<User>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {
    throw new Error("AuthContext not initialized");
  },
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

        unsubscribeSnapshot = onSnapshot(profileRef, async (profileSnap) => {
          if (profileSnap.exists()) {
            setProfile({
              id: profileSnap.id,
              ...profileSnap.data(),
            } as UserProfile);
            setLoading(false);
          } else {
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
              name: currentUser.displayName || "Unknown User",
              role: role as any,
              createdAt: Date.now(),
              profileImage: "",
              phone: "",
              address: "",
            };

            await setDoc(profileRef, newProfile);
            setProfile({ id: currentUser.uid, ...newProfile } as UserProfile);
            setLoading(false);
          }
        });
      } else {
        setProfile(null);
        setLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

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
    ageRange?: string,
    profileImage?: string | null,
    phone: string = "",
    address: string = "",
  ): Promise<User> => {
    if (typeof window !== "undefined") {
      localStorage.setItem("signupRole", role);
    }

    const res = await createUserWithEmailAndPassword(auth, email, password);
    const profileRef = doc(db, "users", res.user.uid);

    const newProfile: Omit<UserProfile, "id"> = {
      email: res.user.email || email,
      name: name || "Unknown User",
      role: role as any,
      createdAt: Date.now(),
      profileImage: profileImage || "",
      phone,
      address,
      ...(role === "attendee" && ageRange ? { ageRange } : {}),
    };

    await setDoc(profileRef, newProfile);
    return res.user;
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
