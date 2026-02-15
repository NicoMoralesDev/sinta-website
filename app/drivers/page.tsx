import Link from "next/link";

import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";
import { resolveLanguage, siteCopy } from "@/app/content/site-content";
import { getDriverList } from "@/lib/server/history/service";

export const revalidate = 120;

type SearchValue = string | string[] | undefined;

type DriversPageProps = {
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

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildDriversHref({
  lang,
  q,
  active,
}: {
  lang: "es" | "en";
  q?: string;
  active?: string;
}): string {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (active && active !== "true") {
    params.set("active", active);
  }
  if (lang === "en") {
    params.set("lang", "en");
  }

  const query = params.toString();
  return query ? `/drivers?${query}` : "/drivers";
}

function buildDriverProfileHref(slug: string, lang: "es" | "en"): string {
  return lang === "en" ? `/drivers/${slug}?lang=en` : `/drivers/${slug}`;
}

export default async function DriversPage({ searchParams }: DriversPageProps) {
  const rawSearchParams = await Promise.resolve(searchParams);
  const query = toSearchParams(rawSearchParams);
  const lang = resolveLanguage(query.get("lang") ?? undefined);
  const chromeCopy = siteCopy[lang];

  const q = query.get("q")?.trim() ?? "";
  const active = query.get("active") ?? "true";

  const i18n =
    lang === "en"
      ? {
          eyebrow: "Drivers",
          title: "SINTA drivers",
          subtitle: "Explore every driver profile and jump to detailed results.",
          search: "Search",
          searchPlaceholder: "Name, country, or role",
          status: "Status",
          activeOnly: "Active only",
          allDrivers: "All drivers",
          apply: "Apply filters",
          reset: "Reset",
          noResults: "No drivers match your current filters.",
          backHome: "Back to home",
          backResults: "Back to results",
          openProfile: "Open profile",
          countryLabel: "Country",
          roleLabel: "Role",
        }
      : {
          eyebrow: "Pilotos",
          title: "Pilotos de SINTA",
          subtitle: "Explora cada perfil y accede al detalle de resultados.",
          search: "Buscar",
          searchPlaceholder: "Nombre, país o rol",
          status: "Estado",
          activeOnly: "Solo activos",
          allDrivers: "Todos los pilotos",
          apply: "Aplicar filtros",
          reset: "Limpiar",
          noResults: "No hay pilotos que coincidan con estos filtros.",
          backHome: "Volver al inicio",
          backResults: "Volver al historial",
          openProfile: "Abrir perfil",
          countryLabel: "País",
          roleLabel: "Rol",
        };

  const languageHrefs = {
    es: buildDriversHref({ lang: "es", q, active }),
    en: buildDriversHref({ lang: "en", q, active }),
  };

  const serviceParams = new URLSearchParams();
  if (lang === "en") {
    serviceParams.set("lang", "en");
  }
  if (active === "false") {
    serviceParams.set("active", "false");
  }

  const drivers = await getDriverList(serviceParams).catch(() => []);
  const normalizedQuery = normalizeText(q);
  const filteredDrivers = normalizedQuery
    ? drivers.filter((driver) => {
        const haystack = normalizeText(`${driver.canonicalName} ${driver.countryName} ${driver.role}`);
        return haystack.includes(normalizedQuery);
      })
    : drivers;

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

          <form className="mb-8 grid gap-3 rounded-sm border border-racing-steel/20 bg-racing-carbon/70 p-4 md:grid-cols-[2fr_1fr_auto_auto]">
            {lang === "en" ? <input type="hidden" name="lang" value="en" /> : null}
            <label className="text-xs text-racing-white/60">
              <span className="mb-1 block tracking-wider uppercase">{i18n.search}</span>
              <input
                name="q"
                defaultValue={q}
                placeholder={i18n.searchPlaceholder}
                className="w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm text-racing-white"
              />
            </label>

            <label className="text-xs text-racing-white/60">
              <span className="mb-1 block tracking-wider uppercase">{i18n.status}</span>
              <select
                name="active"
                defaultValue={active}
                className="w-full rounded-sm border border-racing-steel/40 bg-racing-black px-3 py-2 text-sm text-racing-white"
              >
                <option value="true">{i18n.activeOnly}</option>
                <option value="false">{i18n.allDrivers}</option>
              </select>
            </label>

            <button
              type="submit"
              className="self-end rounded-sm bg-racing-yellow px-4 py-2 text-xs font-bold tracking-wider text-racing-black uppercase"
            >
              {i18n.apply}
            </button>

            <Link
              href={buildDriversHref({ lang })}
              className="self-end rounded-sm border border-racing-white/20 px-4 py-2 text-center text-xs font-bold tracking-wider text-racing-white uppercase transition-colors hover:border-racing-yellow hover:text-racing-yellow"
            >
              {i18n.reset}
            </Link>
          </form>

          {filteredDrivers.length === 0 ? (
            <div className="rounded-sm border border-racing-steel/20 bg-racing-carbon/50 p-6 text-sm text-racing-white/60">
              {i18n.noResults}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDrivers.map((driver, index) => (
                <article
                  key={driver.slug}
                  className="motion-safe:animate-slide-up group relative overflow-hidden rounded-sm border border-racing-steel/25 bg-racing-carbon/65"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="h-1 w-full bg-racing-steel/30 transition-colors group-hover:bg-racing-yellow" />
                  <div className="flex h-full flex-col p-5">
                    <div>
                      <h2 className="font-mono text-lg font-bold tracking-wide text-racing-white uppercase">
                        {driver.canonicalName}
                      </h2>
                    </div>

                    <dl className="mt-4 space-y-2 text-xs">
                      <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                        <dt className="text-racing-white/45 uppercase">{i18n.countryLabel}</dt>
                        <dd className="inline-flex items-center gap-2 text-racing-white/75">
                          <span className={`fi fi-${driver.countryCode} rounded-sm`} aria-hidden="true" />
                          <span>{driver.countryName}</span>
                        </dd>
                      </div>
                      <div className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-2">
                        <dt className="text-racing-white/45 uppercase">{i18n.roleLabel}</dt>
                        <dd className="text-racing-yellow/85 uppercase">{driver.role}</dd>
                      </div>
                    </dl>

                    <Link
                      href={buildDriverProfileHref(driver.slug, lang)}
                      className="mt-6 inline-flex h-9 items-center justify-center rounded-sm border border-racing-yellow/40 px-3 text-xs font-semibold tracking-wider text-racing-yellow uppercase transition-colors hover:bg-racing-yellow/10"
                    >
                      {i18n.openProfile}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <Link
              href={lang === "en" ? "/?lang=en" : "/"}
              className="rounded-sm border border-racing-white/20 px-4 py-2 text-xs font-bold tracking-wider text-racing-white uppercase transition-colors hover:border-racing-yellow hover:text-racing-yellow"
            >
              {i18n.backHome}
            </Link>
            <Link
              href={lang === "en" ? "/results?lang=en" : "/results"}
              className="rounded-sm border border-racing-white/20 px-4 py-2 text-xs font-bold tracking-wider text-racing-white uppercase transition-colors hover:border-racing-yellow hover:text-racing-yellow"
            >
              {i18n.backResults}
            </Link>
          </div>
        </section>
      </main>

      <Footer copy={chromeCopy.footer} />
    </>
  );
}

