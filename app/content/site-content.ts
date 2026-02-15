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
  slug?: string;
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

export type ResultsCopy = {
  eyebrow: string;
  titleStart: string;
  titleHighlight: string;
  ctaAllResults: string;
  ctaCurrentChampionship: string;
  emptyMessage: string;
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
  homeSectionsLabel: string;
  homeSections: NavLink[];
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
    {
      name: "Leonel Bikaluk",
      role: "Piloto",
      country: "Argentina",
      countryCode: "ar",
    },
    {
      name: "Kevin Fontana",
      role: "Piloto",
      country: "Argentina",
      countryCode: "ar",
    },
    {
      name: "Humberto Marin",
      role: "Piloto",
      country: "Costa Rica",
      countryCode: "cr",
    },
    {
      name: "Kleyber Mestre",
      role: "Piloto",
      country: "Colombia",
      countryCode: "co",
    },
    {
      name: "Carlos Miño",
      role: "Piloto",
      country: "Argentina",
      countryCode: "ar",
    },
    {
      name: "Nicolas Morales",
      role: "Digital Lead / Piloto",
      country: "Argentina",
      countryCode: "ar",
    },
    {
      name: "Juan Manuel Pertica",
      role: "Piloto",
      country: "Argentina",
      countryCode: "ar",
    },
    {
      name: "Thomas Villafañe",
      role: "Piloto",
      country: "Argentina",
      countryCode: "ar",
    },
    {
      name: "Marcelo Villafuerte",
      role: "Piloto",
      country: "Ecuador",
      countryCode: "ec",
    },
    {
      name: "Facundo Zanuttini",
      role: "Capitán / Community Manager / Piloto",
      country: "Argentina",
      countryCode: "ar",
    },
  ],
  en: [
    {
      name: "Leonel Bikaluk",
      role: "Driver",
      country: "Argentina",
      countryCode: "ar",
    },
    {
      name: "Kevin Fontana",
      role: "Driver",
      country: "Argentina",
      countryCode: "ar",
    },
    {
      name: "Humberto Marin",
      role: "Driver",
      country: "Costa Rica",
      countryCode: "cr",
    },
    {
      name: "Kleyber Mestre",
      role: "Driver",
      country: "Colombia",
      countryCode: "co",
    },
    {
      name: "Carlos Miño",
      role: "Driver",
      country: "Argentina",
      countryCode: "ar",
    },
    {
      name: "Nicolas Morales",
      role: "Digital Lead / Driver",
      country: "Argentina",
      countryCode: "ar",
    },
    {
      name: "Juan Manuel Pertica",
      role: "Driver",
      country: "Argentina",
      countryCode: "ar",
    },
    {
      name: "Thomas Villafañe",
      role: "Driver",
      country: "Argentina",
      countryCode: "ar",
    },
    {
      name: "Marcelo Villafuerte",
      role: "Driver",
      country: "Ecuador",
      countryCode: "ec",
    },
    {
      name: "Facundo Zanuttini",
      role: "Captain / Community Manager / Driver",
      country: "Argentina",
      countryCode: "ar",
    },
  ],
} as const;

export const siteCopy: Record<Language, SiteCopy> = {
  es: {
    navLinks: [
      { label: "Inicio", href: "/" },
      { label: "Pilotos", href: "/drivers" },
      { label: "Historial", href: "/results" },
    ],
    homeSectionsLabel: "Secciones",
    homeSections: [
      { label: "Quienes somos", href: "/#about" },
      { label: "Equipo", href: "/#team" },
      { label: "Ultimas carreras", href: "/#results" },
      { label: "Calendario", href: "/#calendar" },
      { label: "Contacto", href: "/#contact" },
    ],
    navCta: "Únete",
    languageLabel: "Idioma",
    languageAria: "Cambiar idioma",
    hero: {
      eyebrow: "Equipo de Sim Racing",
      titleLine1: "Nacidos para",
      titleLine2: "Hechos para",
      highlightLine1: "correr.",
      highlightLine2: "ganar.",
      description:
        "SINTA eSports es un equipo competitivo de sim racing con pilotos de Latinoamérica, enfocado en consistencia, estrategia y rendimiento.",
      primaryCta: "Conócenos",
      secondaryCta: "Ver resultados",
      scrollLabel: "Desliza",
      scrollAriaLabel: "Ir a la sección de quiénes somos",
    },
    about: {
      eyebrow: "Quiénes somos",
      titleStart: "Precisión. Pasión.",
      titleHighlight: "Rendimiento.",
      paragraph1:
        "Nacimos como un grupo de pilotos con la misma obsesión: competir al máximo nivel en el sim racing. Entrenamos en equipo, analizamos telemetría y cuidamos cada detalle.",
      paragraph2:
        "Desde carreras sprint hasta endurance, representamos una mentalidad profesional dentro y fuera de pista, construyendo resultados sostenidos fecha a fecha.",
      stats: [
        { value: "50+", label: "Carreras disputadas" },
        { value: "15+", label: "Podios" },
        { value: "10", label: "Pilotos activos" },
      ],
    },
    team: {
      eyebrow: "Nuestro equipo",
      titleStart: "Conoce al",
      titleHighlight: "equipo",
      members: sharedMembers.es,
    },
    results: {
      eyebrow: "Últimas carreras",
      titleStart: "Participación",
      titleHighlight: "reciente",
      ctaAllResults: "Ver historial completo",
      ctaCurrentChampionship: "Ver torneo vigente",
      emptyMessage: "Todavía no hay eventos cargados.",
    },
    calendar: {
      eyebrow: "Próximamente",
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
      titleStart: "¿Quieres sumarte",
      titleHighlight: "a la grilla?",
      description:
        "Si eres piloto y buscas equipo, o marca interesada en colaborar, escríbenos y conversemos.",
      secondaryCta: "Instagram",
      instagramAriaLabel: "Abrir Instagram de SINTA eSports",
      instagramHandle: "@sinta.esport",
      instagramDescription:
        "Seguinos para ver resultados, clips de carreras y novedades del equipo.",
      instagramCta: "Seguir en Instagram",
      instagramHref: "https://www.instagram.com/sinta.esport/",
    },
    footer: {
      navLabel: "Navegación del pie",
      links: [
        { label: "Quiénes somos", href: "/#about" },
        { label: "Equipo", href: "/#team" },
        { label: "Pilotos", href: "/drivers" },
        { label: "Últimas carreras", href: "/#results" },
        { label: "Historial", href: "/results" },
        { label: "Calendario", href: "/#calendar" },
        { label: "Contacto", href: "/#contact" },
      ],
      rights: "Todos los derechos reservados.",
    },
  },
  en: {
    navLinks: [
      { label: "Home", href: "/?lang=en" },
      { label: "Drivers", href: "/drivers?lang=en" },
      { label: "Results", href: "/results?lang=en" },
    ],
    homeSectionsLabel: "Sections",
    homeSections: [
      { label: "About", href: "/?lang=en#about" },
      { label: "Team", href: "/?lang=en#team" },
      { label: "Latest races", href: "/?lang=en#results" },
      { label: "Calendar", href: "/?lang=en#calendar" },
      { label: "Contact", href: "/?lang=en#contact" },
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
        { value: "10", label: "Active drivers" },
      ],
    },
    team: {
      eyebrow: "Our team",
      titleStart: "Meet the",
      titleHighlight: "team",
      members: sharedMembers.en,
    },
    results: {
      eyebrow: "Latest races",
      titleStart: "Recent",
      titleHighlight: "participation",
      ctaAllResults: "Full results",
      ctaCurrentChampionship: "Current championship",
      emptyMessage: "No events loaded yet.",
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
      instagramDescription: "Follow us for race highlights, short clips, and team updates.",
      instagramCta: "Follow on Instagram",
      instagramHref: "https://www.instagram.com/sinta.esport/",
    },
    footer: {
      navLabel: "Footer navigation",
      links: [
        { label: "About", href: "/?lang=en#about" },
        { label: "Team", href: "/?lang=en#team" },
        { label: "Drivers", href: "/drivers?lang=en" },
        { label: "Latest races", href: "/?lang=en#results" },
        { label: "Results hub", href: "/results?lang=en" },
        { label: "Calendar", href: "/?lang=en#calendar" },
        { label: "Contact", href: "/?lang=en#contact" },
      ],
      rights: "All rights reserved.",
    },
  },
};

export function resolveLanguage(value?: string): Language {
  return value === "en" ? "en" : "es";
}

