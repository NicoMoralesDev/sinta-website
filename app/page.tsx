import { About } from "./components/about";
import { Calendar } from "./components/calendar";
import { Contact } from "./components/contact";
import { Footer } from "./components/footer";
import { Hero } from "./components/hero";
import { Navbar } from "./components/navbar";
import { Results } from "./components/results";
import { Team } from "./components/team";
import { resolveLanguage, siteCopy } from "./content/site-content";

type PageProps = {
  searchParams?: Promise<{ lang?: string }> | { lang?: string };
};

export default async function Page({ searchParams }: PageProps) {
  const params = await Promise.resolve(searchParams);
  const lang = resolveLanguage(params?.lang);
  const copy = siteCopy[lang];

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
        <Team copy={copy.team} />
        <Results lang={lang} copy={copy.results} />
        <Calendar lang={lang} copy={copy.calendar} />
        <Contact copy={copy.contact} />
      </main>
      <Footer copy={copy.footer} />
    </>
  );
}
