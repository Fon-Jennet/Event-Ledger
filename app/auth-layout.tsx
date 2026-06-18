import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch font-sans">
      <div className="hidden lg:block w-1/2">
        <div className="h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Event.jpg"
            alt="Event"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
