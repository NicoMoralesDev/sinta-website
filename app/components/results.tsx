import { Medal } from "lucide-react";
import type { Language, ResultsCopy } from "../content/site-content";

type ResultsProps = {
  lang: Language;
  copy: ResultsCopy;
};

function getPositionStyle(position: number): string {
  if (position === 1) return "bg-racing-yellow text-racing-black";
  if (position === 2) return "bg-racing-white/20 text-racing-white";
  return "bg-racing-steel/40 text-racing-white/80";
}

export function Results({ lang, copy }: ResultsProps) {
  const locale = lang === "es" ? "es-ES" : "en-US";

  return (
    <section id="results" className="relative bg-racing-carbon py-24 md:py-32">
      <div className="track-line absolute top-0 left-0 w-full" />

      <div className="mx-auto max-w-7xl px-6">
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

        <div className="flex flex-col gap-3">
          {copy.results.map((result, index) => (
            <div
              key={`${result.event}-${result.date}`}
              className="motion-safe:animate-slide-up group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-sm border border-racing-steel/20 bg-racing-black/50 px-5 py-4 transition-colors hover:border-racing-yellow/30 md:grid-cols-[auto_1fr_1fr_auto]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm font-mono text-sm font-bold ${getPositionStyle(result.position)}`}
              >
                {result.position === 1 ? <Medal size={18} /> : `P${result.position}`}
              </div>

              <div className="min-w-0">
                <h3 className="truncate font-mono text-sm font-bold tracking-wide text-racing-white uppercase">
                  {result.event}
                </h3>
                <p className="text-xs font-medium text-racing-white/40">{result.series}</p>
              </div>

              <p className="hidden text-sm font-medium text-racing-white/50 md:block">
                {result.driver}
              </p>

              <time
                dateTime={result.date}
                className="shrink-0 text-xs font-medium tracking-wider text-racing-white/30 uppercase"
              >
                {new Date(result.date).toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
