import Image from "next/image";
import { ChevronDown } from "lucide-react";
import type { HomeLiveBroadcast } from "@/lib/server/history/types";
import type { HeroCopy, Language } from "../content/site-content";

type HeroProps = {
  copy: HeroCopy;
  lang: Language;
  liveBroadcast?: HomeLiveBroadcast | null;
};

function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function formatArtDateTime(iso: string, locale: string): string | null {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return formatter.format(parsed);
}

function formatUtcDateTime(iso: string, locale: string): string | null {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `${formatter.format(parsed)} UTC`;
}

export function Hero({ copy, lang, liveBroadcast = null }: HeroProps) {
  const labels = lang === "en"
    ? {
        live: "LIVE",
        upcoming: "LIVE SOON",
        title: "Live broadcast",
        watchCta: "Watch on YouTube",
        startsAt: "Starts (Argentina Time, UTC-3)",
        startsAtUtc: "Starts (Universal Time, UTC)",
        endsAt: "Ends (Argentina Time, UTC-3)",
        endsAtUtc: "Ends (Universal Time, UTC)",
      }
    : {
        live: "LIVE",
        upcoming: "LIVE PRONTO",
        title: "Transmision en vivo",
        watchCta: "Ver en YouTube",
        startsAt: "Inicio (Hora Argentina, UTC-3)",
        startsAtUtc: "Inicio (Hora Universal, UTC)",
        endsAt: "Fin (Hora Argentina, UTC-3)",
        endsAtUtc: "Fin (Hora Universal, UTC)",
      };

  const locale = lang === "en" ? "en-US" : "es-AR";
  const startAtArt = liveBroadcast?.streamStartAt ? formatArtDateTime(liveBroadcast.streamStartAt, locale) : null;
  const endAtArt = liveBroadcast?.streamEndAt ? formatArtDateTime(liveBroadcast.streamEndAt, locale) : null;
  const startAtUtc = liveBroadcast?.streamStartAt
    ? formatUtcDateTime(liveBroadcast.streamStartAt, locale)
    : null;
  const endAtUtc = liveBroadcast?.streamEndAt ? formatUtcDateTime(liveBroadcast.streamEndAt, locale) : null;
  const hasEventContext = Boolean(
    liveBroadcast && liveBroadcast.roundNumber > 0 && liveBroadcast.circuitName !== "Live Broadcast",
  );

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-racing-black"
    >
      <div className="absolute inset-0">
        <Image
          src="/sinta-toyotagt86.webp"
          alt="SINTA eSports Toyota GT86 race car in action"
          fill
          priority
          className="object-cover object-center opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-racing-black via-racing-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-racing-black via-transparent to-racing-black/50" />
      </div>

      <div className="absolute inset-0 grid-overlay" />
      <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-racing-yellow/60 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-28 pb-20 md:pt-36 md:pb-24">
        <div className={liveBroadcast ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start" : "max-w-3xl"}>
          <div className="max-w-3xl">
          <div className="motion-safe:animate-fade-in mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-racing-yellow" />
            <span className="font-mono text-xs font-medium tracking-[0.3em] text-racing-yellow uppercase">
              {copy.eyebrow}
            </span>
          </div>

          <h1 className="motion-safe:animate-slide-up mb-5 font-mono text-4xl font-bold leading-tight tracking-tight text-racing-white uppercase md:text-6xl lg:text-7xl">
            <span className="text-balance">
              {copy.titleLine1} <span className="text-racing-yellow">{copy.highlightLine1}</span>
              <br />
              {copy.titleLine2} <span className="text-racing-yellow">{copy.highlightLine2}</span>
            </span>
          </h1>

          <p className="motion-safe:animate-slide-up mb-8 max-w-xl text-base font-medium leading-relaxed text-racing-white/60 md:text-lg [animation-delay:100ms]">
            {copy.description}
          </p>

          <div className="motion-safe:animate-slide-up flex flex-wrap gap-4 [animation-delay:200ms]">
            <a
              href="#about"
              className="inline-flex items-center gap-2 rounded-sm bg-racing-yellow px-8 py-3 font-sans text-sm font-bold tracking-wider text-racing-black uppercase transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {copy.primaryCta}
            </a>
            <a
              href="#results"
              className="inline-flex items-center gap-2 rounded-sm border border-racing-white/20 px-8 py-3 font-sans text-sm font-bold tracking-wider text-racing-white uppercase transition-colors hover:border-racing-yellow hover:text-racing-yellow"
            >
              {copy.secondaryCta}
            </a>
          </div>
        </div>

          {liveBroadcast ? (
            <aside className="motion-safe:animate-slide-in-right rounded-sm border border-racing-yellow/35 bg-racing-black/70 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span
                  className={`inline-flex rounded-sm px-2 py-1 text-[10px] font-bold tracking-[0.22em] uppercase ${
                    liveBroadcast.status === "live"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-racing-yellow/20 text-racing-yellow"
                  }`}
                >
                  {liveBroadcast.status === "live" ? labels.live : labels.upcoming}
                </span>
                <span className="text-[11px] text-racing-white/55 uppercase">
                  {labels.title}
                </span>
              </div>

              <h2 className="font-mono text-lg font-semibold text-racing-white uppercase">
                {liveBroadcast.championshipName}
              </h2>
              {hasEventContext ? (
                <p className="mt-1 text-xs text-racing-white/65 uppercase">
                  {liveBroadcast.seasonYear} R{liveBroadcast.roundNumber} - {liveBroadcast.circuitName}
                </p>
              ) : null}

              <div className="mt-3 overflow-hidden rounded-sm border border-racing-steel/40 bg-racing-carbon">
                <div className="aspect-video">
                  <iframe
                    src={buildYouTubeEmbedUrl(liveBroadcast.streamVideoId)}
                    title={`${liveBroadcast.championshipName} live broadcast`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              </div>

              <dl className="mt-3 space-y-1 text-[11px] text-racing-white/60">
                {startAtArt ? (
                  <div className="flex items-start justify-between gap-3">
                    <dt>{labels.startsAt}</dt>
                    <dd className="text-right">{startAtArt}</dd>
                  </div>
                ) : null}
                {startAtUtc ? (
                  <div className="flex items-start justify-between gap-3">
                    <dt>{labels.startsAtUtc}</dt>
                    <dd className="text-right">{startAtUtc}</dd>
                  </div>
                ) : null}
                {endAtArt ? (
                  <div className="flex items-start justify-between gap-3">
                    <dt>{labels.endsAt}</dt>
                    <dd className="text-right">{endAtArt}</dd>
                  </div>
                ) : null}
                {endAtUtc ? (
                  <div className="flex items-start justify-between gap-3">
                    <dt>{labels.endsAtUtc}</dt>
                    <dd className="text-right">{endAtUtc}</dd>
                  </div>
                ) : null}
              </dl>

              <a
                href={buildYouTubeWatchUrl(liveBroadcast.streamVideoId)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-sm border border-racing-yellow/45 px-3 py-2 text-xs font-bold tracking-wider text-racing-yellow uppercase transition-colors hover:border-racing-yellow hover:bg-racing-yellow/10"
              >
                {labels.watchCta}
              </a>
            </aside>
          ) : null}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <a
          href="#about"
          aria-label={copy.scrollAriaLabel}
          className="flex flex-col items-center gap-2 text-racing-white/40 transition-colors hover:text-racing-yellow"
        >
          <span className="text-xs font-medium tracking-widest uppercase">
            {copy.scrollLabel}
          </span>
          <ChevronDown size={20} className="animate-bounce" />
        </a>
      </div>
    </section>
  );
}
