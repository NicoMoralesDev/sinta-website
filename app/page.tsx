import { About } from "./components/about";
import { Calendar } from "./components/calendar";
import { Contact } from "./components/contact";
import { Footer } from "./components/footer";
import { Hero } from "./components/hero";
import { Navbar } from "./components/navbar";
import { Results } from "./components/results";
import { Team } from "./components/team";
import { resolveLanguage, siteCopy } from "./content/site-content";
import { getHomeHighlights, getHomeTeamMembers } from "@/lib/server/history/service";

type PageProps = {
  searchParams?: Promise<{ lang?: string }> | { lang?: string };
};

export default async function Page({ searchParams }: PageProps) {
  const params = await Promise.resolve(searchParams);
  const lang = resolveLanguage(params?.lang);
  const copy = siteCopy[lang];

  const [teamMembers, highlightResults] = await Promise.all([
    getHomeTeamMembers(lang).catch(() => null),
    getHomeHighlights(lang).catch(() => null),
  ]);

  const teamCopy = teamMembers
    ? {
        ...copy.team,
        members: teamMembers.map((member) => ({
          name: member.canonicalName,
          role: member.role,
          country: member.country,
          countryCode: member.countryCode,
        })),
      }
    : copy.team;

  const resultsCopy = highlightResults
    ? {
        ...copy.results,
        results: highlightResults,
      }
    : copy.results;

  return (
    <>
      <Navbar
        lang={lang}
        links={copy.navLinks}
        languageLabel={copy.languageLabel}
        languageAria={copy.languageAria}
        instagramHref={copy.contact.instagramHref}
        instagramAriaLabel={copy.contact.instagramAriaLabel}
      />
      <main>
        <Hero copy={copy.hero} />
        <About copy={copy.about} />
        <Team copy={teamCopy} />
        <Results lang={lang} copy={resultsCopy} />
        <Calendar lang={lang} copy={copy.calendar} />
        <Contact copy={copy.contact} />
      </main>
      <Footer copy={copy.footer} />
    </>
  );
}
