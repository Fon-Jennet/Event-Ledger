import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 text-sm shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded border border-slate-700 flex items-center justify-center text-white font-black text-xs italic">
              E
            </div>
            <span className="font-bold text-lg tracking-tight text-white">EventLedger</span>
          </div>
          <p className="max-w-xs leading-relaxed">
            Making event management simple, scalable, and secure for everyone around the world. Based in Cameroon.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Product</h4>
          <ul className="space-y-2">
            <li><Link href="#features" className="hover:text-purple-400 transition-colors">Features</Link></li>
            <li><Link href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</Link></li>
            <li><Link href="#testimonials" className="hover:text-purple-400 transition-colors">Testimonials</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Legal</h4>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:text-purple-400 transition-colors">Terms of Service</Link></li>
            <li><Link href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-purple-400 transition-colors">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 flex justify-between items-center">
        <p>© 2024 EventLedger Inc. All rights reserved.</p>
        <div className="flex items-center gap-4 uppercase tracking-widest text-[10px] font-bold">
          <span>System Active</span>
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
        </div>
      </div>
    </footer>
  );
}
