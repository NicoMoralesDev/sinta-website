import Link from "next/link";

import type { EventParticipationCard } from "@/lib/server/history/types";

import type { Language, ResultsCopy } from "../content/site-content";
import { EventParticipationList } from "./event-participation-list";

type ResultsProps = {
  lang: Language;
  copy: ResultsCopy;
  events: EventParticipationCard[];
  currentChampionshipSlug?: string;
};

function buildFullResultsHref(lang: Language): string {
  return lang === "en" ? "/results?lang=en" : "/results";
}

function buildCurrentChampionshipHref(lang: Language, championshipSlug?: string): string {
  const params = new URLSearchParams();
  if (championshipSlug) {
    params.set("championship", championshipSlug);
  }

  if (lang === "en") {
    params.set("lang", "en");
  }

  const query = params.toString();
  return query ? `/results?${query}` : "/results";
}

export function Results({ lang, copy, events, currentChampionshipSlug }: ResultsProps) {
  return (
    <section id="results" className="relative bg-racing-carbon py-24 md:py-32">
      <div className="track-line absolute top-0 left-0 w-full" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
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

        <EventParticipationList lang={lang} events={events} emptyMessage={copy.emptyMessage} />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={buildFullResultsHref(lang)}
            className="inline-flex items-center rounded-sm bg-racing-yellow px-4 py-2 text-xs font-bold tracking-wider text-racing-black uppercase transition-colors hover:bg-racing-yellow/90"
          >
            {copy.ctaAllResults}
          </Link>
          <Link
            href={buildCurrentChampionshipHref(lang, currentChampionshipSlug)}
            className="inline-flex items-center rounded-sm border border-racing-yellow/40 px-4 py-2 text-xs font-bold tracking-wider text-racing-yellow uppercase transition-colors hover:border-racing-yellow hover:bg-racing-yellow/10"
          >
            {copy.ctaCurrentChampionship}
          </Link>
        </div>
      </div>
    </section>
  );
}
