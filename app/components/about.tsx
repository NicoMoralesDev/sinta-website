import { Target, Trophy, Users } from "lucide-react";
import type { AboutCopy } from "../content/site-content";

type AboutProps = {
  copy: AboutCopy;
};

const statIcons = [Trophy, Target, Users] as const;

export function About({ copy }: AboutProps) {
  return (
    <section id="about" className="relative bg-racing-carbon py-24 md:py-32">
      <div className="track-line absolute top-0 left-0 w-full" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
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
            <p className="mb-6 text-base leading-relaxed text-racing-white/60 md:text-lg">
              {copy.paragraph1}
            </p>
            <p className="text-base leading-relaxed text-racing-white/60 md:text-lg">
              {copy.paragraph2}
            </p>
          </div>

          <div className="motion-safe:animate-slide-in-right grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-1 lg:gap-8">
            {copy.stats.map((stat, index) => {
              const Icon = statIcons[index] ?? Trophy;

              return (
                <div
                  key={stat.label}
                  className="group flex items-center gap-5 rounded-sm border border-racing-steel/30 bg-racing-black/50 p-6 transition-colors hover:border-racing-yellow/40"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-racing-yellow/10 text-racing-yellow transition-colors group-hover:bg-racing-yellow/20">
                    <Icon size={24} />
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-racing-yellow">
                      {stat.value}
                    </p>
                    <p className="text-sm font-medium tracking-wider text-racing-white/50 uppercase">
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
