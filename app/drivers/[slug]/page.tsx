import Link from "next/link";

import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";
import { EventParticipationList } from "@/app/components/event-participation-list";
import {
  RoundHeatmap,
  SparklinePositions,
  StatusDonut,
  TopXDistributionBars,
} from "@/app/components/visualizations";
import { resolveLanguage, siteCopy } from "@/app/content/site-content";
import {
  getDriverHistory,
  getDriverProfileBySlug,
  getFilters,
} from "@/lib/server/history/service";

export const revalidate = 120;

type SearchValue = string | string[] | undefined;

type DriverPageProps = {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams?: Promise<Record<string, SearchValue>> | Record<string, SearchValue>;
};

function firstValue(value: SearchValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toSearchParams(input?: Record<string, SearchValue>): URLSearchParams {
  const params = new URLSearchParams();
  if (!input) {
    return params;
  }

  for (const [key, value] of Object.entries(input)) {
    const normalized = firstValue(value);
    if (normalized !== undefined && normalized !== "") {
      params.set(key, normalized);
    }
  }

  return params;
}

function buildDriverHref({
  slug,
  year,
  championship,
  limit,
  cursor,
  lang,
}: {
  slug: string;
  year?: string;
  championship?: string;
  limit?: string;
  cursor?: string | null;
  lang: "es" | "en";
}): string {
  const params = new URLSearchParams();
  if (year) {
    params.set("year", year);
  }
  if (championship) {
    params.set("championship", championship);
  }
  if (limit) {
    params.set("limit", limit);
  }
  if (cursor) {
    params.set("cursor", cursor);
  }
  if (lang === "en") {
    params.set("lang", "en");
  }

  const query = params.toString();
  return query ? `/drivers/${slug}?${query}` : `/drivers/${slug}`;
}

export default async function DriverProfilePage({ params, searchParams }: DriverPageProps) {
  const { slug } = await Promise.resolve(params);
  const rawSearchParams = await Promise.resolve(searchParams);
  const query = toSearchParams(rawSearchParams);
  const lang = resolveLanguage(query.get("lang") ?? undefined);
  const chromeCopy = siteCopy[lang];
  const limit = query.get("limit") ?? "10";
  query.set("limit", limit);

  const year = query.get("year") ?? undefined;
  const championship = query.get("championship") ?? undefined;

  const i18n =
    lang === "en"
      ? {
          notFound: "Driver not found.",
          backHome: "Back to home",
          backResults: "Back to results",
          history: "Race history",
          stats: "Career stats",
          incidents: "Incidents",
          wins: "Wins",
          podiums: "Podiums",
          top5: "Top 5",
          top10: "Top 10",
          completed: "Completed",
          apply: "Apply filters",
          reset: "Reset",
          year: "Year",
          championship: "Championship",
          allYears: "All years",
          allChampionships: "All championships",
          next: "Load more",
          noHistory: "No race history with these filters.",
          trend: "Recent position trend",
          topx: "Top finishes distribution",
          statuses: "Result status mix",
          heatmap: "Round heatmap",
        }
      : {
          notFound: "Piloto no encontrado.",
          backHome: "Volver al inicio",
          backResults: "Volver al historial",
          history: "Historial de carreras",
          stats: "Estadísticas generales",
          incidents: "Incidentes",
          wins: "Victorias",
          podiums: "Podios",
          top5: "Top 5",
          top10: "Top 10",
          completed: "Completadas",
          apply: "Aplicar filtros",
          reset: "Limpiar",
          year: "Año",
          championship: "Torneo",
          allYears: "Todos los años",
          allChampionships: "Todos los torneos",
          next: "Cargar más",
          noHistory: "No hay historial para estos filtros.",
          trend: "Tendencia de posiciones recientes",
          topx: "Distribución de Top X",
          statuses: "Mezcla de estados",
          heatmap: "Heatmap por rondas",
        };

  const [filters, profileResult] = await Promise.all([
    getFilters().catch(() => null),
    getDriverProfileBySlug(slug)
      .then((profile) => ({ profile, error: null as string | null }))
      .catch((error: unknown) => ({
        profile: null,
        error: error instanceof Error ? error.message : i18n.notFound,
      })),
  ]);

  const languageHrefs = {
    es: buildDriverHref({ slug, year, championship, limit, cursor: query.get("cursor"), lang: "es" }),
    en: buildDriverHref({ slug, year, championship, limit, cursor: query.get("cursor"), lang: "en" }),
  };

  if (!profileResult.profile) {
    return (
      <>
        <Navbar
          lang={lang}
          links={chromeCopy.navLinks}
          homeSectionsLabel={chromeCopy.homeSectionsLabel}
          homeSections={chromeCopy.homeSections}
          languageLabel={chromeCopy.languageLabel}
          languageAria={chromeCopy.languageAria}
          instagramHref={chromeCopy.contact.instagramHref}
          instagramAriaLabel={chromeCopy.contact.instagramAriaLabel}
          languageHrefs={languageHrefs}
        />
        <main className="min-h-screen bg-racing-black pt-28 pb-16">
          <section className="mx-auto max-w-4xl px-6">
            <div className="rounded-sm border border-red-500/40 bg-red-500/10 p-6 text-red-100">
              <h1 className="font-mono text-xl font-semibold tracking-wider uppercase">{i18n.notFound}</h1>
              <p className="mt-2 text-sm text-red-100/80">{profileResult.error}</p>
              <div className="mt-4 flex gap-3">
                <Link
                  href={lang === "en" ? "/results?lang=en" : "/results"}
                  className="rounded-sm border border-red-100/40 px-3 py-2 text-xs font-semibold tracking-wider uppercase"
                >
                  {i18n.backResults}
                </Link>
                <Link
                  href={lang === "en" ? "/?lang=en" : "/"}
                  className="rounded-sm border border-red-100/40 px-3 py-2 text-xs font-semibold tracking-wider uppercase"
                >
                  {i18n.backHome}
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer copy={chromeCopy.footer} />
      </>
    );
  }

  const profile = profileResult.profile;
  const historyResult = await getDriverHistory(slug, query)
    .then((history) => ({ history, error: null as string | null }))
    .catch((error: unknown) => ({
      history: { items: [], nextCursor: null },
      error: error instanceof Error ? error.message : i18n.noHistory,
    }));

  const historyCards = historyResult.history.items.map((event) => ({
    eventId: event.eventId,
    seasonYear: event.seasonYear,
    championshipSlug: event.championshipSlug,
    championshipName: event.championshipName,
    roundNumber: event.roundNumber,
    circuitName: event.circuitName,
    eventDate: event.eventDate,
    participants: [
      {
        driverSlug: profile.slug,
        driverName: profile.canonicalName,
        sessions: event.results.map((result) => ({
          sessionKind: result.sessionKind,
          sessionLabel: result.sessionLabel,
          position: result.position,
          status: result.status,
          rawValue: result.rawValue,
        })),
      },
    ],
  }));

  const numericPositions = historyResult.history.items
    .flatMap((event) => event.results.map((result) => result.position).filter((value): value is number => value !== null))
    .slice(0, 20)
    .reverse();

  const heatmapItems = historyResult.history.items.slice(0, 24).map((event) => {
    const bestSession = event.results.reduce(
      (best, session) => {
        if (!best) {
          return session;
        }

        if (session.position !== null && best.position !== null) {
          return session.position < best.position ? session : best;
        }

        if (session.position !== null && best.position === null) {
          return session;
        }

        return best;
      },
      null as (typeof event.results)[number] | null,
    );

    return {
      roundLabel: `${event.seasonYear} R${event.roundNumber}`,
      position: bestSession?.position ?? null,
      status: bestSession?.status ?? null,
    };
  });

  const incidents = profile.stats.dnf + profile.stats.dnq + profile.stats.dsq + profile.stats.absent;

  const nextHref = historyResult.history.nextCursor
    ? buildDriverHref({
        slug,
        year,
        championship,
        limit,
        cursor: historyResult.history.nextCursor,
        lang,
      })
    : null;

  const resetHref = buildDriverHref({
    slug,
    limit,
    lang,
  });

  return (
    <>
      <Navbar
        lang={lang}
        links={chromeCopy.navLinks}
        homeSectionsLabel={chromeCopy.homeSectionsLabel}
        homeSections={chromeCopy.homeSections}
        languageLabel={chromeCopy.languageLabel}
        languageAria={chromeCopy.languageAria}
        instagramHref={chromeCopy.contact.instagramHref}
        instagramAriaLabel={chromeCopy.contact.instagramAriaLabel}
        languageHrefs={languageHrefs}
      />
      <main className="min-h-screen bg-racing-black pt-28 pb-16">
        <section className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-sm border border-racing-steel/20 bg-racing-carbon/70 p-5">
            <div>
              <h1 className="font-mono text-2xl font-bold tracking-tight text-racing-white uppercase md:text-4xl">
                {profile.canonicalName}
              </h1>
              <p className="mt-2 text-sm text-racing-white/70">
                <span className={`fi fi-${profile.countryCode} mr-2 inline-block rounded-sm`} aria-hidden="true" />
                {lang === "en" ? profile.countryNameEn : profile.countryNameEs} -{" "}
                {lang === "en" ? profile.roleEn : profile.roleEs}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={lang === "en" ? "/results?lang=en" : "/results"}
                className="rounded-sm border border-racing-white/20 px-3 py-2 text-xs font-semibold tracking-wider text-racing-white uppercase transition-colors hover:border-racing-yellow hover:text-racing-yellow"
              >
                {i18n.backResults}
              </Link>
              <Link
                href={lang === "en" ? "/?lang=en" : "/"}
                className="rounded-sm border border-racing-white/20 px-3 py-2 text-xs font-semibold tracking-wider text-racing-white uppercase transition-colors hover:border-racing-yellow hover:text-racing-yellow"
              >
                {i18n.backHome}
              </Link>
            </div>
          </div>

          <section className="mt-6 rounded-sm border border-racing-steel/20 bg-racing-carbon/60 p-5">
            <h2 className="font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">
              {i18n.stats}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
              <div className="rounded-sm border border-racing-steel/20 bg-racing-black/40 p-3">
                <p className="text-xs text-racing-white/50">{i18n.wins}</p>
                <p className="mt-1 font-mono text-xl text-racing-yellow">{profile.stats.wins}</p>
              </div>
              <div className="rounded-sm border border-racing-steel/20 bg-racing-black/40 p-3">
                <p className="text-xs text-racing-white/50">{i18n.podiums}</p>
                <p className="mt-1 font-mono text-xl text-racing-yellow">{profile.stats.podiums}</p>
              </div>
              <div className="rounded-sm border border-racing-steel/20 bg-racing-black/40 p-3">
                <p className="text-xs text-racing-white/50">{i18n.top5}</p>
                <p className="mt-1 font-mono text-xl text-racing-yellow">{profile.stats.top5}</p>
              </div>
              <div className="rounded-sm border border-racing-steel/20 bg-racing-black/40 p-3">
                <p className="text-xs text-racing-white/50">{i18n.top10}</p>
                <p className="mt-1 font-mono text-xl text-racing-yellow">{profile.stats.top10}</p>
              </div>
              <div className="rounded-sm border border-racing-steel/20 bg-racing-black/40 p-3">
                <p className="text-xs text-racing-white/50">{i18n.completed}</p>
                <p className="mt-1 font-mono text-xl text-racing-yellow">{profile.stats.completed}</p>
              </div>
              <div className="rounded-sm border border-racing-steel/20 bg-racing-black/40 p-3">
                <p className="text-xs text-racing-white/50">{i18n.incidents}</p>
                <p className="mt-1 font-mono text-xl text-racing-yellow">{incidents}</p>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SparklinePositions positions={numericPositions} label={i18n.trend} lang={lang} />
            <TopXDistributionBars
              wins={profile.stats.wins}
              podiums={profile.stats.podiums}
              top5={profile.stats.top5}
              top10={profile.stats.top10}
              title={i18n.topx}
            />
            <StatusDonut
              completed={profile.stats.completed}
              dnf={profile.stats.dnf}
              dnq={profile.stats.dnq}
              dsq={profile.stats.dsq}
              absent={profile.stats.absent}
              title={i18n.statuses}
              lang={lang}
            />
            <RoundHeatmap title={i18n.heatmap} items={heatmapItems} lang={lang} />
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">
              {i18n.history}
            </h2>

            <form className="mb-5 grid gap-3 rounded-sm border border-racing-steel/20 bg-racing-carbon/70 p-4 md:grid-cols-4">
              {lang === "en" ? <input type="hidden" name="lang" value="en" /> : null}
              <input type="hidden" name="limit" value={limit} />

              <label className="text-xs text-racing-white/60">
                <span className="mb-1 block tracking-wider uppercase">{i18n.year}</span>
                <select
                  name="year"
                  defaultValue={year ?? ""}
                  className="w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm text-racing-white"
                >
                  <option value="">{i18n.allYears}</option>
                  {filters?.years.map((optionYear) => (
                    <option key={optionYear} value={optionYear}>
                      {optionYear}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-racing-white/60">
                <span className="mb-1 block tracking-wider uppercase">{i18n.championship}</span>
                <select
                  name="championship"
                  defaultValue={championship ?? ""}
                  className="w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm text-racing-white"
                >
                  <option value="">{i18n.allChampionships}</option>
                  {filters?.championships.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.seasonYear} - {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="self-end rounded-sm bg-racing-yellow px-4 py-2 text-xs font-bold tracking-wider text-racing-black uppercase"
              >
                {i18n.apply}
              </button>

              <Link
                href={resetHref}
                className="self-end rounded-sm border border-racing-white/20 px-4 py-2 text-center text-xs font-bold tracking-wider text-racing-white uppercase transition-colors hover:border-racing-yellow hover:text-racing-yellow"
              >
                {i18n.reset}
              </Link>
            </form>

            {historyResult.error ? (
              <div className="rounded-sm border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
                {historyResult.error}
              </div>
            ) : (
              <>
                <EventParticipationList
                  lang={lang}
                  events={historyCards}
                  emptyMessage={i18n.noHistory}
                  linkDrivers={false}
                />
                {nextHref ? (
                  <div className="mt-4">
                    <Link
                      href={nextHref}
                      className="inline-flex rounded-sm border border-racing-yellow/40 px-4 py-2 text-xs font-bold tracking-wider text-racing-yellow uppercase transition-colors hover:bg-racing-yellow/10"
                    >
                      {i18n.next}
                    </Link>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </section>
      </main>
      <Footer copy={chromeCopy.footer} />
    </>
  );
}
