import { About } from "./components/about";
import { Calendar } from "./components/calendar";
import { Contact } from "./components/contact";
import { Footer } from "./components/footer";
import { Hero } from "./components/hero";
import { Navbar } from "./components/navbar";
import { Results } from "./components/results";
import { Team } from "./components/team";
import { resolveLanguage, siteCopy } from "./content/site-content";
import {
  getHomeCurrentChampionship,
  getHomeLiveBroadcast,
  getHomeOverviewKpis,
  getHomeRecentEventParticipation,
  getHomeTeamMembers,
} from "@/lib/server/history/service";

export const revalidate = 120;

type PageProps = {
  searchParams?: Promise<{ lang?: string }> | { lang?: string };
};

export default async function Page({ searchParams }: PageProps) {
  const params = await Promise.resolve(searchParams);
  const lang = resolveLanguage(params?.lang);
  const copy = siteCopy[lang];

  const [teamMembers, kpis, recentEvents, currentChampionship, liveBroadcast] = await Promise.all([
    getHomeTeamMembers(lang).catch(() => null),
    getHomeOverviewKpis().catch(() => null),
    getHomeRecentEventParticipation(5).catch(() => null),
    getHomeCurrentChampionship().catch(() => null),
    getHomeLiveBroadcast().catch(() => null),
  ]);

  const numberFormatter = new Intl.NumberFormat(lang === "en" ? "en-US" : "es-AR");

  const aboutCopy = kpis
    ? {
        ...copy.about,
        stats: lang === "en"
          ? [
              { value: numberFormatter.format(kpis.racesCompleted), label: "Races completed" },
              { value: numberFormatter.format(kpis.podiums), label: "Podiums" },
              { value: numberFormatter.format(kpis.wins), label: "Wins" },
              { value: numberFormatter.format(kpis.activeDrivers), label: "Active drivers" },
            ]
          : [
              { value: numberFormatter.format(kpis.racesCompleted), label: "Carreras disputadas" },
              { value: numberFormatter.format(kpis.podiums), label: "Podios" },
              { value: numberFormatter.format(kpis.wins), label: "Victorias" },
              { value: numberFormatter.format(kpis.activeDrivers), label: "Pilotos activos" },
            ],
      }
    : copy.about;

  const teamCopy = teamMembers
    ? {
        ...copy.team,
        members: teamMembers.map((member) => ({
          slug: member.slug,
          name: member.canonicalName,
          role: member.role,
          country: member.country,
          countryCode: member.countryCode,
        })),
      }
    : copy.team;

  return (
    <>
      <Navbar
        lang={lang}
        links={copy.navLinks}
        homeSectionsLabel={copy.homeSectionsLabel}
        homeSections={copy.homeSections}
        languageLabel={copy.languageLabel}
        languageAria={copy.languageAria}
        instagramHref={copy.contact.instagramHref}
        instagramAriaLabel={copy.contact.instagramAriaLabel}
      />
      <main>
        <Hero copy={copy.hero} lang={lang} liveBroadcast={liveBroadcast} />
        <About copy={aboutCopy} />
        <Team lang={lang} copy={teamCopy} />
        <Results
          lang={lang}
          copy={copy.results}
          events={recentEvents ?? []}
          currentChampionship={currentChampionship?.championship}
        />
        <Calendar lang={lang} copy={copy.calendar} />
        <Contact copy={copy.contact} />
      </main>
      <Footer copy={copy.footer} />
    </>
  );
}
