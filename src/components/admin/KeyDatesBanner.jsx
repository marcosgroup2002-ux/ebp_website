import { CalendarClock } from "lucide-react";
import { KEY_DATES } from "../../data/adminData";

export default function KeyDatesBanner() {
  const today = new Date();
  const day = today.getDate();

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <div className="flex items-center gap-2 text-ink/50">
        <CalendarClock size={15} />
        <p className="text-xs font-semibold uppercase tracking-wide">Dates clés du mois</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {KEY_DATES.map((k) => {
          const isToday = k.day === day;
          const isPast = k.day < day;
          return (
            <div
              key={k.day}
              className={`rounded-xl border p-3 ${
                isToday
                  ? "border-ebp-green bg-ebp-green/5"
                  : isPast
                  ? "border-ink/5 opacity-50"
                  : "border-ink/10"
              }`}
            >
              <p className={`font-display text-lg font-bold ${isToday ? "text-ebp-green" : "text-ink"}`}>
                {k.day}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-ink/50">{k.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
