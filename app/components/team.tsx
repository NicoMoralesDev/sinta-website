import { User } from "lucide-react";
import type { TeamCopy } from "../content/site-content";

type TeamProps = {
  copy: TeamCopy;
};

export function Team({ copy }: TeamProps) {
  return (
    <section id="team" className="relative bg-racing-black py-24 md:py-32">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copy.members.map((member, index) => (
            <div
              key={member.name}
              className="motion-safe:animate-slide-up group relative overflow-hidden rounded-sm border border-racing-steel/20 bg-racing-carbon/60 transition-all hover:border-racing-yellow/40 hover:bg-racing-carbon"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="h-1 w-full bg-racing-steel/20 transition-colors group-hover:bg-racing-yellow" />

              <div className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-racing-steel/30 bg-racing-steel/20 text-racing-white/40 transition-colors group-hover:border-racing-yellow/30 group-hover:text-racing-yellow/60">
                  <User size={28} />
                </div>

                <div>
                  <span
                    className={`fi fi-${member.countryCode} mb-2 inline-block rounded-sm`}
                    aria-hidden="true"
                  />
                  <span className="sr-only">{member.country}</span>
                  <h3 className="font-mono text-base font-bold tracking-wide text-racing-white uppercase">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-xs font-medium tracking-wider text-racing-yellow/80 uppercase">
                    {member.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
