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

const CALENDAR_TIME_ZONE = "America/Argentina/Buenos_Aires";
const CALENDAR_SECTION_HASH = "#calendar";
const CALENDAR_TBD_TIME = {
  es: "Horario a confirmar",
  en: "Time TBD",
} as const;

type PageProps = {
  searchParams?: Promise<{ lang?: string }> | { lang?: string };
};

function getIsoDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function hasUpcomingEventDate<T extends { eventDate: string | null }>(
  event: T,
  todayIso: string,
): event is T & { eventDate: string } {
  return typeof event.eventDate === "string" && event.eventDate >= todayIso;
}

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
  const todayIso = getIsoDateInTimeZone(new Date(), CALENDAR_TIME_ZONE);
  const upcomingCalendarEvents = (currentChampionship?.events ?? [])
    .filter((event) => hasUpcomingEventDate(event, todayIso))
    .sort((left, right) => {
      const byDate = left.eventDate.localeCompare(right.eventDate);
      if (byDate !== 0) {
        return byDate;
      }
      return left.roundNumber - right.roundNumber;
    })
    .map((event) => ({
      name: `${lang === "en" ? "Round" : "Fecha"} ${event.roundNumber}`,
      series: event.championshipName,
      date: event.eventDate,
      time: CALENDAR_TBD_TIME[lang],
      track: event.circuitName,
    }));
  const showCalendarSection = upcomingCalendarEvents.length > 0;
  const homeSections = showCalendarSection
    ? copy.homeSections
    : copy.homeSections.filter((section) => !section.href.endsWith(CALENDAR_SECTION_HASH));

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
        homeSections={homeSections}
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
        {showCalendarSection ? (
          <Calendar lang={lang} copy={{ ...copy.calendar, events: upcomingCalendarEvents }} />
        ) : null}
        <Contact copy={copy.contact} />
      </main>
      <Footer copy={copy.footer} />
    </>
  );
}
