import Link from "next/link";

import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";
import { EventParticipationList } from "@/app/components/event-participation-list";
import { resolveLanguage, siteCopy } from "@/app/content/site-content";
import {
  getCurrentChampionship,
  getFilters,
  getResultsEventParticipation,
  getResultsStats,
} from "@/lib/server/history/service";

export const revalidate = 120;

type SearchValue = string | string[] | undefined;

type ResultsPageProps = {
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

function buildResultsHref({
  year,
  championshipId,
  championship,
  driver,
  limit,
  cursor,
  lang,
}: {
  year?: string;
  championshipId?: string;
  championship?: string;
  driver?: string;
  limit?: string;
  cursor?: string | null;
  lang: "es" | "en";
}): string {
  const params = new URLSearchParams();
  if (year) {
    params.set("year", year);
  }
  if (championshipId) {
    params.set("championshipId", championshipId);
  }
  if (championship) {
    params.set("championship", championship);
  }
  if (driver) {
    params.set("driver", driver);
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
  return query ? `/results?${query}` : "/results";
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const rawInput = await Promise.resolve(searchParams);
  const query = toSearchParams(rawInput);
  const lang = resolveLanguage(query.get("lang") ?? undefined);
  const chromeCopy = siteCopy[lang];
  const limit = query.get("limit") ?? "10";
  query.set("limit", limit);

  const year = query.get("year") ?? undefined;
  const championshipIdParam = query.get("championshipId") ?? undefined;
  const championship = query.get("championship") ?? undefined;
  const driver = query.get("driver") ?? undefined;

  const i18n =
    lang === "en"
      ? {
          eyebrow: "Results hub",
          title: "Browse historical race results",
          subtitle: "Filter by year, tournament, or driver.",
          year: "Year",
          championship: "Championship",
          driver: "Driver",
          allYears: "All years",
          allChampionships: "All championships",
          allDrivers: "All drivers",
          apply: "Apply filters",
          reset: "Reset",
          invalid: "Invalid filters. Check the URL parameters and try again.",
          rankingTitle: "Driver snapshot",
          currentTitle: "Current championship",
          backHome: "Back to home",
          next: "Load more",
          noLeaderboard: "No ranking data for this filter.",
          noCurrent: "Current championship is not available yet.",
          filterCurrent: "Open current championship",
          rankingDriver: "Driver",
        }
      : {
          eyebrow: "Historial",
          title: "Recorre todos los resultados",
          subtitle: "Filtra por año, torneo o piloto.",
          year: "Año",
          championship: "Torneo",
          driver: "Piloto",
          allYears: "Todos los años",
          allChampionships: "Todos los torneos",
          allDrivers: "Todos los pilotos",
          apply: "Aplicar filtros",
          reset: "Limpiar",
          invalid: "Filtros inválidos. Revisa los parámetros de la URL e intenta otra vez.",
          rankingTitle: "Resumen de pilotos",
          currentTitle: "Torneo vigente",
          backHome: "Volver al inicio",
          next: "Cargar más",
          noLeaderboard: "No hay ranking para este filtro.",
          noCurrent: "Todavía no hay torneo vigente disponible.",
          filterCurrent: "Abrir torneo vigente",
          rankingDriver: "Piloto",
        };

  const [filters, current] = await Promise.all([
    getFilters().catch(() => null),
    getCurrentChampionship(new URLSearchParams("limit=4")).catch(() => null),
  ]);

  const selectedChampionshipId =
    championshipIdParam ??
    filters?.championships.find((item) =>
      item.slug === championship && (year ? String(item.seasonYear) === year : true)
    )?.id;

  if (selectedChampionshipId) {
    query.set("championshipId", selectedChampionshipId);
    query.delete("championship");
  }

  const statsParams = new URLSearchParams();
  if (year) {
    statsParams.set("year", year);
  }
  if (selectedChampionshipId) {
    statsParams.set("championshipId", selectedChampionshipId);
  } else if (championship) {
    statsParams.set("championship", championship);
  }

  const [ranking, eventsResult] = await Promise.all([
    getResultsStats(statsParams).catch(() => []),
    getResultsEventParticipation(query)
      .then((result) => ({ result, error: null as string | null }))
      .catch((error: unknown) => ({
        result: { items: [], nextCursor: null },
        error: error instanceof Error ? error.message : i18n.invalid,
      })),
  ]);

  const languageHrefs = {
    es: buildResultsHref({
      year,
      championshipId: selectedChampionshipId,
      championship: selectedChampionshipId ? undefined : championship,
      driver,
      limit,
      cursor: query.get("cursor"),
      lang: "es",
    }),
    en: buildResultsHref({
      year,
      championshipId: selectedChampionshipId,
      championship: selectedChampionshipId ? undefined : championship,
      driver,
      limit,
      cursor: query.get("cursor"),
      lang: "en",
    }),
  };

  const resetHref = buildResultsHref({ lang, limit });
  const nextHref = eventsResult.result.nextCursor
    ? buildResultsHref({
        year,
        championshipId: selectedChampionshipId,
        championship: selectedChampionshipId ? undefined : championship,
        driver,
        limit,
        cursor: eventsResult.result.nextCursor,
        lang,
      })
    : null;
  const currentHref = current
    ? buildResultsHref({
        championship: current.championship.slug,
        championshipId: current.championship.id,
        year: String(current.championship.seasonYear),
        limit,
        lang,
      })
    : null;

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
          <div className="mb-8">
            <p className="font-mono text-xs tracking-[0.3em] text-racing-yellow uppercase">
              {i18n.eyebrow}
            </p>
            <h1 className="mt-2 font-mono text-3xl font-bold tracking-tight text-racing-white uppercase md:text-5xl">
              {i18n.title}
            </h1>
            <p className="mt-3 text-racing-white/60">{i18n.subtitle}</p>
          </div>

          <form className="mb-8 grid gap-3 rounded-sm border border-racing-steel/20 bg-racing-carbon/70 p-4 md:grid-cols-5">
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
                name="championshipId"
                defaultValue={selectedChampionshipId ?? ""}
                className="w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm text-racing-white"
              >
                <option value="">{i18n.allChampionships}</option>
                {filters?.championships.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.seasonYear} - {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-racing-white/60">
              <span className="mb-1 block tracking-wider uppercase">{i18n.driver}</span>
              <select
                name="driver"
                defaultValue={driver ?? ""}
                className="w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm text-racing-white"
              >
                <option value="">{i18n.allDrivers}</option>
                {filters?.drivers.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.canonicalName}
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

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              {eventsResult.error ? (
                <div className="rounded-sm border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-100">
                  <p>{i18n.invalid}</p>
                  <p className="mt-2 text-xs text-red-100/80">{eventsResult.error}</p>
                  <Link
                    href={resetHref}
                    className="mt-3 inline-flex rounded-sm border border-red-200/40 px-3 py-1.5 text-xs font-semibold tracking-wider uppercase"
                  >
                    {i18n.reset}
                  </Link>
                </div>
              ) : (
                <>
                  <EventParticipationList
                    lang={lang}
                    events={eventsResult.result.items}
                    emptyMessage={chromeCopy.results.emptyMessage}
                  />

                  {nextHref ? (
                    <div className="mt-5">
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
            </div>

            <aside className="space-y-4">
              <section className="rounded-sm border border-racing-steel/20 bg-racing-carbon/60 p-4">
                <h2 className="font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">
                  {i18n.rankingTitle}
                </h2>
                {ranking.length === 0 ? (
                  <p className="mt-3 text-sm text-racing-white/60">{i18n.noLeaderboard}</p>
                ) : (
                  <div className="mt-3 overflow-hidden rounded-sm border border-racing-steel/20 bg-racing-black/40">
                    <table className="w-full table-fixed border-collapse text-xs">
                      <colgroup>
                        <col />
                        <col className="w-10" />
                        <col className="w-10" />
                        <col className="w-12" />
                      </colgroup>
                      <thead className="border-b border-racing-steel/20 text-racing-white/55 uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left">{i18n.rankingDriver}</th>
                          <th className="px-2 py-2 text-right">W</th>
                          <th className="px-2 py-2 text-right">P</th>
                          <th className="px-3 py-2 text-right">T10</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranking.slice(0, 8).map((entry, index) => (
                          <tr
                            key={entry.driverSlug}
                            className={`border-b border-racing-steel/10 last:border-0 ${
                              index % 2 === 0 ? "bg-[#2c2c2c]" : "bg-[#202020]"
                            }`}
                          >
                            <td className="px-3 py-2 text-racing-white/85">{entry.canonicalName}</td>
                            <td className="px-2 py-2 text-right font-mono text-racing-yellow">{entry.wins}</td>
                            <td className="px-2 py-2 text-right font-mono text-racing-yellow">{entry.podiums}</td>
                            <td className="px-3 py-2 text-right font-mono text-racing-yellow">{entry.top10}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-sm border border-racing-steel/20 bg-racing-carbon/60 p-4">
                <h2 className="font-mono text-sm font-semibold tracking-wider text-racing-yellow uppercase">
                  {i18n.currentTitle}
                </h2>
                {current ? (
                  <>
                    <p className="mt-2 text-sm text-racing-white">
                      {current.championship.seasonYear} - {current.championship.name}
                    </p>
                    {current.leaderboard.length === 0 ? (
                      <p className="mt-3 text-sm text-racing-white/60">{i18n.noLeaderboard}</p>
                    ) : (
                      <div className="mt-3 overflow-hidden rounded-sm border border-racing-steel/20 bg-racing-black/40">
                        <table className="w-full table-fixed border-collapse text-xs">
                          <colgroup>
                            <col />
                            <col className="w-10" />
                            <col className="w-10" />
                            <col className="w-12" />
                          </colgroup>
                          <thead className="border-b border-racing-steel/20 text-racing-white/55 uppercase">
                            <tr>
                              <th className="px-3 py-2 text-left">{i18n.rankingDriver}</th>
                              <th className="px-2 py-2 text-right">W</th>
                              <th className="px-2 py-2 text-right">P</th>
                              <th className="px-3 py-2 text-right">T10</th>
                            </tr>
                          </thead>
                          <tbody>
                            {current.leaderboard.slice(0, 8).map((entry, index) => (
                              <tr
                                key={entry.driverSlug}
                                className={`border-b border-racing-steel/10 last:border-0 ${
                                  index % 2 === 0 ? "bg-[#2c2c2c]" : "bg-[#202020]"
                                }`}
                              >
                                <td className="px-3 py-2 text-racing-white/85">{entry.driverName}</td>
                                <td className="px-2 py-2 text-right font-mono text-racing-yellow">{entry.wins}</td>
                                <td className="px-2 py-2 text-right font-mono text-racing-yellow">{entry.podiums}</td>
                                <td className="px-3 py-2 text-right font-mono text-racing-yellow">{entry.top10}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {currentHref ? (
                      <Link
                        href={currentHref}
                        className="mt-4 inline-flex rounded-sm border border-racing-yellow/40 px-3 py-1.5 text-xs font-semibold tracking-wider text-racing-yellow uppercase"
                      >
                        {i18n.filterCurrent}
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-3 text-sm text-racing-white/60">{i18n.noCurrent}</p>
                )}
              </section>
            </aside>
          </div>
        </section>
      </main>
      <Footer copy={chromeCopy.footer} />
    </>
  );
}

