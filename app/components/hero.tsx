import Image from "next/image";
import { ChevronDown } from "lucide-react";
import type { HeroCopy } from "../content/site-content";

type HeroProps = {
  copy: HeroCopy;
};

export function Hero({ copy }: HeroProps) {
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
