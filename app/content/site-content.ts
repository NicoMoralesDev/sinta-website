export type Language = "es" | "en";

export type NavLink = {
  href: string;
  label: string;
};

export type HeroCopy = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  highlightLine1: string;
  highlightLine2: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  scrollLabel: string;
  scrollAriaLabel: string;
};

export type Stat = {
  value: string;
  label: string;
};

export type AboutCopy = {
  eyebrow: string;
  titleStart: string;
  titleHighlight: string;
  paragraph1: string;
  paragraph2: string;
  stats: Stat[];
};

export type TeamMember = {
  name: string;
  role: string;
  country: string;
  countryCode: string;
};

export type TeamCopy = {
  eyebrow: string;
  titleStart: string;
  titleHighlight: string;
  members: readonly TeamMember[];
};

export type RaceResult = {
  event: string;
  series: string;
  position: number;
  driver: string;
  date: string;
};

export type ResultsCopy = {
  eyebrow: string;
  titleStart: string;
  titleHighlight: string;
  results: RaceResult[];
};

export type RaceEvent = {
  name: string;
  series: string;
  date: string;
  time: string;
  track: string;
};

export type CalendarCopy = {
  eyebrow: string;
  titleStart: string;
  titleHighlight: string;
  events: RaceEvent[];
};

export type ContactCopy = {
  eyebrow: string;
  titleStart: string;
  titleHighlight: string;
  description: string;
  secondaryCta: string;
  instagramAriaLabel: string;
  instagramHandle: string;
  instagramDescription: string;
  instagramCta: string;
  instagramHref: string;
};

export type FooterCopy = {
  navLabel: string;
  links: NavLink[];
  rights: string;
};

export type SiteCopy = {
  navLinks: NavLink[];
  navCta: string;
  languageLabel: string;
  languageAria: string;
  hero: HeroCopy;
  about: AboutCopy;
  team: TeamCopy;
  results: ResultsCopy;
  calendar: CalendarCopy;
  contact: ContactCopy;
  footer: FooterCopy;
};

const sharedMembers = {
  es: [
    { name: "Kevin Fontana", role: "Piloto", country: "Argentina", countryCode: "ar" },
    { name: "Humberto Marin", role: "Piloto", country: "Costa Rica", countryCode: "cr" },
    { name: "Kleyber Mestre", role: "Piloto", country: "Colombia", countryCode: "co" },
    { name: "Nicolas Morales", role: "Digital Lead / Piloto", country: "Argentina", countryCode: "ar" },
    { name: "Juan Manuel Pertica", role: "Piloto", country: "Argentina", countryCode: "ar" },
    { name: "Marcelo Villafuerte", role: "Piloto", country: "Ecuador", countryCode: "ec" },
    { name: "Facundo Zanuttini", role: "Capitan / Community Manager / Piloto", country: "Argentina", countryCode: "ar" },
  ],
  en: [
    { name: "Kevin Fontana", role: "Driver", country: "Argentina", countryCode: "ar" },
    { name: "Humberto Marin", role: "Driver", country: "Costa Rica", countryCode: "cr" },
    { name: "Kleyber Mestre", role: "Driver", country: "Colombia", countryCode: "co" },
    { name: "Nicolas Morales", role: "Digital Lead / Driver", country: "Argentina", countryCode: "ar" },
    { name: "Juan Manuel Pertica", role: "Driver", country: "Argentina", countryCode: "ar" },
    { name: "Marcelo Villafuerte", role: "Driver", country: "Ecuador", countryCode: "ec" },
    { name: "Facundo Zanuttini", role: "Captain / Community Manager / Driver", country: "Argentina", countryCode: "ar" },
  ],
} as const;

export const siteCopy: Record<Language, SiteCopy> = {
  es: {
    navLinks: [
      { label: "Quienes somos", href: "#about" },
      { label: "Miembros", href: "#team" },
      { label: "Resultados", href: "#results" },
      { label: "Calendario", href: "#calendar" },
      { label: "Contacto", href: "#contact" },
    ],
    navCta: "Unete",
    languageLabel: "Idioma",
    languageAria: "Cambiar idioma",
    hero: {
      eyebrow: "Equipo de Sim Racing",
      titleLine1: "Nacidos para",
      titleLine2: "Hechos para",
      highlightLine1: "correr.",
      highlightLine2: "ganar.",
      description:
        "SINTA eSports es un equipo competitivo de sim racing con pilotos de Latinoamerica, enfocado en consistencia, estrategia y rendimiento.",
      primaryCta: "Conocenos",
      secondaryCta: "Ver resultados",
      scrollLabel: "Desliza",
      scrollAriaLabel: "Ir a la seccion de quienes somos",
    },
    about: {
      eyebrow: "Quienes somos",
      titleStart: "Precision. Pasion.",
      titleHighlight: "Rendimiento.",
      paragraph1:
        "Nacimos como un grupo de pilotos con la misma obsesion: competir al maximo nivel en el sim racing. Entrenamos en equipo, analizamos telemetria y cuidamos cada detalle.",
      paragraph2:
        "Desde carreras sprint hasta endurance, representamos una mentalidad profesional dentro y fuera de pista, construyendo resultados sostenidos fecha a fecha.",
      stats: [
        { value: "50+", label: "Carreras disputadas" },
        { value: "15+", label: "Podios" },
        { value: "7", label: "Pilotos activos" },
      ],
    },
    team: {
      eyebrow: "Nuestro roster",
      titleStart: "Conoce al",
      titleHighlight: "equipo",
      members: sharedMembers.es,
    },
    results: {
      eyebrow: "Ultimas carreras",
      titleStart: "Resultados",
      titleHighlight: "recientes",
      results: [
        {
          event: "Interlagos Sprint",
          series: "iRacing GT3",
          position: 2,
          driver: "Kevin Fontana",
          date: "2026-01-25",
        },
        {
          event: "Spa Endurance 3H",
          series: "ACC Endurance",
          position: 1,
          driver: "Morales / Pertica / Zanuttini",
          date: "2026-01-18",
        },
        {
          event: "Road Atlanta Night Race",
          series: "iRacing IMSA",
          position: 3,
          driver: "Humberto Marin",
          date: "2026-01-10",
        },
        {
          event: "Monza Sprint Cup",
          series: "ACC Sprint",
          position: 2,
          driver: "Marcelo Villafuerte",
          date: "2025-12-21",
        },
      ],
    },
    calendar: {
      eyebrow: "Proximamente",
      titleStart: "Calendario",
      titleHighlight: "de carreras",
      events: [
        {
          name: "Watkins Glen 2H",
          series: "ACC Endurance",
          date: "2026-03-01",
          time: "18:00 ART",
          track: "Watkins Glen International",
        },
        {
          name: "Suzuka GT Sprint",
          series: "iRacing GT3",
          date: "2026-03-08",
          time: "20:00 ART",
          track: "Suzuka Circuit",
        },
        {
          name: "Imola Open Series",
          series: "ACC Sprint",
          date: "2026-03-15",
          time: "19:00 ART",
          track: "Autodromo Enzo e Dino Ferrari",
        },
        {
          name: "Silverstone Team Cup",
          series: "iRacing Team Event",
          date: "2026-03-22",
          time: "21:00 ART",
          track: "Silverstone Circuit",
        },
      ],
    },
    contact: {
      eyebrow: "Contacto",
      titleStart: "Quieres sumarte",
      titleHighlight: "a la grilla?",
      description:
        "Si eres piloto y buscas equipo, o marca interesada en colaborar, escribenos y conversemos.",
      secondaryCta: "Instagram",
      instagramAriaLabel: "Abrir Instagram de SINTA eSports",
      instagramHandle: "@sinta.esport",
      instagramDescription:
        "Seguinos para ver resultados, clips de carreras y novedades del equipo.",
      instagramCta: "Seguir en Instagram",
      instagramHref: "https://www.instagram.com/sinta.esport/",
    },
    footer: {
      navLabel: "Navegacion del pie",
      links: [
        { label: "Quienes somos", href: "#about" },
        { label: "Miembros", href: "#team" },
        { label: "Resultados", href: "#results" },
        { label: "Calendario", href: "#calendar" },
        { label: "Contacto", href: "#contact" },
      ],
      rights: "Todos los derechos reservados.",
    },
  },
  en: {
    navLinks: [
      { label: "About", href: "#about" },
      { label: "Team", href: "#team" },
      { label: "Results", href: "#results" },
      { label: "Calendar", href: "#calendar" },
      { label: "Contact", href: "#contact" },
    ],
    navCta: "Join us",
    languageLabel: "Language",
    languageAria: "Change language",
    hero: {
      eyebrow: "Sim Racing Team",
      titleLine1: "Born to",
      titleLine2: "Built to",
      highlightLine1: "race.",
      highlightLine2: "win.",
      description:
        "SINTA eSports is a competitive sim racing team with Latin American drivers focused on consistency, strategy, and performance.",
      primaryCta: "Discover us",
      secondaryCta: "View results",
      scrollLabel: "Scroll",
      scrollAriaLabel: "Scroll to the about section",
    },
    about: {
      eyebrow: "Who we are",
      titleStart: "Precision. Passion.",
      titleHighlight: "Performance.",
      paragraph1:
        "We started as a group of drivers sharing the same obsession: competing at the highest level in sim racing. We train as a team, review telemetry, and optimize every detail.",
      paragraph2:
        "From sprint races to endurance events, we bring a professional mindset on and off track, building consistent results season after season.",
      stats: [
        { value: "50+", label: "Races completed" },
        { value: "15+", label: "Podiums" },
        { value: "7", label: "Active drivers" },
      ],
    },
    team: {
      eyebrow: "Our roster",
      titleStart: "Meet the",
      titleHighlight: "team",
      members: sharedMembers.en,
    },
    results: {
      eyebrow: "Latest races",
      titleStart: "Recent",
      titleHighlight: "results",
      results: [
        {
          event: "Interlagos Sprint",
          series: "iRacing GT3",
          position: 2,
          driver: "Kevin Fontana",
          date: "2026-01-25",
        },
        {
          event: "Spa Endurance 3H",
          series: "ACC Endurance",
          position: 1,
          driver: "Morales / Pertica / Zanuttini",
          date: "2026-01-18",
        },
        {
          event: "Road Atlanta Night Race",
          series: "iRacing IMSA",
          position: 3,
          driver: "Humberto Marin",
          date: "2026-01-10",
        },
        {
          event: "Monza Sprint Cup",
          series: "ACC Sprint",
          position: 2,
          driver: "Marcelo Villafuerte",
          date: "2025-12-21",
        },
      ],
    },
    calendar: {
      eyebrow: "Upcoming",
      titleStart: "Race",
      titleHighlight: "calendar",
      events: [
        {
          name: "Watkins Glen 2H",
          series: "ACC Endurance",
          date: "2026-03-01",
          time: "18:00 ART",
          track: "Watkins Glen International",
        },
        {
          name: "Suzuka GT Sprint",
          series: "iRacing GT3",
          date: "2026-03-08",
          time: "20:00 ART",
          track: "Suzuka Circuit",
        },
        {
          name: "Imola Open Series",
          series: "ACC Sprint",
          date: "2026-03-15",
          time: "19:00 ART",
          track: "Autodromo Enzo e Dino Ferrari",
        },
        {
          name: "Silverstone Team Cup",
          series: "iRacing Team Event",
          date: "2026-03-22",
          time: "21:00 ART",
          track: "Silverstone Circuit",
        },
      ],
    },
    contact: {
      eyebrow: "Contact",
      titleStart: "Want to join",
      titleHighlight: "the grid?",
      description:
        "If you are a driver looking for a team, or a brand interested in partnering, reach out and let us talk.",
      secondaryCta: "Instagram",
      instagramAriaLabel: "Open SINTA eSports Instagram",
      instagramHandle: "@sinta.esport",
      instagramDescription:
        "Follow us for race highlights, short clips, and team updates.",
      instagramCta: "Follow on Instagram",
      instagramHref: "https://www.instagram.com/sinta.esport/",
    },
    footer: {
      navLabel: "Footer navigation",
      links: [
        { label: "About", href: "#about" },
        { label: "Team", href: "#team" },
        { label: "Results", href: "#results" },
        { label: "Calendar", href: "#calendar" },
        { label: "Contact", href: "#contact" },
      ],
      rights: "All rights reserved.",
    },
  },
};

export function resolveLanguage(value?: string): Language {
  return value === "en" ? "en" : "es";
}
