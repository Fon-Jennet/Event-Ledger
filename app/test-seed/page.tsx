"use client";

import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function SeedPage() {
  const { user, profile } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  const handleSeed = async () => {
    if (!user || profile?.role !== 'organizer') {
      alert("Must be logged in as an organizer to seed events.");
      return;
    }
    
    setSeeding(true);
    try {
      const dbRef = collection(db, "events");
      
      const dummyEvents = [
        {
          title: "Buea Tech Fest 2024",
          description: "The largest tech gathering in Silicon Mountain. Join developers, designers, and founders for two days of learning and networking.",
          date: Date.now() + 86400000 * 7, // 7 days from now
          location: "Chariot Hotel, Buea",
          capacity: 500,
          price: 5000,
          organizerId: user.uid,
          soldCount: 15,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: "upcoming"
        },
        {
          title: "Douala Music & Arts Festival",
          description: "Experience the vibrant culture of Cameroon through music, poetry, and fine art exhibitions.",
          date: Date.now() + 86400000 * 3, // 3 days
          location: "Parc des Princes, Bali, Douala",
          capacity: 2000,
          price: 10000,
          organizerId: user.uid,
          soldCount: 450,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: "upcoming"
        },
        {
          title: "Yaoundé Founders Meetup",
          description: "Exclusive meetup for startup founders in the capital city to share insights and raise capital.",
          date: Date.now() + 86400000 * 14, // 14 days
          location: "Hilton Hotel, Yaoundé",
          capacity: 50,
          price: 25000,
          organizerId: user.uid,
          soldCount: 10,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: "upcoming"
        },
        {
          title: "Bamenda Cultural Dance Contest",
          description: "A profound celebration of the North West region's heritage.",
          date: Date.now() + 86400000 * 30, // 30 days
          location: "Commercial Avenue, Bamenda",
          capacity: 1000,
          price: 2000,
          organizerId: user.uid,
          soldCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: "upcoming"
        },
        {
          title: "Limbe Beach Code & Chill",
          description: "Code during the day, chill by the ocean at night. A retreat for software engineers.",
          date: Date.now() + 86400000 * 45, // 45 days
          location: "Seme Beach Hotel, Limbe",
          capacity: 100,
          price: 50000,
          organizerId: user.uid,
          soldCount: 45,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: "upcoming"
        }
      ];

      for (const e of dummyEvents) {
        await addDoc(dbRef, e);
      }
      setDone(true);
    } catch (e) {
      console.error(e);
      alert("Failed to seed.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-sm">
        <h1 className="text-xl font-bold mb-4">Seed Testing Data</h1>
        <p className="text-slate-500 text-sm mb-6">This will create 5 dummy events based in Cameroon. You must be an organizer to do this.</p>
        
        {done ? (
          <div className="text-green-600 font-bold">Successfully seeded! You can return to your dashboard.</div>
        ) : (
          <button 
            onClick={handleSeed}
            disabled={seeding}
            className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Seed Database"}
          </button>
        )}
      </div>
    </div>
  )
}
