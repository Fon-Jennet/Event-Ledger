"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function DashboardCalendar({
  events,
  userRole,
}: {
  events: any[];
  userRole: string;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );

  const eventsMap = useMemo(() => {
    const map = new Map<string, string>(); // date string => color class
    events.forEach((e) => {
      const d = new Date(e.date);
      const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (userRole === "organizer" || userRole === "admin") {
        map.set(
          dateStr,
          "bg-purple-100 text-purple-700 font-bold border border-purple-300",
        );
      } else {
        map.set(
          dateStr,
          "bg-green-100 text-green-700 font-bold border border-green-300",
        );
      }
    });
    return map;
  }, [events, userRole]);

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-8"></div>);
  }

  const today = new Date();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${d}`;
    const isToday =
      d === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
    const eventClass = eventsMap.get(dateStr);

    days.push(
      <div
        key={d}
        className={`h-8 flex items-center justify-center text-xs rounded-lg transition-colors ${
          isToday && !eventClass
            ? "bg-slate-800 text-white font-bold"
            : eventClass
              ? eventClass
              : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {d}
      </div>,
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-slate-800">
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h4>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-1 rounded bg-slate-50 hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded bg-slate-50 hover:bg-slate-100"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase font-bold text-slate-400 mb-2">
        <div>Su</div>
        <div>Mo</div>
        <div>Tu</div>
        <div>We</div>
        <div>Th</div>
        <div>Fr</div>
        <div>Sa</div>
      </div>
      <div className="grid grid-cols-7 gap-1">{days}</div>
    </div>
  );
}
