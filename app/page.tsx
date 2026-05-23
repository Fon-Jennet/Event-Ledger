"use client";

import Link from "next/link";
//... wait this is just to replace the existing footer
import { Footer } from "@/components/footer";

// ... existing imports
import {
  ArrowRight,
  Ticket,
  Users,
  Calendar,
  ShieldCheck,
  Zap,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-pulse w-10 h-10 bg-purple-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-black text-xl italic shadow-sm">
                E
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                EventLedger
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a
                href="#features"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Features
              </a>
              <a
                href="#audience"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Who is this for?
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Pricing
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-700 hover:text-purple-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-purple-500" />
            <span className="leading-none">Find Your Next Experience</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6">
            Create, manage, and
            <br className="hidden md:block" /> scale your events.
          </h1>
          <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            EventLedger is the all-in-one platform for organizers to sell
            tickets, manage attendees, and host unforgettable experiences. Built
            for speed and reliability.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Start for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-sm"
            >
              See How It Works
            </a>
          </div>
        </section>

        {/* Feature Grid */}
        <section
          id="features"
          className="py-20 bg-white border-y border-slate-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Everything You Need
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                We provide the tools so you can focus on making your event a
                success.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-purple-200 transition-colors">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <Ticket className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Seamless Ticketing
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Sell tickets instantly. Generate secure QR codes for every
                  attendee and manage capacity effortlessly.
                </p>
              </div>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-purple-200 transition-colors">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Attendee Management
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Keep track of everyone with our real-time dashboard. Know
                  exactly who is coming and when they arrive.
                </p>
              </div>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-purple-200 transition-colors">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Secure Scanning
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Built-in ticket scanner ensures rapid check-ins and prevents
                  fraud. Verify attendees in milliseconds.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Stats & Partners */}
        <section className="py-16 bg-purple-600 text-white border-y border-purple-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-purple-500">
              <div>
                <h3 className="text-4xl font-black mb-2 font-mono">15,000+</h3>
                <p className="text-purple-200 font-medium">Events Created</p>
              </div>
              <div>
                <h3 className="text-4xl font-black mb-2 font-mono">1.2M+</h3>
                <p className="text-purple-200 font-medium">Tickets Sold</p>
              </div>
              <div>
                <h3 className="text-4xl font-black mb-2 font-mono">45k+</h3>
                <p className="text-purple-200 font-medium">Organizers</p>
              </div>
              <div>
                <h3 className="text-4xl font-black mb-2 font-mono">100%</h3>
                <p className="text-purple-200 font-medium">Secure Scans</p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-200 mb-6">
                Trusted by Innovative Partners in Cameroon and Beyond
              </p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                {/* Partner placeholders */}
                <span className="text-xl font-bold font-serif italic">
                  TechHub Cmr
                </span>
                <span className="text-xl font-black tracking-tighter">
                  SILICON MOUNTAIN
                </span>
                <span className="text-xl font-bold font-mono">MboaEvents</span>
                <span className="text-xl font-black tracking-widest">
                  ACTIVATARS
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works / About */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  What EventLedger is all about
                </h2>
                <p className="text-slate-600 leading-relaxed mb-6">
                  We noticed how broken the local event ticketing ecosystem was.
                  Organizers struggled with fragmented ticketing tools, high
                  fees, and low visibility. Attendees faced long queues and
                  ticket fraud.
                </p>
                <p className="text-slate-600 leading-relaxed mb-8">
                  EventLedger consolidates everything. You create your event,
                  generate a sharable page, users buy tickets, and you scan QR
                  codes at the gate using nothing but your dashboard. Simple,
                  verified, and incredibly fast.
                </p>
                <ul className="space-y-4">
                  {[
                    "Zero Setup Costs. Start free.",
                    "Real-time analytics and attendance tracking.",
                    "Direct communication with your attendees via global chat.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-slate-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl relative">
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-2xl shadow-lg transform -rotate-6">
                  1
                </div>
                <div className="space-y-8">
                  <div className="relative pl-12 border-l-2 border-slate-100 pb-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-purple-600 ring-4 ring-purple-100"></div>
                    <h4 className="font-bold text-slate-900 mb-2">
                      Create your Event
                    </h4>
                    <p className="text-sm text-slate-500">
                      Pick a date, location, set your capacity, and hit publish.
                    </p>
                  </div>
                  <div className="relative pl-12 border-l-2 border-slate-100 pb-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100"></div>
                    <h4 className="font-bold text-slate-900 mb-2">
                      Sell Tickets Automatically
                    </h4>
                    <p className="text-sm text-slate-500">
                      Users discover your event on the platform and purchase
                      tickets securely.
                    </p>
                  </div>
                  <div className="relative pl-12">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-600 ring-4 ring-green-100"></div>
                    <h4 className="font-bold text-slate-900 mb-2">
                      Scan & Welcome
                    </h4>
                    <p className="text-sm text-slate-500">
                      Open your dashboard at the venue gate, scan QR codes, and
                      welcome attendees.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section
          id="testimonials"
          className="py-24 bg-white border-t border-slate-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Loved by Organizers
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Don't just take our word for it—see what others have to say.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah M.",
                  role: "Tech Conference Lead",
                  text: "EventLedger completely eliminated the chaotic paper trails. Everyone checked in under 5 seconds.",
                },
                {
                  name: "David K.",
                  role: "Music Festival Director",
                  text: "We sold out 5,000 tickets in two days. The real-time tracking is a lifesaver for our capacity management.",
                },
                {
                  name: "Marie E.",
                  role: "Community Organizer",
                  text: "The interface is so simple that our volunteers didn't even need training to start scanning QR codes at the door.",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative"
                >
                  <div className="text-purple-300 text-6xl font-serif absolute top-4 left-4 opacity-50">
                    "
                  </div>
                  <p className="text-slate-700 relative z-10 italic mb-6 leading-relaxed">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm">
                      {t.name.split(" ")[0][0]}
                      {t.name.split(" ")[1][0]}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">
                        {t.name}
                      </h5>
                      <p className="text-xs text-slate-500 font-medium">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Area */}
        <section className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  q: "How do I scan tickets?",
                  a: "Log into your Organizer Dashboard, open your event, and click 'Scan Tickets'. It uses your device camera instantly.",
                },
                {
                  q: "Can I manage multiple events at once?",
                  a: "Yes. The dashboard aggregates sales and attendees across all your events automatically.",
                },
                {
                  q: "Is the platform really free?",
                  a: "Yes, you can create and host free events at zero cost. We only take a small percentage processing fee for paid tickets.",
                },
                {
                  q: "How can I get paid?",
                  a: "Payouts are routed directly to your configured bank account or mobile money wallet depending on your region integrations.",
                },
              ].map((faq, i) => (
                <details
                  key={i}
                  className="group bg-white border border-slate-200 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden cursor-pointer shadow-sm"
                >
                  <summary className="flex items-center justify-between p-6 font-semibold text-slate-900 hover:text-purple-600 transition-colors">
                    {faq.q}
                    <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
