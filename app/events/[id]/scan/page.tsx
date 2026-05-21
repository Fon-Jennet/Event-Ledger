"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useState, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Search, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function TicketScannerPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.id;
  const { profile } = useAuth();
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{status: 'success' | 'error', message: string, ticket?: any} | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim()) return;
    
    setLoading(true);
    setResult(null);
    try {
      const ticketRef = doc(db, "tickets", ticketId.trim());
      const ticketSnap = await getDoc(ticketRef);
      
      if (!ticketSnap.exists()) {
         setResult({ status: 'error', message: "Ticket not found in system." });
         return;
      }
      
      const ticketData = ticketSnap.data();
      
      if (ticketData.eventId !== eventId) {
         setResult({ status: 'error', message: "Ticket belongs to a different event." });
         return;
      }
      
      if (ticketData.status === 'scanned') {
         setResult({ status: 'error', message: "Ticket has already been scanned!", ticket: ticketData });
         return;
      }
      
      if (ticketData.status === 'cancelled') {
         setResult({ status: 'error', message: "Ticket was cancelled.", ticket: ticketData });
         return;
      }
      
      // Update ticket
      await updateDoc(ticketRef, { status: 'scanned' });
      setResult({ status: 'success', message: "Ticket verified and scanned successfully!", ticket: ticketData });
      
    } catch (error: any) {
      console.error(error);
      setResult({ status: 'error', message: "Error verifying ticket." });
    } finally {
      setLoading(false);
      setTicketId("");
    }
  };

  if (!profile || (profile.role !== "organizer" && profile.role !== "admin")) {
     return <DashboardLayout><div className="p-8 text-center">Unauthorized.</div></DashboardLayout>
  }

  return (
    <DashboardLayout title="Ticket Scanner" badges={["Scanner Mode"]}>
      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
           <h2 className="text-xl font-bold text-slate-900 mb-2">Scan Ticket</h2>
           <p className="text-sm text-slate-500 mb-6">Enter the Ticket ID or use a connected barcode scanner.</p>
           
           <form onSubmit={handleScan} className="space-y-4">
             <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
               <input 
                 autoFocus
                 type="text" 
                 value={ticketId}
                 onChange={e => setTicketId(e.target.value)}
                 placeholder="Ticket ID..."
                 className="w-full pl-12 pr-4 py-4 text-center tracking-widest font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-lg"
               />
             </div>
             <button 
               disabled={loading || !ticketId.trim()}
               type="submit"
               className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
             >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Ticket"}
             </button>
           </form>
        </div>

        {result && (
          <div className={`p-6 rounded-xl border flex flex-col items-center text-center ${result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {result.status === 'success' ? (
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
            )}
            <h3 className={`text-xl font-bold mb-2 ${result.status === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {result.status === 'success' ? 'Valid Ticket!' : 'Invalid Ticket'}
            </h3>
            <p className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>
              {result.message}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
