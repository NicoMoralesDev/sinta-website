import { CalendarDays, Clock, MapPin } from "lucide-react";
import type { CalendarCopy, Language } from "../content/site-content";

type CalendarProps = {
  lang: Language;
  copy: CalendarCopy;
};

export function Calendar({ lang, copy }: CalendarProps) {
  const locale = lang === "es" ? "es-ES" : "en-US";

  return (
    <section id="calendar" className="relative bg-racing-black py-24 md:py-32">
      <div className="grid-overlay absolute inset-0" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-racing-yellow" />
            <span className="font-mono text-xs font-medium tracking-[0.3em] text-racing-yellow uppercase">
              {copy.eyebrow}
            </span>
            <span className="h-px w-8 bg-racing-yellow" />
          </div>
          <h2 className="font-mono text-3xl font-bold tracking-tight text-racing-white uppercase md:text-5xl">
            <span className="text-balance">
              {copy.titleStart} <span className="text-racing-yellow">{copy.titleHighlight}</span>
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {copy.events.map((event, index) => (
            <div
              key={event.name}
              className="motion-safe:animate-slide-up group relative overflow-hidden rounded-sm border border-racing-steel/20 bg-racing-carbon/60 transition-all hover:border-racing-yellow/30"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="absolute top-0 left-0 h-full w-1 bg-racing-steel/20 transition-colors group-hover:bg-racing-yellow" />

              <div className="flex flex-col gap-4 p-6 pl-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-mono text-lg font-bold tracking-wide text-racing-white uppercase">
                      {event.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium tracking-wider text-racing-yellow/70 uppercase">
                      {event.series}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-center rounded-sm bg-racing-yellow/10 px-3 py-2 text-center">
                    <span className="font-mono text-lg font-bold leading-none text-racing-yellow">
                      {new Date(event.date).getDate()}
                    </span>
                    <span className="text-[10px] font-semibold tracking-wider text-racing-yellow/70 uppercase">
                      {new Date(event.date).toLocaleDateString(locale, {
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-racing-white/40">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-racing-white/25" />
                    {new Date(event.date).toLocaleDateString(locale, {
                      weekday: "long",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-racing-white/25" />
                    {event.time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-racing-white/25" />
                    {event.track}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
