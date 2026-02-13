import Image from "next/image";
import { Instagram, Mail } from "lucide-react";
import type { ContactCopy } from "../content/site-content";

type ContactProps = {
  copy: ContactCopy;
};

export function Contact({ copy }: ContactProps) {
  return (
    <section id="contact" className="relative bg-racing-carbon py-24 md:py-32">
      <div className="track-line absolute top-0 left-0 w-full" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="motion-safe:animate-slide-in-left">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-racing-yellow" />
              <span className="font-mono text-xs font-medium tracking-[0.3em] text-racing-yellow uppercase">
                {copy.eyebrow}
              </span>
            </div>
            <h2 className="mb-6 font-mono text-3xl font-bold tracking-tight text-racing-white uppercase md:text-5xl">
              <span className="text-balance">
                {copy.titleStart} <span className="text-racing-yellow">{copy.titleHighlight}</span>
              </span>
            </h2>
            <p className="mb-8 max-w-lg text-base leading-relaxed text-racing-white/60 md:text-lg">
              {copy.description}
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href={copy.emailHref}
                className="inline-flex items-center gap-2 rounded-sm bg-racing-yellow px-6 py-3 font-sans text-sm font-bold tracking-wider text-racing-black uppercase transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Mail size={16} />
                {copy.primaryCta}
              </a>
              <a
                href={copy.instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-racing-white/20 px-6 py-3 font-sans text-sm font-bold tracking-wider text-racing-white uppercase transition-colors hover:border-racing-yellow hover:text-racing-yellow"
              >
                <Instagram size={16} />
                {copy.secondaryCta}
              </a>
            </div>
          </div>

          <div className="motion-safe:animate-slide-in-right">
            <a
              href={copy.instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-6 rounded-sm border border-racing-steel/20 bg-racing-black/50 p-10 text-center transition-all hover:border-racing-yellow/30"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-racing-steel/30 bg-racing-steel/10 transition-colors group-hover:border-racing-yellow/30">
                <Image
                  src="/instagram.png"
                  alt="Instagram"
                  width={36}
                  height={36}
                  className="opacity-60 transition-opacity group-hover:opacity-100"
                />
              </div>
              <div>
                <p className="font-mono text-lg font-bold tracking-wide text-racing-white uppercase">
                  {copy.instagramHandle}
                </p>
                <p className="mt-2 text-sm text-racing-white/40">{copy.instagramDescription}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-sm bg-racing-yellow/10 px-4 py-2 font-sans text-xs font-bold tracking-wider text-racing-yellow uppercase transition-colors group-hover:bg-racing-yellow/20">
                {copy.instagramCta}
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
