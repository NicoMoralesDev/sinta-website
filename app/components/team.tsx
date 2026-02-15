import Link from "next/link";
import { User } from "lucide-react";
import type { Language, TeamCopy } from "../content/site-content";

type TeamProps = {
  lang: Language;
  copy: TeamCopy;
};

export function Team({ lang, copy }: TeamProps) {
  const languageSuffix = lang === "en" ? "?lang=en" : "";

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
            <article
              key={member.name}
              className="motion-safe:animate-slide-up group relative overflow-hidden rounded-sm border border-racing-steel/20 bg-racing-carbon/60 transition-all hover:border-racing-yellow/40 hover:bg-racing-carbon"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {member.slug ? (
                <Link
                  href={`/drivers/${member.slug}${languageSuffix}`}
                  className="block"
                  aria-label={member.name}
                >
                  <div className="h-1 w-full bg-racing-steel/20 transition-colors group-hover:bg-racing-yellow" />
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-racing-steel/30 bg-racing-steel/20 text-racing-white/40 transition-colors group-hover:border-racing-yellow/30 group-hover:text-racing-yellow/60">
                      <User size={28} />
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-mono text-base font-bold tracking-wide text-racing-white uppercase">
                        {member.name}
                      </h3>
                      <p className="mt-1 max-w-[14rem] text-[11px] leading-snug font-medium tracking-wide text-racing-yellow/80 uppercase">
                        {member.role}
                      </p>
                      <p className="inline-flex items-center gap-2 text-xs text-racing-white/65">
                        <span className={`fi fi-${member.countryCode} rounded-sm`} aria-hidden="true" />
                        <span>{member.country}</span>
                      </p>
                    </div>
                  </div>
                </Link>
              ) : (
                <>
                  <div className="h-1 w-full bg-racing-steel/20 transition-colors group-hover:bg-racing-yellow" />
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-racing-steel/30 bg-racing-steel/20 text-racing-white/40 transition-colors group-hover:border-racing-yellow/30 group-hover:text-racing-yellow/60">
                      <User size={28} />
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-mono text-base font-bold tracking-wide text-racing-white uppercase">
                        {member.name}
                      </h3>
                      <p className="mt-1 max-w-[14rem] text-[11px] leading-snug font-medium tracking-wide text-racing-yellow/80 uppercase">
                        {member.role}
                      </p>
                      <p className="inline-flex items-center gap-2 text-xs text-racing-white/65">
                        <span className={`fi fi-${member.countryCode} rounded-sm`} aria-hidden="true" />
                        <span>{member.country}</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
